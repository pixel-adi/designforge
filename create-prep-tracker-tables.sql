-- =============================================
-- NID DAT 2027 Prep Tracker Schema (Safe & Idempotent)
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================

-- 0. Security Definer Helper for Candidate Ownership
CREATE OR REPLACE FUNCTION public.prep_is_owner(p_candidate_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.exam_candidates
    WHERE id = p_candidate_id AND auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. Enrolments & Preferences
CREATE TABLE IF NOT EXISTS public.prep_enrolments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE UNIQUE,
  track TEXT NOT NULL CHECK (track IN ('ug', 'pg')),
  tier TEXT NOT NULL CHECK (tier IN ('light', 'intensive')),
  disciplines TEXT[] DEFAULT '{}',
  primary_group TEXT,
  application_submitted_at TIMESTAMPTZ,
  has_notes_access BOOLEAN DEFAULT false,
  content_version TEXT DEFAULT '2.0.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Diagnostic Scores
CREATE TABLE IF NOT EXISTS public.prep_diagnostic_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ DEFAULT now(),
  week INT NOT NULL DEFAULT 0,
  observation INT NOT NULL CHECK (observation BETWEEN 1 AND 5),
  drawing INT NOT NULL CHECK (drawing BETWEEN 1 AND 5),
  ideation INT NOT NULL CHECK (ideation BETWEEN 1 AND 5),
  form_material INT NOT NULL CHECK (form_material BETWEEN 1 AND 5),
  articulation INT NOT NULL CHECK (articulation BETWEEN 1 AND 5),
  awareness INT NOT NULL CHECK (awareness BETWEEN 1 AND 5),
  total INT NOT NULL CHECK (total BETWEEN 6 AND 30),
  band TEXT NOT NULL CHECK (band IN ('foundation', 'standard', 'sharpening'))
);

-- 3. Task Completions
CREATE TABLE IF NOT EXISTS public.prep_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  minutes_logged INT DEFAULT 0,
  note TEXT,
  UNIQUE (candidate_id, task_id)
);

-- 4. Simulation Logs
CREATE TABLE IF NOT EXISTS public.prep_simulation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  date DATE NOT NULL,
  paper_or_brief TEXT NOT NULL,
  time_taken_minutes INT NOT NULL,
  finished BOOLEAN NOT NULL DEFAULT true,
  dominant_bucket TEXT NOT NULL CHECK (dominant_bucket IN ('concept', 'time', 'clarity', 'care')),
  answer_rewritten BOOLEAN NOT NULL DEFAULT false,
  self_score NUMERIC(5, 2),
  mentor_score NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Error Ledger Entries
CREATE TABLE IF NOT EXISTS public.prep_error_ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  simulation_log_id UUID REFERENCES public.prep_simulation_logs(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  what_went_wrong TEXT NOT NULL,
  bucket TEXT NOT NULL CHECK (bucket IN ('concept', 'time', 'clarity', 'care')),
  root_cause TEXT NOT NULL,
  fixing_drill TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Critique Submissions
CREATE TABLE IF NOT EXISTS public.prep_critique_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  note TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Not submitted', 'Submitted', 'Feedback received')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  feedback_at TIMESTAMPTZ,
  feedback_by TEXT
);

-- 7. Sunday Reviews
CREATE TABLE IF NOT EXISTS public.prep_sunday_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  week INT NOT NULL CHECK (week BETWEEN 0 AND 13),
  improved_with_evidence TEXT NOT NULL,
  did_not_move_and_why TEXT NOT NULL,
  one_change TEXT NOT NULL,
  completion_check JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (candidate_id, week)
);

-- 8. Diary Entries
CREATE TABLE IF NOT EXISTS public.prep_diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  place TEXT NOT NULL,
  theme TEXT NOT NULL,
  what_i_saw TEXT NOT NULL,
  how_it_works TEXT NOT NULL,
  where_it_fails TEXT NOT NULL,
  what_id_change TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Explanation Cards
CREATE TABLE IF NOT EXISTS public.prep_explanation_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  task_id TEXT,
  who TEXT NOT NULL,
  what_breaks TEXT NOT NULL,
  the_move TEXT NOT NULL,
  why_this TEXT NOT NULL,
  what_it_costs TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Awareness Cards
CREATE TABLE IF NOT EXISTS public.prep_awareness_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  what_it_is TEXT NOT NULL,
  why_it_mattered TEXT NOT NULL,
  example_seen TEXT NOT NULL,
  opinion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Build Records
CREATE TABLE IF NOT EXISTS public.prep_build_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  task_id TEXT,
  drill_number INT,
  photos TEXT[] DEFAULT '{}',
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Articulation Logs
CREATE TABLE IF NOT EXISTS public.prep_articulation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  task_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('pitch', 'mockConversation')),
  topic TEXT NOT NULL,
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Performance Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_prep_enrolments_candidate ON public.prep_enrolments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prep_diagnostic_candidate ON public.prep_diagnostic_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prep_completions_candidate ON public.prep_task_completions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prep_simulations_candidate ON public.prep_simulation_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prep_error_ledger_candidate ON public.prep_error_ledger_entries(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prep_critique_candidate ON public.prep_critique_submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prep_sunday_candidate ON public.prep_sunday_reviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prep_diary_candidate ON public.prep_diary_entries(candidate_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE public.prep_enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_diagnostic_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_simulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_error_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_critique_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_sunday_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_explanation_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_awareness_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_build_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_articulation_logs ENABLE ROW LEVEL SECURITY;

-- Helper macro for standard candidate RLS policies
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'prep_enrolments', 'prep_diagnostic_scores', 'prep_task_completions',
    'prep_simulation_logs', 'prep_error_ledger_entries', 'prep_critique_submissions',
    'prep_sunday_reviews', 'prep_diary_entries', 'prep_explanation_cards',
    'prep_awareness_cards', 'prep_build_records', 'prep_articulation_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Drop existing to ensure clean idempotent run
    EXECUTE format('DROP POLICY IF EXISTS "Candidate manage own %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Staff read %I" ON public.%I', tbl, tbl);

    -- Candidate full access to their own records
    EXECUTE format(
      'CREATE POLICY "Candidate manage own %I" ON public.%I
       FOR ALL TO authenticated
       USING (public.prep_is_owner(candidate_id))
       WITH CHECK (public.prep_is_owner(candidate_id))',
      tbl, tbl
    );

    -- Staff read access for grading/mentoring
    EXECUTE format(
      'CREATE POLICY "Staff read %I" ON public.%I
       FOR SELECT TO authenticated
       USING (EXISTS (SELECT 1 FROM public.staff_users WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
  END LOOP;
END $$;
