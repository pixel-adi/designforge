-- Disable RLS for candidate-facing tables (development mode)
ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_candidates DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated and anon roles
GRANT ALL ON exam_attempts TO anon;
GRANT ALL ON exam_attempts TO authenticated;

GRANT ALL ON exam_responses TO anon;
GRANT ALL ON exam_responses TO authenticated;

GRANT ALL ON exam_candidates TO anon;
GRANT ALL ON exam_candidates TO authenticated;

-- Add status column to exam_attempts if it doesn't exist
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'));
