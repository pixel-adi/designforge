ALTER TABLE exam_responses ADD COLUMN IF NOT EXISTS rubric_marks JSONB DEFAULT '{}'::jsonb;
