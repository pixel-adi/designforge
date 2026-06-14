-- =============================================
-- Tiered Access System — Schema Migration
-- Adds access tiers to exam_candidates and creates
-- content tables for study materials, assignments,
-- class notes, and assignment submissions.
-- =============================================

-- 1. Access tier columns on exam_candidates
ALTER TABLE public.exam_candidates
  ADD COLUMN IF NOT EXISTS access_level TEXT
    DEFAULT 'generic'
    CHECK (access_level IN ('generic', 'materials_only', 'focus_batch')),
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_payment_id TEXT;

-- 2. Study Materials (all tiers can read non-exclusive)
CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT,
  file_url TEXT,
  external_url TEXT,
  category TEXT NOT NULL,
  target_exam TEXT DEFAULT 'all'
    CHECK (target_exam IN ('UCEED', 'CEED', 'NID', 'all')),
  target_level TEXT DEFAULT 'both'
    CHECK (target_level IN ('bachelors', 'masters', 'both')),
  is_focus_batch_exclusive BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Class Assignments (paid tiers only)
CREATE TABLE IF NOT EXISTS public.class_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT,
  file_url TEXT,
  target_exam TEXT DEFAULT 'all'
    CHECK (target_exam IN ('UCEED', 'CEED', 'NID', 'all')),
  target_level TEXT DEFAULT 'both'
    CHECK (target_level IN ('bachelors', 'masters', 'both')),
  due_date TIMESTAMPTZ,
  is_visible BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Assignment Submissions (student uploads + mentor review)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.class_assignments(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  answer_text TEXT,
  status TEXT DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'reviewed', 'needs_revision')),
  mentor_comments TEXT,
  mentor_improvements TEXT,
  mentor_loom_link TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(assignment_id, candidate_id)
);

-- 5. Class Notes (paid tiers only)
CREATE TABLE IF NOT EXISTS public.class_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT,
  file_url TEXT,
  external_url TEXT,
  category TEXT NOT NULL,
  target_exam TEXT DEFAULT 'all'
    CHECK (target_exam IN ('UCEED', 'CEED', 'NID', 'all')),
  target_level TEXT DEFAULT 'both'
    CHECK (target_level IN ('bachelors', 'masters', 'both')),
  is_focus_batch_exclusive BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_materials_category ON public.study_materials(category);
CREATE INDEX IF NOT EXISTS idx_study_materials_target_exam ON public.study_materials(target_exam);
CREATE INDEX IF NOT EXISTS idx_study_materials_visible ON public.study_materials(is_visible) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_class_assignments_target_exam ON public.class_assignments(target_exam);
CREATE INDEX IF NOT EXISTS idx_class_assignments_visible ON public.class_assignments(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_class_assignments_due_date ON public.class_assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_candidate ON public.assignment_submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON public.assignment_submissions(status);

CREATE INDEX IF NOT EXISTS idx_class_notes_category ON public.class_notes(category);
CREATE INDEX IF NOT EXISTS idx_class_notes_target_exam ON public.class_notes(target_exam);
CREATE INDEX IF NOT EXISTS idx_class_notes_visible ON public.class_notes(is_visible) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_exam_candidates_access_level ON public.exam_candidates(access_level);
