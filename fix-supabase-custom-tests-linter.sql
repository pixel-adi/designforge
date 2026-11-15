-- ==============================================================================
-- FIX: Supabase Linter Warnings for Custom Test Functions
--
-- Warnings Resolved:
-- 1. function_search_path_mutable (public.delete_student_custom_test)
-- 2. function_search_path_mutable (public.create_student_custom_test)
-- 3. anon_security_definer_function_executable (public.create_student_custom_test)
-- 4. anon_security_definer_function_executable (public.delete_student_custom_test)
-- 5. authenticated_security_definer_function_executable (public.create_student_custom_test)
-- 6. authenticated_security_definer_function_executable (public.delete_student_custom_test)
--
-- Solution:
-- - Sets explicit `SET search_path = public, pg_temp` on both functions.
-- - Switches functions from `SECURITY DEFINER` to `SECURITY INVOKER` so they run
--   safely within the authenticated student's JWT context without privilege escalation.
-- - Revokes EXECUTE from `anon` and `public` (preventing unauthenticated public RPC calls).
-- - Grants EXECUTE strictly to `authenticated` and `service_role`.
-- - Adds scoped RLS policies on `exam_tests`, `exam_test_sections`, and
--   `exam_test_questions` so candidates can only manage their own custom practice tests.
-- - Validates caller identity (`auth.uid() = auth_user_id`) inside both functions.
-- ==============================================================================

-- 1. Scoped Row-Level Security (RLS) Policies for Custom Practice Tests
-- Allows authenticated students to create/delete their own custom tests and sections
-- without compromising official mock tests.

-- 1a. exam_tests: Candidate can insert their own custom practice tests
DROP POLICY IF EXISTS "Candidates can insert own custom tests" ON public.exam_tests;
CREATE POLICY "Candidates can insert own custom tests"
  ON public.exam_tests FOR INSERT TO authenticated
  WITH CHECK (
    is_custom_practice = true 
    AND created_by_candidate_id IN (
      SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
    )
  );

-- 1b. exam_tests: Candidate can delete their own custom practice tests
DROP POLICY IF EXISTS "Candidates can delete own custom tests" ON public.exam_tests;
CREATE POLICY "Candidates can delete own custom tests"
  ON public.exam_tests FOR DELETE TO authenticated
  USING (
    is_custom_practice = true 
    AND created_by_candidate_id IN (
      SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
    )
  );

-- 1c. exam_test_sections: Candidate can insert sections for their own custom tests
DROP POLICY IF EXISTS "Candidates can insert own custom test sections" ON public.exam_test_sections;
CREATE POLICY "Candidates can insert own custom test sections"
  ON public.exam_test_sections FOR INSERT TO authenticated
  WITH CHECK (
    test_id IN (
      SELECT id FROM public.exam_tests 
      WHERE is_custom_practice = true 
        AND created_by_candidate_id IN (
          SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
        )
    )
  );

-- 1d. exam_test_questions: Candidate can link questions to their own custom tests
DROP POLICY IF EXISTS "Candidates can insert questions into own custom tests" ON public.exam_test_questions;
CREATE POLICY "Candidates can insert questions into own custom tests"
  ON public.exam_test_questions FOR INSERT TO authenticated
  WITH CHECK (
    test_id IN (
      SELECT id FROM public.exam_tests 
      WHERE is_custom_practice = true 
        AND created_by_candidate_id IN (
          SELECT id FROM public.exam_candidates WHERE auth_user_id = auth.uid()
        )
    )
  );


-- 2. Stored Procedure: create_student_custom_test
-- Fixed: SECURITY INVOKER + SET search_path = public, pg_temp + caller identity check
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
SECURITY INVOKER
SET search_path = public, pg_temp
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
  -- 0. Authorization check: Ensure caller is authenticated and matches p_candidate_id (or is staff)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.exam_candidates 
    WHERE id = p_candidate_id AND auth_user_id = auth.uid()
  ) AND coalesce(auth.jwt()->>'email', '') NOT LIKE '%@designforge.co.in' THEN
    RAISE EXCEPTION 'Unauthorized: You may only create practice tests for your own account.';
  END IF;

  -- 1. Validate candidate & check quota
  SELECT access_level INTO v_access_level
  FROM public.exam_candidates
  WHERE id = p_candidate_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate profile not found.';
  END IF;

  -- Generic students limited to 10 active custom tests; Focus Batch students have unlimited
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
  -- Part A section
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

  -- 4. Link questions to custom test
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


-- 3. Stored Procedure: delete_student_custom_test
-- Fixed: SECURITY INVOKER + SET search_path = public, pg_temp + caller identity check
CREATE OR REPLACE FUNCTION public.delete_student_custom_test(
  p_candidate_id UUID,
  p_test_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  -- 0. Authorization check: Ensure caller is authenticated and matches p_candidate_id (or is staff)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.exam_candidates 
    WHERE id = p_candidate_id AND auth_user_id = auth.uid()
  ) AND coalesce(auth.jwt()->>'email', '') NOT LIKE '%@designforge.co.in' THEN
    RAISE EXCEPTION 'Unauthorized: You may only delete practice tests for your own account.';
  END IF;

  -- Delete test (foreign keys on sections, test_questions, and attempts will cascade delete)
  DELETE FROM public.exam_tests
  WHERE id = p_test_id
    AND created_by_candidate_id = p_candidate_id
    AND is_custom_practice = true;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count > 0;
END;
$$;


-- 4. Permissions Lockdown: Revoke from public & anon; Grant to authenticated & service_role
REVOKE EXECUTE ON FUNCTION public.create_student_custom_test(UUID, TEXT, TEXT, INT, UUID[], BOOLEAN, INT) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.delete_student_custom_test(UUID, UUID) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.create_student_custom_test(UUID, TEXT, TEXT, INT, UUID[], BOOLEAN, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_student_custom_test(UUID, UUID) TO authenticated, service_role;

-- 5. Notify schema cache refresh
NOTIFY pgrst, 'reload schema';
