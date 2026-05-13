-- Create B-Tree indexes for frequently queried columns to vastly improve read times

-- For the Candidate Dashboard and Leaderboards
CREATE INDEX IF NOT EXISTS idx_exam_attempts_candidate_id ON exam_attempts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_test_id ON exam_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON exam_attempts(status);

-- For the Admin portals filtering attempts
CREATE INDEX IF NOT EXISTS idx_exam_attempts_part_b_status ON exam_attempts(part_b_evaluation_status);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_completed_at ON exam_attempts(completed_at DESC);

-- For retrieving responses associated with an attempt quickly
CREATE INDEX IF NOT EXISTS idx_exam_responses_attempt_id ON exam_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_responses_question_id ON exam_responses(question_id);

-- For fetching candidate details
CREATE INDEX IF NOT EXISTS idx_exam_candidates_auth_user_id ON exam_candidates(auth_user_id);
