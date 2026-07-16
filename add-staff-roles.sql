-- =============================================
-- Staff Roles & SME Content Portal Access System
-- =============================================

-- 1. Create Staff Users Table
CREATE TABLE IF NOT EXISTS public.staff_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sme', 'mentor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on staff_users
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- 2. Create Security Definer Helper Functions (To avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
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

CREATE OR REPLACE FUNCTION public.is_sme_or_admin()
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

-- 3. Staff Users policies
DROP POLICY IF EXISTS "Allow admins full access to staff_users" ON public.staff_users;
DROP POLICY IF EXISTS "Allow staff to read their own profile" ON public.staff_users;

CREATE POLICY "Allow admins full access to staff_users" ON public.staff_users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow staff to read their own profile" ON public.staff_users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- 4. Update exam_questions policies
DROP POLICY IF EXISTS "Admins have full access to questions" ON public.exam_questions;
CREATE POLICY "Admins and SMEs have full access to questions" ON public.exam_questions
  FOR ALL TO authenticated
  USING (public.is_sme_or_admin())
  WITH CHECK (public.is_sme_or_admin());

-- 5. Update exam_options policies
DROP POLICY IF EXISTS "Admins have full access to options" ON public.exam_options;
CREATE POLICY "Admins and SMEs have full access to options" ON public.exam_options
  FOR ALL TO authenticated
  USING (public.is_sme_or_admin())
  WITH CHECK (public.is_sme_or_admin());

-- 6. Update study_materials policies
DROP POLICY IF EXISTS "Admins manage materials" ON public.study_materials;
CREATE POLICY "Admins and SMEs manage materials" ON public.study_materials
  FOR ALL TO authenticated
  USING (public.is_sme_or_admin())
  WITH CHECK (public.is_sme_or_admin());

-- 7. Update class_assignments policies
DROP POLICY IF EXISTS "Admins manage assignments" ON public.class_assignments;
CREATE POLICY "Admins and SMEs manage assignments" ON public.class_assignments
  FOR ALL TO authenticated
  USING (public.is_sme_or_admin())
  WITH CHECK (public.is_sme_or_admin());

-- 8. Update class_notes policies
DROP POLICY IF EXISTS "Admins manage notes" ON public.class_notes;
CREATE POLICY "Admins and SMEs manage notes" ON public.class_notes
  FOR ALL TO authenticated
  USING (public.is_sme_or_admin())
  WITH CHECK (public.is_sme_or_admin());
