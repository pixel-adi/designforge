-- =============================================
-- Exam Portal Schema (Run in Supabase Dashboard)
-- =============================================

-- 1. Programs
CREATE TABLE IF NOT EXISTS exam_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., 'NID BDES', 'CEED'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Questions Repository
CREATE TYPE question_type AS ENUM ('MCQ', 'MSQ', 'NAT', 'SUBJECTIVE');
CREATE TYPE question_part AS ENUM ('A', 'B');
CREATE TYPE difficulty_level AS ENUM ('Low', 'Medium', 'High');

CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type question_type NOT NULL,
  part question_part NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'Medium',
  content_text TEXT,
  media_url TEXT, -- URL to Supabase Storage if any
  topics TEXT[] DEFAULT '{}',
  pyq_tag TEXT, -- e.g., "CEED 2022"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Options for Questions (Part A)
CREATE TABLE IF NOT EXISTS exam_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  content_text TEXT,
  media_url TEXT,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tests
CREATE TABLE IF NOT EXISTS exam_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  program_id UUID REFERENCES exam_programs(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Test Sections (Timing & Structure)
CREATE TABLE IF NOT EXISTS exam_test_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES exam_tests(id) ON DELETE CASCADE,
  part question_part NOT NULL,
  duration_minutes INT NOT NULL,
  UNIQUE(test_id, part)
);

-- 6. Link Tests to Questions
CREATE TABLE IF NOT EXISTS exam_test_questions (
  test_id UUID NOT NULL REFERENCES exam_tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, question_id)
);

-- 7. Candidates (Extends Supabase Auth users implicitly, or stores metadata)
CREATE TABLE IF NOT EXISTS exam_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE, -- Link to Supabase Auth table auth.users
  unique_id TEXT UNIQUE, -- Ex: DF-26-0001 (Made nullable for trigger, enforced unique)
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  program_applied_for UUID REFERENCES exam_programs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate Unique ID Sequence
CREATE SEQUENCE IF NOT EXISTS exam_candidate_seq START 1;

CREATE OR REPLACE FUNCTION generate_candidate_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Format: DF-YY-XXXX (e.g., DF-26-0001)
  NEW.unique_id := 'DF-' || TO_CHAR(CURRENT_DATE, 'YY') || '-' || LPAD(nextval('exam_candidate_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_candidate_id
BEFORE INSERT ON exam_candidates
FOR EACH ROW
WHEN (NEW.unique_id IS NULL)
EXECUTE FUNCTION generate_candidate_id();

-- 8. Test Attempts (supports up to 3 attempts per candidate per test)
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES exam_candidates(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES exam_tests(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1,
  start_time TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  current_part question_part DEFAULT 'A',
  UNIQUE(candidate_id, test_id, attempt_number)
);

-- 9. Candidate Responses
CREATE TYPE response_status AS ENUM ('unseen', 'skipped', 'marked', 'review', 'answered');

CREATE TABLE IF NOT EXISTS exam_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  status response_status DEFAULT 'unseen',
  selected_options UUID[] DEFAULT '{}', -- Array of exam_options.id
  answer_text TEXT, -- For NAT
  file_url TEXT, -- For Part B (Storage URL)
  UNIQUE(attempt_id, question_id)
);

-- Storage buckets instructions:
-- You will need to manually create 2 buckets in Supabase Storage UI:
-- 1. 'question-media' (Public)
-- 2. 'candidate-submissions' (Private, or secured via RLS)

-- Enable RLS (Simplified for now)
ALTER TABLE exam_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses ENABLE ROW LEVEL SECURITY;

-- Note: Proper RLS policies need to be defined based on admin roles vs candidate roles.
-- For now, letting authenticated read.
CREATE POLICY "Public programs" ON exam_programs FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated tests" ON exam_tests FOR SELECT TO authenticated USING (status = 'published');
-- More complex RLS omitted for brevity to get the schema running.
