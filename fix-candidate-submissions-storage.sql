-- ==============================================================================
-- FIX: candidate-submissions Storage Bucket & Access Policies
-- Ensures Part B subjective image uploads never get blocked by RLS
-- and images load immediately in the Admin Evaluation panel without 403 / hanging.
-- ==============================================================================

-- 1. Ensure candidate-submissions bucket exists, is public, and accepts all image formats
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-submissions',
  'candidate-submissions',
  true,
  26214400, -- 25MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf', 'application/octet-stream']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf', 'application/octet-stream']::text[];

-- 2. Drop restrictive or conflicting SELECT policies
DROP POLICY IF EXISTS "Public Access Candidate Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated candidates read own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Candidates read own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can read own submissions 1obzjod_0" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Candidate Submissions" ON storage.objects;

-- 3. Public Read access for candidate-submissions bucket
-- Needed so that admin evaluation <img> tags and candidates can view submitted sketches without auth token dropouts
CREATE POLICY "Public Read Candidate Submissions"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-submissions');

-- 4. Drop and recreate INSERT policy allowing student submission uploads
DROP POLICY IF EXISTS "Auth Upload Candidate Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Submissions Upload" ON storage.objects;
DROP POLICY IF EXISTS "Candidates upload submissions" ON storage.objects;

CREATE POLICY "Allow All Submissions Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'candidate-submissions');

-- 5. Drop and recreate UPDATE policy
DROP POLICY IF EXISTS "Auth Update Candidate Submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Submissions Update" ON storage.objects;

CREATE POLICY "Allow All Submissions Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'candidate-submissions')
WITH CHECK (bucket_id = 'candidate-submissions');
