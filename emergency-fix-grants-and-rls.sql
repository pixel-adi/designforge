-- =========================================================================================
-- COMPLETE DATABASE RESTORATION & RLS REPAIR SCRIPT
-- Run this in Supabase Dashboard → SQL Editor
-- =========================================================================================

-- 1. Helper functions (both in public and private schemas for compatibility)
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_sme_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'sme')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
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
    coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'sme')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution permissions
GRANT USAGE ON SCHEMA private TO authenticated, anon, postgres, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, postgres, service_role;
GRANT EXECUTE ON FUNCTION public.is_sme_or_admin() TO authenticated, anon, postgres, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, anon, postgres, service_role;
GRANT EXECUTE ON FUNCTION private.is_sme_or_admin() TO authenticated, anon, postgres, service_role;

-- 2. Table-level GRANTS to authenticated and anon
-- (RLS controls actual row visibility, but table-level GRANT avoids 42501 permission denied)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT SELECT ON public.exam_attempts TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_responses TO authenticated;
GRANT SELECT ON public.exam_responses TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_candidates TO authenticated;
GRANT SELECT ON public.exam_candidates TO anon;

GRANT SELECT ON public.exam_tests TO authenticated, anon;
GRANT SELECT ON public.exam_test_sections TO authenticated, anon;
GRANT SELECT ON public.exam_test_questions TO authenticated, anon;
GRANT SELECT ON public.exam_questions TO authenticated, anon;
GRANT SELECT ON public.exam_options TO authenticated, anon;
GRANT SELECT ON public.exam_programs TO authenticated, anon;
GRANT SELECT, INSERT ON public.exam_feature_requests TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_users TO authenticated;
GRANT SELECT ON public.staff_users TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT SELECT, INSERT ON public.registrations TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscribers TO authenticated;
GRANT SELECT, INSERT ON public.subscribers TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT SELECT ON public.study_materials TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_assignments TO authenticated;
GRANT SELECT ON public.class_assignments TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;
GRANT SELECT ON public.assignment_submissions TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT SELECT ON public.system_settings TO anon;

-- Prep tracker table grants
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_enrolments TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_task_completions TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_diagnostic_scores TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_exam_plans TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_simulation_logs TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_error_ledger_entries TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_critique_submissions TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_sunday_reviews TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_diary_entries TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_explanation_cards TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_awareness_cards TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_build_records TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_articulation_logs TO authenticated, anon; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 3. Row Level Security policies

-- Enable RLS
ALTER TABLE public.exam_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- 3a. exam_candidates:
-- Public/authenticated can view candidate profiles (required for leaderboard, test results, etc.)
DROP POLICY IF EXISTS "Candidates can read their own profile" ON public.exam_candidates;
DROP POLICY IF EXISTS "Authenticated users can read candidate profiles" ON public.exam_candidates;
CREATE POLICY "Authenticated users can read candidate profiles"
  ON public.exam_candidates FOR SELECT TO authenticated
  USING (true);

-- Candidates can insert their own profile
DROP POLICY IF EXISTS "Candidates can insert their own profile" ON public.exam_candidates;
CREATE POLICY "Candidates can insert their own profile"
  ON public.exam_candidates FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = auth.uid() 
    OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  );

-- Candidates can update their own profile (or admin)
DROP POLICY IF EXISTS "Candidates can update their own profile" ON public.exam_candidates;
CREATE POLICY "Candidates can update their own profile"
  ON public.exam_candidates FOR UPDATE TO authenticated
  USING (
    auth_user_id = auth.uid() 
    OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  )
  WITH CHECK (
    auth_user_id = auth.uid() 
    OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  );

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.exam_candidates;
CREATE POLICY "Admins can manage profiles"
  ON public.exam_candidates FOR ALL TO authenticated
  USING (coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in')
  WITH CHECK (coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in');

-- 3b. exam_attempts:
-- Anyone authenticated can read attempts (needed for leaderboard scores, rank calculation)
DROP POLICY IF EXISTS "Candidates can manage their own attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Allow authenticated to read attempts for leaderboard" ON public.exam_attempts;
CREATE POLICY "Allow authenticated to read attempts for leaderboard"
  ON public.exam_attempts FOR SELECT TO authenticated
  USING (true);

-- Candidates can only insert/update/delete their own attempts
DROP POLICY IF EXISTS "Candidates can insert own attempts" ON public.exam_attempts;
CREATE POLICY "Candidates can insert own attempts"
  ON public.exam_attempts FOR INSERT TO authenticated
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM public.exam_candidates 
      WHERE auth_user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    ) OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  );

DROP POLICY IF EXISTS "Candidates can update own attempts" ON public.exam_attempts;
CREATE POLICY "Candidates can update own attempts"
  ON public.exam_attempts FOR UPDATE TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM public.exam_candidates 
      WHERE auth_user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    ) OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM public.exam_candidates 
      WHERE auth_user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    ) OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  );

-- 3c. exam_responses:
DROP POLICY IF EXISTS "Candidates can manage their own responses" ON public.exam_responses;
CREATE POLICY "Candidates can manage their own responses"
  ON public.exam_responses FOR ALL TO authenticated
  USING (
    attempt_id IN (
      SELECT id FROM public.exam_attempts WHERE candidate_id IN (
        SELECT id FROM public.exam_candidates 
        WHERE auth_user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
      )
    ) OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  )
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM public.exam_attempts WHERE candidate_id IN (
        SELECT id FROM public.exam_candidates 
        WHERE auth_user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
      )
    ) OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  );

-- 3d. staff_users (NO RECURSION: domain check directly)
DROP POLICY IF EXISTS "Allow admins full access to staff_users" ON public.staff_users;
DROP POLICY IF EXISTS "Admins full access to staff_users" ON public.staff_users;
CREATE POLICY "Admins full access to staff_users" ON public.staff_users
  FOR ALL TO authenticated
  USING (coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in')
  WITH CHECK (coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in');

DROP POLICY IF EXISTS "Staff can read own role" ON public.staff_users;
CREATE POLICY "Staff can read own role" ON public.staff_users
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid() 
    OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    OR coalesce(auth.jwt()->>'email', '') LIKE '%@designforge.co.in'
  );
