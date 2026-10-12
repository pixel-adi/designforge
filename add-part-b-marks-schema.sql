-- ==============================================================================
-- ADD MARKS COLUMN TO EXAM_TEST_QUESTIONS WITH STRICT POSITIVE CONSTRAINT
-- Zero downtime / safe execution:
-- 1. Adding a nullable column in Postgres is an instantaneous metadata-only change.
-- 2. CHECK constraint allows NULL for legacy rows, but strictly enforces marks > 0 for new values.
-- ==============================================================================

-- 1. Add marks column to exam_test_questions
ALTER TABLE public.exam_test_questions 
ADD COLUMN IF NOT EXISTS marks NUMERIC DEFAULT NULL;

-- 2. Drop existing constraint if it exists to avoid duplicate errors
ALTER TABLE public.exam_test_questions 
DROP CONSTRAINT IF EXISTS chk_test_question_marks_positive;

-- 3. Add constraint enforcing marks must be strictly greater than 0 (no zero, no negative)
ALTER TABLE public.exam_test_questions 
ADD CONSTRAINT chk_test_question_marks_positive 
CHECK (marks IS NULL OR marks > 0);

-- 4. Notify PostgREST to refresh its schema cache immediately
NOTIFY pgrst, 'reload schema';
