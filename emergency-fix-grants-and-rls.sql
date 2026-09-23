-- =========================================================================================
-- EMERGENCY FIX: Restore table grants + rewire RLS from public.is_admin()
--
-- Root cause: 
--   1. REVOKE ALL on exam_attempts/exam_responses removed table-level grants
--      for both anon AND authenticated roles. Even with valid RLS policies,
--      Postgres requires table-level GRANT before evaluating RLS.
--   2. public.is_admin() EXECUTE was revoked but policies still reference it.
--
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor.
-- =========================================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Ensure private schema admin functions exist with correct grants
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt()->>'email' LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION private.is_sme_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt()->>'email' LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'sme')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT USAGE ON SCHEMA private TO authenticated, anon, postgres, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, anon, postgres, service_role;
GRANT EXECUTE ON FUNCTION private.is_sme_or_admin() TO authenticated, anon, postgres, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RESTORE TABLE-LEVEL GRANTS for authenticated role
--    Without these, RLS policies are never even evaluated — Postgres
--    rejects with "permission denied for table" before checking policies.
-- ─────────────────────────────────────────────────────────────────────────────

-- exam_attempts: candidates need SELECT, INSERT, UPDATE
GRANT SELECT, INSERT, UPDATE ON public.exam_attempts TO authenticated;

-- exam_responses: candidates need SELECT, INSERT, UPDATE
GRANT SELECT, INSERT, UPDATE ON public.exam_responses TO authenticated;

-- exam_candidates: candidates need SELECT, INSERT, UPDATE  
GRANT SELECT, INSERT, UPDATE ON public.exam_candidates TO authenticated;

-- exam_tests: candidates need SELECT (to see published tests)
GRANT SELECT ON public.exam_tests TO authenticated;

-- exam_test_sections: candidates need SELECT
GRANT SELECT ON public.exam_test_sections TO authenticated;

-- exam_test_questions: candidates need SELECT
GRANT SELECT ON public.exam_test_questions TO authenticated;

-- exam_questions: candidates need SELECT
GRANT SELECT ON public.exam_questions TO authenticated;

-- exam_options: candidates need SELECT
GRANT SELECT ON public.exam_options TO authenticated;

-- exam_programs: candidates need SELECT
GRANT SELECT ON public.exam_programs TO authenticated;

-- exam_feature_requests: candidates need SELECT, INSERT
GRANT SELECT, INSERT ON public.exam_feature_requests TO authenticated;

-- staff_users: authenticated needs SELECT for admin role check
GRANT SELECT ON public.staff_users TO authenticated;

-- registrations: admin needs full access
GRANT SELECT ON public.registrations TO authenticated;

-- subscribers: admin needs SELECT
GRANT SELECT ON public.subscribers TO authenticated;

-- study_materials: candidates need SELECT
GRANT SELECT ON public.study_materials TO authenticated;

-- class_assignments: candidates need SELECT
GRANT SELECT ON public.class_assignments TO authenticated;

-- assignment_submissions: candidates need SELECT, INSERT
GRANT SELECT, INSERT ON public.assignment_submissions TO authenticated;

-- system_settings: staff needs SELECT
GRANT SELECT ON public.system_settings TO authenticated;

-- Prep tracker tables
GRANT SELECT, INSERT, UPDATE ON public.prep_enrolments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_task_completions TO authenticated;
GRANT SELECT, INSERT ON public.prep_diagnostic_scores TO authenticated;
GRANT SELECT ON public.prep_exam_plans TO authenticated;
GRANT SELECT, INSERT ON public.prep_simulation_logs TO authenticated;
GRANT SELECT, INSERT ON public.prep_error_ledger_entries TO authenticated;
GRANT SELECT, INSERT ON public.prep_critique_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prep_sunday_reviews TO authenticated;
GRANT SELECT, INSERT ON public.prep_diary_entries TO authenticated;
GRANT SELECT, INSERT ON public.prep_explanation_cards TO authenticated;
GRANT SELECT, INSERT ON public.prep_awareness_cards TO authenticated;
GRANT SELECT, INSERT ON public.prep_build_records TO authenticated;
GRANT SELECT, INSERT ON public.prep_articulation_logs TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Ensure RLS is enabled on critical tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.exam_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_responses ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Recreate RLS policies for exam_attempts and exam_responses
--    (These are the two tables returning "permission denied for table")
-- ─────────────────────────────────────────────────────────────────────────────

-- exam_attempts
DROP POLICY IF EXISTS "Candidates can manage their own attempts" ON public.exam_attempts;
CREATE POLICY "Candidates can manage their own attempts"
  ON public.exam_attempts FOR ALL TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
    ) OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
    ) OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
  );

-- exam_responses
DROP POLICY IF EXISTS "Candidates can manage their own responses" ON public.exam_responses;
CREATE POLICY "Candidates can manage their own responses"
  ON public.exam_responses FOR ALL TO authenticated
  USING (
    attempt_id IN (
      SELECT id FROM public.exam_attempts WHERE candidate_id IN (
        SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
      )
    ) OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
  )
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM public.exam_attempts WHERE candidate_id IN (
        SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
      )
    ) OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
  );

-- exam_candidates (ensure all four operation policies exist)
DROP POLICY IF EXISTS "Candidates can read their own profile" ON public.exam_candidates;
DROP POLICY IF EXISTS "Candidates can insert their own profile" ON public.exam_candidates;
DROP POLICY IF EXISTS "Candidates can update their own profile" ON public.exam_candidates;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.exam_candidates;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.exam_candidates;

CREATE POLICY "Candidates can read their own profile"
  ON public.exam_candidates FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "Candidates can insert their own profile"
  ON public.exam_candidates FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid() OR auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "Candidates can update their own profile"
  ON public.exam_candidates FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid() OR auth.jwt()->>'email' LIKE '%@designforge.co.in')
  WITH CHECK (auth_user_id = auth.uid() OR auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "Admins can manage profiles"
  ON public.exam_candidates FOR ALL TO authenticated
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in')
  WITH CHECK (auth.jwt()->>'email' LIKE '%@designforge.co.in');


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Rewire any remaining RLS policies that call public.is_admin()
-- ─────────────────────────────────────────────────────────────────────────────

-- staff_users
DROP POLICY IF EXISTS "Allow admins full access to staff_users" ON public.staff_users;
CREATE POLICY "Allow admins full access to staff_users" ON public.staff_users
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Allow any authenticated user to read their own staff row (for role lookup)
DROP POLICY IF EXISTS "Staff can read own role" ON public.staff_users;
CREATE POLICY "Staff can read own role" ON public.staff_users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- exam_questions
DROP POLICY IF EXISTS "Admins and SMEs have full access to questions" ON public.exam_questions;
CREATE POLICY "Admins and SMEs have full access to questions" ON public.exam_questions
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- exam_options
DROP POLICY IF EXISTS "Admins and SMEs have full access to options" ON public.exam_options;
DROP POLICY IF EXISTS "Admins have full access to options" ON public.exam_options;
CREATE POLICY "Admins and SMEs have full access to options" ON public.exam_options
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- study_materials
DROP POLICY IF EXISTS "Admins and SMEs manage materials" ON public.study_materials;
DROP POLICY IF EXISTS "Admins manage materials" ON public.study_materials;
CREATE POLICY "Admins and SMEs manage materials" ON public.study_materials
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- class_assignments
DROP POLICY IF EXISTS "Admins and SMEs manage assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins manage assignments" ON public.class_assignments;
CREATE POLICY "Admins and SMEs manage assignments" ON public.class_assignments
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- exam_tests
DROP POLICY IF EXISTS "Admins have full access to tests" ON public.exam_tests;
CREATE POLICY "Admins have full access to tests" ON public.exam_tests
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- exam_test_sections
DROP POLICY IF EXISTS "Admins have full access to test sections" ON public.exam_test_sections;
CREATE POLICY "Admins have full access to test sections" ON public.exam_test_sections
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- exam_test_questions
DROP POLICY IF EXISTS "Admins have full access to test questions links" ON public.exam_test_questions;
CREATE POLICY "Admins have full access to test questions links" ON public.exam_test_questions
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- system_settings
DROP POLICY IF EXISTS "Allow staff to read settings" ON public.system_settings;
CREATE POLICY "Allow staff to read settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING (private.is_sme_or_admin() OR private.is_admin());

DROP POLICY IF EXISTS "Allow admins to manage settings" ON public.system_settings;
CREATE POLICY "Allow admins to manage settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Grant EXECUTE on public.is_admin() back to authenticated
--    Even though we're using private.is_admin() in policies now,
--    this prevents any leftover reference from crashing.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_sme_or_admin'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.is_sme_or_admin() TO authenticated;
  END IF;
END $$;


COMMIT;
