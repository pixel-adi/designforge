-- 1. Enable RLS on all sensitive candidate tables
ALTER TABLE exam_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses ENABLE ROW LEVEL SECURITY;

-- 2. Revoke permissions from anonymous users (intrusions prevention)
REVOKE ALL ON exam_candidates FROM anon;
REVOKE ALL ON exam_attempts FROM anon;
REVOKE ALL ON exam_responses FROM anon;

-- 3. Clear existing conflicting policies
DROP POLICY IF EXISTS "Candidates can manage their own profile" ON exam_candidates;
DROP POLICY IF EXISTS "Candidates can read their own profile" ON exam_candidates;
DROP POLICY IF EXISTS "Candidates can insert their own profile" ON exam_candidates;
DROP POLICY IF EXISTS "Candidates can update their own profile" ON exam_candidates;
DROP POLICY IF EXISTS "Admins can delete profiles" ON exam_candidates;

DROP POLICY IF EXISTS "Candidates can view their own attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Candidates can insert their own attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Candidates can update their own attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Candidates can manage their own attempts" ON exam_attempts;

DROP POLICY IF EXISTS "Candidates can manage their own responses" ON exam_responses;

-- 4. Candidate Profile Policies (Link to auth.uid() OR admin domain)
CREATE POLICY "Candidates can read their own profile"
  ON exam_candidates FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid() OR auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "Candidates can insert their own profile"
  ON exam_candidates FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid() OR auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "Candidates can update their own profile"
  ON exam_candidates FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid() OR auth.jwt()->>'email' LIKE '%@designforge.co.in')
  WITH CHECK (auth_user_id = auth.uid() OR auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "Admins can delete profiles"
  ON exam_candidates FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in');

-- 5. Exam Attempts Policies (Must belong to candidate OR admin domain)
CREATE POLICY "Candidates can manage their own attempts"
  ON exam_attempts FOR ALL
  TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM exam_candidates WHERE auth_user_id = auth.uid()
    ) OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM exam_candidates WHERE auth_user_id = auth.uid()
    ) OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
  );

-- 6. Exam Responses Policies (Must belong to candidate's attempt OR admin domain)
CREATE POLICY "Candidates can manage their own responses"
  ON exam_responses FOR ALL
  TO authenticated
  USING (
    attempt_id IN (
      SELECT id FROM exam_attempts WHERE candidate_id IN (
        SELECT id FROM exam_candidates WHERE auth_user_id = auth.uid()
      )
    ) OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
  )
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM exam_attempts WHERE candidate_id IN (
        SELECT id FROM exam_candidates WHERE auth_user_id = auth.uid()
      )
    ) OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
  );
