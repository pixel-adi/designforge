-- ========================================================
-- Remediation: storage.objects policies (SME/Admin Access)
-- ========================================================

-- 1. Enable RLS on storage.objects if not already done
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Clean up hardcoded email policies for content-uploads
DROP POLICY IF EXISTS "Admin upload content" ON storage.objects;
DROP POLICY IF EXISTS "Admin update content" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete content" ON storage.objects;

-- 3. Create dynamic policies for content-uploads
CREATE POLICY "Staff upload content" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-uploads' AND public.is_sme_or_admin());

CREATE POLICY "Staff update content" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'content-uploads' AND public.is_sme_or_admin());

CREATE POLICY "Staff delete content" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'content-uploads' AND public.is_sme_or_admin());

-- 4. Clean up and secure question-media bucket policies
DROP POLICY IF EXISTS "Public read question media" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage question media" ON storage.objects;

CREATE POLICY "Public read question media" ON storage.objects
  FOR SELECT USING (bucket_id = 'question-media');

CREATE POLICY "Staff manage question media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'question-media' AND public.is_sme_or_admin())
  WITH CHECK (bucket_id = 'question-media' AND public.is_sme_or_admin());

-- 5. Secure assignment-submissions bucket policies
DROP POLICY IF EXISTS "Admin manage all submissions storage" ON storage.objects;

CREATE POLICY "Admin manage all submissions storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'assignment-submissions' AND public.is_admin());


-- ========================================================
-- Remediation: exam_tests RLS (Admin Access Only)
-- ========================================================

-- Clean up and secure test structures (Restricted to Admins)
DROP POLICY IF EXISTS "Admins have full access to tests" ON exam_tests;
CREATE POLICY "Admins have full access to tests" ON exam_tests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to test sections" ON exam_test_sections;
CREATE POLICY "Admins have full access to test sections" ON exam_test_sections
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to test questions links" ON exam_test_questions;
CREATE POLICY "Admins have full access to test questions links" ON exam_test_questions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
