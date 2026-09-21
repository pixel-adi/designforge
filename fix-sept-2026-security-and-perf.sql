-- =========================================================================================
-- SEPT 2026 — SECURITY WARNINGS REMEDIATION + PERFORMANCE HARDENING
-- Run in Supabase Dashboard → SQL Editor (one shot, idempotent)
-- =========================================================================================
-- Fixes:
--   1. rls_policy_always_true           → cohort_leads DELETE policy
--   2. anon_security_definer (×3)       → prep_is_owner, prep_prevent_mentor_tampering,
--                                          prep_prevent_notes_self_unlock
--   3. authenticated_security_definer (×5) → is_admin, is_sme_or_admin, prep_is_owner,
--                                            prep_prevent_mentor_tampering,
--                                            prep_prevent_notes_self_unlock
--   4. auth_leaked_password_protection  → (must toggle in Dashboard → Auth → Security)
--   5. Performance indexes & guardrails for high-traffic scale-up
-- =========================================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FIX: rls_policy_always_true on cohort_leads DELETE
--    Only admins (Designforge staff) should be able to delete leads.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated delete cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow authenticated delete cohort_leads"
  ON public.cohort_leads
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt()->>'email' LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Move prep_is_owner into private schema & lock down public copy
--    The function is only called inside RLS policies (never via client RPC).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS private;

-- Private copy (used by RLS via search_path; not exposed to PostgREST)
CREATE OR REPLACE FUNCTION private.prep_is_owner(p_candidate_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.exam_candidates
    WHERE id = p_candidate_id AND auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant to roles that need it for RLS evaluation
GRANT USAGE ON SCHEMA private TO authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION private.prep_is_owner(UUID) TO authenticated, postgres, service_role;

-- Revoke the public-schema copy from anon/authenticated to silence the linter
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'prep_is_owner'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.prep_is_owner(UUID) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.prep_is_owner(UUID) TO postgres, service_role;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Lock down prep_prevent_mentor_tampering (trigger function, never called via RPC)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'prep_prevent_mentor_tampering'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.prep_prevent_mentor_tampering() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.prep_prevent_mentor_tampering() TO postgres, service_role;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Lock down prep_prevent_notes_self_unlock (trigger function, never called via RPC)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'prep_prevent_notes_self_unlock'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.prep_prevent_notes_self_unlock() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.prep_prevent_notes_self_unlock() TO postgres, service_role;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Lock down is_admin and is_sme_or_admin (private copies already exist)
--    Re-run the revokes in case fix-signed-in-security-definer.sql was undone
--    by a later migration re-creating the public versions.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres, service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_sme_or_admin'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.is_sme_or_admin() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.is_sme_or_admin() TO postgres, service_role;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Update prep tracker RLS to call private.prep_is_owner
--    (so the public.prep_is_owner revoke doesn't break row access)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'prep_enrolments', 'prep_diagnostic_scores', 'prep_task_completions',
    'prep_simulation_logs', 'prep_error_ledger_entries', 'prep_critique_submissions',
    'prep_sunday_reviews', 'prep_diary_entries', 'prep_explanation_cards',
    'prep_awareness_cards', 'prep_build_records', 'prep_articulation_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Drop old policy that references public.prep_is_owner
    EXECUTE format('DROP POLICY IF EXISTS "Candidate manage own %I" ON public.%I', tbl, tbl);

    -- Recreate using private.prep_is_owner
    EXECUTE format(
      'CREATE POLICY "Candidate manage own %I" ON public.%I
       FOR ALL TO authenticated
       USING (private.prep_is_owner(candidate_id))
       WITH CHECK (private.prep_is_owner(candidate_id))',
      tbl, tbl
    );
  END LOOP;
END $$;


-- =========================================================================================
-- PERFORMANCE HARDENING FOR HIGH TRAFFIC
-- =========================================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Additional composite indexes for hot query paths
-- ─────────────────────────────────────────────────────────────────────────────

-- Prep tracker: task completions are the most queried table (dashboard counts)
CREATE INDEX IF NOT EXISTS idx_prep_completions_candidate_task
  ON public.prep_task_completions(candidate_id, task_id);

-- Prep tracker: simulation lookups by candidate + date (weekly view)
CREATE INDEX IF NOT EXISTS idx_prep_simulations_candidate_date
  ON public.prep_simulation_logs(candidate_id, date DESC);

-- Prep tracker: error ledger by candidate + bucket (bucket analysis)
CREATE INDEX IF NOT EXISTS idx_prep_error_ledger_candidate_bucket
  ON public.prep_error_ledger_entries(candidate_id, bucket);

-- Prep tracker: diagnostic scores by candidate + week (re-score lookup)
CREATE INDEX IF NOT EXISTS idx_prep_diagnostic_candidate_week
  ON public.prep_diagnostic_scores(candidate_id, week);

-- Prep tracker: sunday reviews by candidate + week (unique constraint already exists, index backs it)
CREATE INDEX IF NOT EXISTS idx_prep_sunday_candidate_week
  ON public.prep_sunday_reviews(candidate_id, week);

-- Prep tracker: enrolments by track (for aggregate analytics)
CREATE INDEX IF NOT EXISTS idx_prep_enrolments_track
  ON public.prep_enrolments(track);

-- Staff lookups: staff_users by role (for admin/sme checks)
CREATE INDEX IF NOT EXISTS idx_staff_users_role
  ON public.staff_users(role);

-- Auth lookup: exam_candidates covering index for RLS ownership checks
CREATE INDEX IF NOT EXISTS idx_exam_candidates_auth_id_covering
  ON public.exam_candidates(auth_user_id, id);

-- Cohort leads: index for admin listing (sorted by date)
CREATE INDEX IF NOT EXISTS idx_cohort_leads_created_desc
  ON public.cohort_leads(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Statement timeout guard (prevents runaway queries from blocking the pool)
-- ─────────────────────────────────────────────────────────────────────────────
-- Set a 30-second ceiling for authenticated role queries
ALTER ROLE authenticated SET statement_timeout = '30s';

-- Anon gets a tighter 10-second ceiling (public forms only)
ALTER ROLE anon SET statement_timeout = '10s';

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Analyze all touched tables so the planner has fresh stats
-- ─────────────────────────────────────────────────────────────────────────────
ANALYZE public.cohort_leads;
ANALYZE public.exam_candidates;
ANALYZE public.staff_users;
ANALYZE public.prep_enrolments;
ANALYZE public.prep_task_completions;
ANALYZE public.prep_simulation_logs;
ANALYZE public.prep_error_ledger_entries;
ANALYZE public.prep_diagnostic_scores;
ANALYZE public.prep_sunday_reviews;
ANALYZE public.prep_critique_submissions;
ANALYZE public.prep_diary_entries;
ANALYZE public.prep_explanation_cards;
ANALYZE public.prep_awareness_cards;
ANALYZE public.prep_build_records;
ANALYZE public.prep_articulation_logs;
ANALYZE public.exam_attempts;
ANALYZE public.exam_responses;

COMMIT;

-- =========================================================================================
-- MANUAL STEP REQUIRED (cannot be done via SQL):
--
-- Fix: auth_leaked_password_protection
--   → Go to Supabase Dashboard → Authentication → Security
--   → Under "Password strength & leaked password protection"
--   → Toggle ON "Enable leaked password protection"
--   → This checks passwords against HaveIBeenPwned.org on sign-up/password change.
-- =========================================================================================
