-- =========================================================================================
-- HOTFIX: Rewire all RLS policies from public.is_admin() → private.is_admin()
-- 
-- ERROR 42501 "permission denied for function is_admin" happens because:
--   1. EXECUTE was revoked from authenticated on public.is_admin()
--   2. But RLS policies still call public.is_admin() — Postgres evaluates them
--      as the authenticated role → permission denied
--
-- This script replaces every policy that calls public.is_admin() or
-- public.is_sme_or_admin() with private.is_admin() / private.is_sme_or_admin().
-- The private versions were already created and have EXECUTE granted to authenticated.
--
-- Run in Supabase Dashboard → SQL Editor IMMEDIATELY.
-- =========================================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Ensure private schema functions exist and have correct grants
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
-- 1. staff_users
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow admins full access to staff_users" ON public.staff_users;
CREATE POLICY "Allow admins full access to staff_users" ON public.staff_users
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. exam_questions
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins and SMEs have full access to questions" ON public.exam_questions;
CREATE POLICY "Admins and SMEs have full access to questions" ON public.exam_questions
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. exam_options
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins and SMEs have full access to options" ON public.exam_options;
CREATE POLICY "Admins and SMEs have full access to options" ON public.exam_options
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. study_materials
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins and SMEs manage materials" ON public.study_materials;
DROP POLICY IF EXISTS "Admins manage materials" ON public.study_materials;
CREATE POLICY "Admins and SMEs manage materials" ON public.study_materials
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. class_assignments
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins and SMEs manage assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins manage assignments" ON public.class_assignments;
CREATE POLICY "Admins and SMEs manage assignments" ON public.class_assignments
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. class_notes
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins and SMEs manage notes" ON public.class_notes;
DROP POLICY IF EXISTS "Admins manage notes" ON public.class_notes;
CREATE POLICY "Admins and SMEs manage notes" ON public.class_notes
  FOR ALL TO authenticated
  USING (private.is_sme_or_admin())
  WITH CHECK (private.is_sme_or_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. exam_tests
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins have full access to tests" ON public.exam_tests;
CREATE POLICY "Admins have full access to tests" ON public.exam_tests
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. exam_test_sections
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins have full access to test sections" ON public.exam_test_sections;
CREATE POLICY "Admins have full access to test sections" ON public.exam_test_sections
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. exam_test_questions
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins have full access to test questions links" ON public.exam_test_questions;
CREATE POLICY "Admins have full access to test questions links" ON public.exam_test_questions
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. storage.objects — content-uploads bucket
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff upload content" ON storage.objects;
CREATE POLICY "Staff upload content" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-uploads' AND private.is_sme_or_admin());

DROP POLICY IF EXISTS "Staff update content" ON storage.objects;
CREATE POLICY "Staff update content" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'content-uploads' AND private.is_sme_or_admin());

DROP POLICY IF EXISTS "Staff delete content" ON storage.objects;
CREATE POLICY "Staff delete content" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'content-uploads' AND private.is_sme_or_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. storage.objects — question-media bucket
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff manage question media" ON storage.objects;
CREATE POLICY "Staff manage question media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'question-media' AND private.is_sme_or_admin())
  WITH CHECK (bucket_id = 'question-media' AND private.is_sme_or_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. storage.objects — assignment-submissions bucket
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage all submissions storage" ON storage.objects;
CREATE POLICY "Admin manage all submissions storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'assignment-submissions' AND private.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. system_settings
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow staff to read settings" ON public.system_settings;
CREATE POLICY "Allow staff to read settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING (private.is_sme_or_admin() OR private.is_admin());

DROP POLICY IF EXISTS "Allow admins to manage settings" ON public.system_settings;
CREATE POLICY "Allow admins to manage settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

COMMIT;
