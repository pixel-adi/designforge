-- ==============================================================================
-- FIX: candidate-submissions Storage Bucket & Access Policies
-- Ensures Part B subjective image uploads never get blocked by RLS,
-- images load immediately via public URL, and satisfies Supabase linter.
-- ==============================================================================

-- 1. Ensure candidate-submissions bucket exists, is public, and accepts all image formats
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-submissions',
  'candidate-submissions',
  true,
  26214400, -- 25MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf']::text[];

-- 2. Drop broad SELECT policies that cause 'public_bucket_allows_listing' linter warning
-- Note: Because public=true, public image URLs work automatically without a SELECT policy.
DROP POLICY IF EXISTS "Public Access Candidate Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated candidates read own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Candidates read own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can read own submissions 1obzjod_0" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Candidate Submissions" ON storage.objects;

-- 3. Scoped SELECT policy for authenticated staff to list attempt files
CREATE POLICY "Admin List Candidate Submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-submissions'
  AND (
    auth.jwt()->>'email' LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'sme')
    )
  )
);

-- 4. Secure INSERT policy: allow uploads strictly within the 'submissions/' directory
DROP POLICY IF EXISTS "Auth Upload Candidate Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Submissions Upload" ON storage.objects;
DROP POLICY IF EXISTS "Candidates upload submissions" ON storage.objects;

CREATE POLICY "Allow All Submissions Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-submissions'
  AND (storage.foldername(name))[1] = 'submissions'
);

-- 5. Revoke blanket UPDATE: Submissions use immutable UUID file paths.
DROP POLICY IF EXISTS "Auth Update Candidate Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Submissions Update" ON storage.objects;
