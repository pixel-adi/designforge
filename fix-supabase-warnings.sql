-- =========================================================================================
-- SECURITY WARNINGS CLEANUP SCRIPT
-- Run this script in the Supabase Dashboard -> SQL Editor to resolve the remaining warnings.
-- =========================================================================================

-- 1. FIX: function_search_path_mutable
-- Secure the function by explicitly setting the search_path
ALTER FUNCTION public.generate_candidate_id() SET search_path = public;


-- 2. FIX: rls_policy_always_true (Remove overly permissive default policies that were left behind)
-- Drop permissive policies on exam_attempts
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.exam_attempts;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.exam_attempts;

-- Drop permissive policies on exam_candidates
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.exam_candidates;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.exam_candidates;

-- Drop permissive policies on exam_options
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.exam_options;
DROP POLICY IF EXISTS "Enable delete for public" ON public.exam_options;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.exam_options;
DROP POLICY IF EXISTS "Enable insert for public" ON public.exam_options;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.exam_options;
DROP POLICY IF EXISTS "Enable update for public" ON public.exam_options;

-- Drop permissive policies on exam_questions
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.exam_questions;
DROP POLICY IF EXISTS "Enable delete for public" ON public.exam_questions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.exam_questions;
DROP POLICY IF EXISTS "Enable insert for public" ON public.exam_questions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.exam_questions;
DROP POLICY IF EXISTS "Enable update for public" ON public.exam_questions;

-- Drop permissive policies on exam_responses
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.exam_responses;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.exam_responses;


-- 3. FIX: rls_policy_always_true (Secure Admin tables by restricting to @designforge.co.in)
-- Programs table
DROP POLICY IF EXISTS "Allow authenticated full access programs" ON public.programs;
CREATE POLICY "Allow authenticated full access programs" ON public.programs
  FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in') 
  WITH CHECK (auth.jwt()->>'email' LIKE '%@designforge.co.in');

-- Ranks table
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.ranks;
CREATE POLICY "Allow authenticated full access" ON public.ranks
  FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in') 
  WITH CHECK (auth.jwt()->>'email' LIKE '%@designforge.co.in');

-- Site Content table
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.site_content;
CREATE POLICY "Allow authenticated full access" ON public.site_content
  FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in') 
  WITH CHECK (auth.jwt()->>'email' LIKE '%@designforge.co.in');

-- Workshops table
DROP POLICY IF EXISTS "Allow authenticated full access workshops" ON public.workshops;
CREATE POLICY "Allow authenticated full access workshops" ON public.workshops
  FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in') 
  WITH CHECK (auth.jwt()->>'email' LIKE '%@designforge.co.in');


-- 4. FIX: public_bucket_allows_listing
-- Public buckets do not need a SELECT policy on storage.objects for users to download files via public URLs.
-- This policy allows users to list the entire contents of the bucket, which is a security risk.
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;

-- NOTE: The "Allow public insert" on `registrations` and `subscribers` is expected behavior for public forms. 
-- Supabase warns about it, but it is necessary for unauthenticated users to submit forms. 
-- You can safely ignore those two specific warnings.
