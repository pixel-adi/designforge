-- Add education_level column to exam_candidates
ALTER TABLE exam_candidates ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'bachelors' CHECK (education_level IN ('bachelors', 'masters'));
