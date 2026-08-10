-- =============================================
-- Exam Portal Schema (Run in Supabase Dashboard)
-- Safe to re-run multiple times (Idempotent)
-- =============================================

-- 1. Programs
CREATE TABLE IF NOT EXISTS exam_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., 'NID BDES', 'CEED'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Custom Types (Idempotent creation)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM ('MCQ', 'MSQ', 'NAT', 'SUBJECTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_part') THEN
    CREATE TYPE question_part AS ENUM ('A', 'B');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
    CREATE TYPE difficulty_level AS ENUM ('Low', 'Medium', 'High');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'response_status') THEN
    CREATE TYPE response_status AS ENUM ('unseen', 'skipped', 'marked', 'review', 'answered');
  END IF;
END $$;

-- 3. Questions Repository
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

-- 4. Options for Questions (Part A)
CREATE TABLE IF NOT EXISTS exam_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  content_text TEXT,
  media_url TEXT,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tests
CREATE TABLE IF NOT EXISTS exam_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  program_id UUID REFERENCES exam_programs(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Test Sections (Timing & Structure)
CREATE TABLE IF NOT EXISTS exam_test_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES exam_tests(id) ON DELETE CASCADE,
  part question_part NOT NULL,
  duration_minutes INT NOT NULL,
  UNIQUE(test_id, part)
);

-- 7. Link Tests to Questions
CREATE TABLE IF NOT EXISTS exam_test_questions (
  test_id UUID NOT NULL REFERENCES exam_tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, question_id)
);

-- 8. Candidates (Extends Supabase Auth users implicitly, or stores metadata)
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

DROP TRIGGER IF EXISTS trigger_generate_candidate_id ON exam_candidates;
CREATE TRIGGER trigger_generate_candidate_id
BEFORE INSERT ON exam_candidates
FOR EACH ROW
WHEN (NEW.unique_id IS NULL)
EXECUTE FUNCTION generate_candidate_id();

-- 9. Test Attempts (supports up to 3 attempts per candidate per test)
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

-- 10. Candidate Responses
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

-- Enable RLS
ALTER TABLE exam_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses ENABLE ROW LEVEL SECURITY;

-- Policies (Idempotent)
DROP POLICY IF EXISTS "Public programs" ON exam_programs;
CREATE POLICY "Public programs" ON exam_programs FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated tests" ON exam_tests;
CREATE POLICY "Authenticated tests" ON exam_tests FOR SELECT TO authenticated USING (status = 'published');

-- More complex RLS omitted for brevity to get the schema running.
