-- ==============================================================================
-- NON-BREAKING DATABASE PERFORMANCE ACCELERATOR FOR STUDENT PORTAL
-- Compatible with Supabase SQL Editor (Runs smoothly inside transaction blocks)
-- ==============================================================================

-- 1. OPTIMIZE RLS HELPER FUNCTION TO AVOID PER-ROW EVALUATION
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.prep_is_owner(p_candidate_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.exam_candidates
    WHERE id = p_candidate_id 
      AND auth_user_id = (SELECT auth.uid()) -- Evaluated & cached once per statement
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION private.prep_is_owner(UUID) TO authenticated, postgres, service_role;


-- 2. HIGH-CONCURRENCY COMPOSITE INDEXES (HOT QUERY PATHS)

-- A. Fast lookup for candidate attempts by status & date (Dashboard / Results tab)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_cand_status_completed_v2
  ON public.exam_attempts(candidate_id, status, completed_at DESC);

-- B. Fast lookup for candidate profile by auth_user_id (Initial login & auth resolution)
CREATE INDEX IF NOT EXISTS idx_exam_candidates_auth_uid
  ON public.exam_candidates(auth_user_id);

-- C. Fast lookup for question options (Test Engine)
CREATE INDEX IF NOT EXISTS idx_exam_options_qid_id
  ON public.exam_options(question_id, id);

-- D. Fast test question joins (Test Engine)
CREATE INDEX IF NOT EXISTS idx_exam_tq_test_question
  ON public.exam_test_questions(test_id, question_id);

-- E. Study materials and assignments filtering (Dashboard tabs)
CREATE INDEX IF NOT EXISTS idx_study_materials_visible_order
  ON public.study_materials(is_visible, display_order, created_at DESC)
  WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_class_assignments_visible_created
  ON public.class_assignments(is_visible, created_at DESC)
  WHERE is_visible = true;

-- F. Prep Tracker task completion counts & status checks
CREATE INDEX IF NOT EXISTS idx_prep_comp_cand_task
  ON public.prep_task_completions(candidate_id, task_id);

CREATE INDEX IF NOT EXISTS idx_prep_sim_cand_date
  ON public.prep_simulation_logs(candidate_id, date DESC);


-- 3. REFRESH POSTGRES PLANNER STATISTICS
ANALYZE public.exam_candidates;
ANALYZE public.exam_tests;
ANALYZE public.exam_test_questions;
ANALYZE public.exam_questions;
ANALYZE public.exam_options;
ANALYZE public.exam_attempts;
ANALYZE public.prep_task_completions;
