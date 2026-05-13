-- Create the candidate-submissions bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate-submissions', 'candidate-submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to view the files
CREATE POLICY "Public Access Candidate Submissions" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'candidate-submissions');

-- Allow authenticated users (candidates) to upload their submissions
CREATE POLICY "Auth Upload Candidate Submissions" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'candidate-submissions' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their submissions
CREATE POLICY "Auth Update Candidate Submissions" 
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'candidate-submissions' AND auth.role() = 'authenticated');
