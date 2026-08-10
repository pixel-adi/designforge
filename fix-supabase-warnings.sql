-- =========================================================================================
-- COMPLETE SUPABASE SECURITY & LINTER WARNINGS REMEDIATION SCRIPT
-- Run this script in your Supabase Dashboard -> SQL Editor
-- =========================================================================================

-- -----------------------------------------------------------------------------------------
-- 1. FIX: function_search_path_mutable
-- -----------------------------------------------------------------------------------------
-- Secure functions by explicitly setting the search_path to prevent search path hijacking
ALTER FUNCTION public.generate_candidate_id() SET search_path = public;

IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_access_self_modification') THEN
  ALTER FUNCTION public.prevent_access_self_modification() SET search_path = public;
END IF;

-- -----------------------------------------------------------------------------------------
-- 2. FIX: rls_policy_always_true
-- Replace overly permissive USING (true) / WITH CHECK (true) policies with specific conditions
-- -----------------------------------------------------------------------------------------

-- A) exam_feature_requests (UPDATE policy)
DROP POLICY IF EXISTS "Candidates can update feature requests" ON public.exam_feature_requests;
CREATE POLICY "Candidates can update feature requests" 
ON public.exam_feature_requests FOR UPDATE TO authenticated 
USING (
  auth.uid() IN (SELECT auth_user_id FROM public.exam_candidates)
)
WITH CHECK (
  auth.uid() IN (SELECT auth_user_id FROM public.exam_candidates)
);

-- B) registrations (INSERT policy for public form)
DROP POLICY IF EXISTS "Allow public insert" ON public.registrations;
CREATE POLICY "Allow public insert" ON public.registrations
FOR INSERT TO anon
WITH CHECK (
  length(trim(name)) > 0 AND 
  length(trim(email)) > 0 AND 
  length(trim(phone)) > 0
);

-- C) subscribers (INSERT policy for newsletter form)
DROP POLICY IF EXISTS "Allow public subscribe" ON public.subscribers;
CREATE POLICY "Allow public subscribe" ON public.subscribers
FOR INSERT TO anon
WITH CHECK (
  length(trim(email)) > 0
);

-- -----------------------------------------------------------------------------------------
-- 3. FIX: public_bucket_allows_listing
-- Drop broad SELECT policies on storage.objects that expose bucket file listings.
-- Public buckets serve files directly via public URLs without needing SELECT on storage.objects.
-- -----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access Candidate Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can read own submissions 1obzjod_0" ON storage.objects;
DROP POLICY IF EXISTS "Public read content uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read question media" ON storage.objects;

-- Secure read access for candidate submissions (candidates can read own submissions, admins read all)
DROP POLICY IF EXISTS "Authenticated candidates read own submissions" ON storage.objects;
CREATE POLICY "Authenticated candidates read own submissions" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'candidate-submissions' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    auth.jwt()->>'email' LIKE '%@designforge.co.in'
  )
);

-- -----------------------------------------------------------------------------------------
-- 4. FIX: anon_security_definer_function_executable & authenticated_security_definer_function_executable
-- Revoke PostgREST RPC execution privileges on SECURITY DEFINER functions from anon/public
-- -----------------------------------------------------------------------------------------

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    ALTER FUNCTION public.is_admin() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_sme_or_admin') THEN
    ALTER FUNCTION public.is_sme_or_admin() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.is_sme_or_admin() FROM PUBLIC, anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_access_self_modification') THEN
    ALTER FUNCTION public.prevent_access_self_modification() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.prevent_access_self_modification() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- Create private schema for non-exposed helper functions
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
