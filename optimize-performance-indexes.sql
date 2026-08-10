-- =========================================================================================
-- HIGH-CONCURRENCY DATABASE PERFORMANCE OPTIMIZATION SCRIPT (1,000 CONCURRENT USERS)
-- Safe to re-run multiple times (Idempotent)
-- Run this script in your Supabase Dashboard -> SQL Editor
-- =========================================================================================

-- 1. Index for candidate response lookups and batched upserts by attempt_id
CREATE INDEX IF NOT EXISTS idx_exam_responses_attempt_id ON public.exam_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_responses_question_id ON public.exam_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_responses_attempt_question ON public.exam_responses(attempt_id, question_id);

-- 2. Index for candidate attempts queries (filtering by candidate, test, and status)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_candidate_id ON public.exam_attempts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_test_id ON public.exam_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_candidate_test_status ON public.exam_attempts(candidate_id, test_id, status);

-- 3. Index for question bank & test structure lookups
CREATE INDEX IF NOT EXISTS idx_exam_test_questions_test_id ON public.exam_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_exam_test_questions_question_id ON public.exam_test_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_options_question_id ON public.exam_options(question_id);

-- 4. Index for candidate profile auth lookups
CREATE INDEX IF NOT EXISTS idx_exam_candidates_auth_user_id ON public.exam_candidates(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_auth_user_id ON public.staff_users(auth_user_id);

-- 5. Index for study materials, assignments, class notes
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_materials') THEN
  CREATE INDEX IF NOT EXISTS idx_study_materials_visibility ON public.study_materials(is_visible, display_order);
END IF;
