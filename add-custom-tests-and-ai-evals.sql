-- ==============================================================================
-- MIGRATION: ADD CUSTOM PRACTICE TESTS & PART B AI EVALUATIONS
-- Zero downtime / safe execution:
-- 1. All column additions use ADD COLUMN IF NOT EXISTS with safe defaults.
-- 2. No existing data is modified or deleted.
-- 3. Enables students to build practice tests tracked in backend with a 10-test quota
--    for generic candidates and unlimited for focus_batch candidates.
-- ==============================================================================

-- 1. Columns on exam_tests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_tests' AND column_name = 'is_custom_practice'
  ) THEN
    ALTER TABLE public.exam_tests ADD COLUMN is_custom_practice BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_tests' AND column_name = 'created_by_candidate_id'
  ) THEN
    ALTER TABLE public.exam_tests ADD COLUMN created_by_candidate_id UUID REFERENCES public.exam_candidates(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_tests' AND column_name = 'practice_category'
  ) THEN
    ALTER TABLE public.exam_tests ADD COLUMN practice_category TEXT DEFAULT 'general';
  END IF;
END $$;

-- 2. Update category constraint if it exists to allow 'custom_practice'
ALTER TABLE public.exam_tests DROP CONSTRAINT IF EXISTS check_exam_test_category;
ALTER TABLE public.exam_tests ADD CONSTRAINT check_exam_test_category 
CHECK (category IN ('full_length', 'half_length', 'custom_short', 'custom_practice'));

-- 3. Columns on exam_responses for AI evaluation telemetry
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_responses' AND column_name = 'ai_evaluated'
  ) THEN
    ALTER TABLE public.exam_responses ADD COLUMN ai_evaluated BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_responses' AND column_name = 'ai_evaluation_data'
  ) THEN
    ALTER TABLE public.exam_responses ADD COLUMN ai_evaluation_data JSONB DEFAULT NULL;
  END IF;
END $$;

-- 4. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_exam_tests_custom_candidate 
ON public.exam_tests(created_by_candidate_id, is_custom_practice) 
WHERE is_custom_practice = true;

-- 5. Stored Procedure: create_student_custom_test
-- Enforces:
-- - Generic candidates: capped at 10 active custom tests.
-- - Focus Batch candidates: unlimited.
-- - Atomic insertion of test, test sections, test questions, and initial attempt.
CREATE OR REPLACE FUNCTION public.create_student_custom_test(
  p_candidate_id UUID,
  p_title TEXT,
  p_practice_category TEXT,
  p_duration_minutes INT,
  p_question_ids UUID[],
  p_has_part_b BOOLEAN DEFAULT false,
  p_part_b_duration_minutes INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_access_level TEXT;
  v_test_count INT;
  v_new_test_id UUID;
  v_new_attempt_id UUID;
  v_qid UUID;
  v_q_part TEXT;
  v_q_marks NUMERIC;
BEGIN
  -- 1. Validate candidate & check quota
  SELECT access_level INTO v_access_level
  FROM public.exam_candidates
  WHERE id = p_candidate_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate not found';
  END IF;

  -- Generic students limited to 10 custom tests
  IF v_access_level IS DISTINCT FROM 'focus_batch' THEN
    SELECT COUNT(*) INTO v_test_count
    FROM public.exam_tests
    WHERE created_by_candidate_id = p_candidate_id
      AND is_custom_practice = true;

    IF v_test_count >= 10 THEN
      RAISE EXCEPTION 'TEST_LIMIT_REACHED: You have reached the limit of 10 custom practice tests. Please delete an older test to create a new one.';
    END IF;
  END IF;

  -- 2. Create the test record
  INSERT INTO public.exam_tests (
    title,
    status,
    category,
    is_custom_practice,
    created_by_candidate_id,
    practice_category,
    program_format
  ) VALUES (
    p_title,
    'published',
    'custom_practice',
    true,
    p_candidate_id,
    p_practice_category,
    'both'
  )
  RETURNING id INTO v_new_test_id;

  -- 3. Create test sections
  -- Part A section (if non-Part-B or mixed)
  INSERT INTO public.exam_test_sections (
    test_id,
    part,
    duration_minutes
  ) VALUES (
    v_new_test_id,
    'A',
    GREATEST(1, p_duration_minutes)
  );

  -- Part B section if requested
  IF p_has_part_b THEN
    INSERT INTO public.exam_test_sections (
      test_id,
      part,
      duration_minutes
    ) VALUES (
      v_new_test_id,
      'B',
      GREATEST(1, COALESCE(p_part_b_duration_minutes, 30))
    )
    ON CONFLICT (test_id, part) DO NOTHING;
  END IF;

  -- 4. Link questions to test
  IF array_length(p_question_ids, 1) > 0 THEN
    FOREACH v_qid IN ARRAY p_question_ids
    LOOP
      SELECT part::text INTO v_q_part FROM public.exam_questions WHERE id = v_qid;
      IF v_q_part = 'B' THEN
        v_q_marks := 10;
      ELSE
        v_q_marks := 2;
      END IF;

      INSERT INTO public.exam_test_questions (test_id, question_id, marks)
      VALUES (v_new_test_id, v_qid, v_q_marks)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 5. Pre-create initial attempt
  INSERT INTO public.exam_attempts (
    candidate_id,
    test_id,
    attempt_number,
    status
  ) VALUES (
    p_candidate_id,
    v_new_test_id,
    1,
    'not_started'
  )
  RETURNING id INTO v_new_attempt_id;

  RETURN jsonb_build_object(
    'test_id', v_new_test_id,
    'attempt_id', v_new_attempt_id,
    'title', p_title,
    'question_count', array_length(p_question_ids, 1)
  );
END;
$$;

-- 6. Stored Procedure: delete_student_custom_test
-- Only allows a candidate (or admin) to delete a custom test they created
CREATE OR REPLACE FUNCTION public.delete_student_custom_test(
  p_candidate_id UUID,
  p_test_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM public.exam_tests
  WHERE id = p_test_id
    AND created_by_candidate_id = p_candidate_id
    AND is_custom_practice = true;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count > 0;
END;
$$;

-- 7. RLS policy update for candidates to view own custom tests
DROP POLICY IF EXISTS "Candidates can view own custom tests" ON public.exam_tests;
CREATE POLICY "Candidates can view own custom tests" 
ON public.exam_tests 
FOR SELECT TO authenticated, anon
USING (
  (status = 'published' AND is_custom_practice IS NOT TRUE)
  OR
  (is_custom_practice = true AND created_by_candidate_id IN (
    SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
  ))
);

-- Notify schema cache refresh
NOTIFY pgrst, 'reload schema';
