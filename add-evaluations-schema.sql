-- ==============================================================================
-- PART B EVALUATIONS & TEST EXPIRY SCHEMA UPDATE
-- Run this in the Supabase SQL Editor to prepare the database for the new features
-- ==============================================================================

-- 1. Test Expiry Feature
ALTER TABLE public.exam_tests 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Part B Individual Question Evaluations
ALTER TABLE public.exam_responses 
ADD COLUMN IF NOT EXISTS marks_awarded NUMERIC,
ADD COLUMN IF NOT EXISTS mentor_comments TEXT,
ADD COLUMN IF NOT EXISTS mentor_improvements TEXT,
ADD COLUMN IF NOT EXISTS mentor_loom_link TEXT;

-- 3. Part B Overall Attempt Tracking
ALTER TABLE public.exam_attempts 
ADD COLUMN IF NOT EXISTS score_part_b NUMERIC,
ADD COLUMN IF NOT EXISTS total_score NUMERIC,
ADD COLUMN IF NOT EXISTS part_b_evaluation_status TEXT DEFAULT 'pending' CHECK (part_b_evaluation_status IN ('pending', 'draft', 'completed')),
ADD COLUMN IF NOT EXISTS part_b_evaluated_at TIMESTAMPTZ;

-- Note: We do not need to alter RLS for these columns specifically since they belong to tables that already have secure RLS policies set up.
