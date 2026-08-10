-- Multi-Attempt Migration for exam_attempts
-- Run this in Supabase Dashboard > SQL Editor
-- This enables up to 3 attempts per candidate per test

-- 1. Drop old unique constraint (only allows 1 attempt per candidate+test)
ALTER TABLE exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_candidate_id_test_id_key;

-- 2. Add attempt_number column (defaults to 1 for existing rows)
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS attempt_number INT NOT NULL DEFAULT 1;

-- 3. Add new unique constraint (candidate + test + attempt_number)
ALTER TABLE exam_attempts ADD CONSTRAINT exam_attempts_candidate_test_attempt_unique 
  UNIQUE(candidate_id, test_id, attempt_number);

-- Verify: Check existing data
-- SELECT id, candidate_id, test_id, attempt_number, status FROM exam_attempts ORDER BY candidate_id, test_id, attempt_number;
