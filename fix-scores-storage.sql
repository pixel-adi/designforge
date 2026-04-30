-- Add score columns to exam_attempts table
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS score_part_a INT DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS total_part_a INT DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS part_b_answered INT DEFAULT 0;

-- Grant read access on exam_options for score evaluation (is_correct field)
GRANT SELECT ON exam_options TO authenticated;
GRANT SELECT ON exam_options TO anon;

-- Create 'candidate-submissions' storage bucket via SQL (if not done via UI)
-- Note: You may also need to create this bucket manually in Supabase Storage UI
-- Set it to private so only authenticated users can upload
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-submissions', 'candidate-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folders
CREATE POLICY "Candidates can upload submissions" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate-submissions');

CREATE POLICY "Candidates can read their submissions" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'candidate-submissions');
