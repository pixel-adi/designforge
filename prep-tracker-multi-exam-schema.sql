-- =========================================================================
-- Designforge: Multi-Exam Universal Prep Tracker Schema
-- Supports dynamic backend plans for NID DAT, UCEED, CEED, NIFT, and custom exams
-- Run this in Supabase Dashboard -> SQL Editor
-- =========================================================================

BEGIN;

-- 1. Create table for dynamic exam plans
CREATE TABLE IF NOT EXISTS public.prep_exam_plans (
  id TEXT PRIMARY KEY,                       -- e.g. 'nid-ug-2027', 'uceed-2027', 'ceed-2027', 'nift-2027'
  exam_code TEXT NOT NULL,                  -- 'NID', 'UCEED', 'CEED', 'NIFT', etc.
  title TEXT NOT NULL,                      -- Full human readable title
  track TEXT NOT NULL DEFAULT 'ug',         -- 'ug' | 'pg'
  academic_year TEXT NOT NULL DEFAULT '2027',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  exam_date DATE NOT NULL,
  tiers JSONB DEFAULT '{
    "light": { "label": "Light", "summary": "12 to 15 hours a week" },
    "intensive": { "label": "Intensive", "summary": "18 to 22 hours a week" }
  }'::jsonb,
  phases JSONB DEFAULT '[]'::jsonb,
  days JSONB DEFAULT '[]'::jsonb,
  reference_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.prep_exam_plans ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Public & Authenticated Read, Admin Full Write
DROP POLICY IF EXISTS "Allow read active exam plans" ON public.prep_exam_plans;
CREATE POLICY "Allow read active exam plans" ON public.prep_exam_plans
  FOR SELECT TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage exam plans" ON public.prep_exam_plans;
CREATE POLICY "Admins manage exam plans" ON public.prep_exam_plans
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- 4. Extend prep_enrolments to support multi-exam tracking
ALTER TABLE public.prep_enrolments 
  ADD COLUMN IF NOT EXISTS active_exam_ids TEXT[] DEFAULT ARRAY['nid-ug-2027'],
  ADD COLUMN IF NOT EXISTS primary_exam_id TEXT DEFAULT 'nid-ug-2027';

-- 5. Seed default starter plans for NID UG, NID PG, UCEED 2027, CEED 2027, and NIFT 2027
INSERT INTO public.prep_exam_plans (id, exam_code, title, track, academic_year, start_date, end_date, exam_date, tiers, phases, is_active)
VALUES
  (
    'nid-ug-2027',
    'NID',
    'NID DAT 2027: B.Des & Integrated M.Des',
    'ug',
    '2027',
    '2026-09-19',
    '2026-12-19',
    '2026-12-20',
    '{
      "light": { "label": "Light", "summary": "About 12 to 15 hours a week" },
      "intensive": { "label": "Intensive", "summary": "About 18 to 22 hours a week" }
    }'::jsonb,
    '[
      { "id": "p1", "name": "Foundation", "startDate": "2026-09-19", "endDate": "2026-10-11", "summary": "Drawing L0-L2, diary, first builds" },
      { "id": "p2", "name": "Visual thinking & ideation", "startDate": "2026-10-12", "endDate": "2026-11-01", "summary": "Ten-in-ten daily, explanation cards, making drills" },
      { "id": "p3", "name": "Concept, context & simulation", "startDate": "2026-11-02", "endDate": "2026-11-22", "summary": "Weekly simulation, error ledger, speed" },
      { "id": "p4", "name": "Mains weighting & repair", "startDate": "2026-11-23", "endDate": "2026-12-13", "summary": "Studio briefs, rehearsal, weak-area repair" },
      { "id": "p5", "name": "Taper", "startDate": "2026-12-14", "endDate": "2026-12-19", "summary": "Volume down, sleep up, materials checked" }
    ]'::jsonb,
    true
  ),
  (
    'nid-pg-2027',
    'NID',
    'NID DAT 2027: M.Des Disciplines (Groups 1–5 & GX)',
    'pg',
    '2027',
    '2026-09-19',
    '2026-12-19',
    '2026-12-20',
    '{
      "light": { "label": "Light", "summary": "About 12 to 15 hours a week" },
      "intensive": { "label": "Intensive", "summary": "About 18 to 22 hours a week" }
    }'::jsonb,
    '[
      { "id": "pg-p1", "name": "Discipline grounding", "startDate": "2026-09-19", "endDate": "2026-10-11", "summary": "Core discipline papers, method, diary" },
      { "id": "pg-p2", "name": "Domain synthesis", "startDate": "2026-10-12", "endDate": "2026-11-01", "summary": "Cross-discipline builds, pitch logs, studio mock" },
      { "id": "pg-p3", "name": "Full simulations", "startDate": "2026-11-02", "endDate": "2026-11-22", "summary": "Discipline-specific paper drills & error ledger" },
      { "id": "pg-p4", "name": "Interview & articulation", "startDate": "2026-11-23", "endDate": "2026-12-13", "summary": "Pitch defense, studio test preparation" },
      { "id": "pg-p5", "name": "Taper", "startDate": "2026-12-14", "endDate": "2026-12-19", "summary": "Discipline cards review, mental rest" }
    ]'::jsonb,
    true
  ),
  (
    'uceed-2027',
    'UCEED',
    'UCEED 2027: B.Des (IIT Bombay, Delhi, Guwahati, Hyderabad, Jabalpur)',
    'ug',
    '2027',
    '2026-09-28',
    '2027-01-16',
    '2027-01-17',
    '{
      "light": { "label": "Light", "summary": "12 to 15 hours a week (NAT/MSQ/MCQ + Drawing)" },
      "intensive": { "label": "Intensive", "summary": "18 to 22 hours a week (Comprehensive speed & Aptitude)" }
    }'::jsonb,
    '[
      { "id": "uceed-p1", "name": "Part A Foundations & Visualization", "startDate": "2026-09-28", "endDate": "2026-10-25", "summary": "Spatial reasoning, 2D/3D visualization, observation" },
      { "id": "uceed-p2", "name": "Design Thinking & Part B Drawing", "startDate": "2026-10-26", "endDate": "2026-11-22", "summary": "Perspective drawing, proportions, shaded rendering, environmental observation" },
      { "id": "uceed-p3", "name": "Timed Speed & Negative Marking Control", "startDate": "2026-11-23", "endDate": "2026-12-20", "summary": "NAT & MSQ mastery, accuracy drills, full computer simulations" },
      { "id": "uceed-p4", "name": "Sprint & Exam Mastery", "startDate": "2026-12-21", "endDate": "2027-01-16", "summary": "Full combined simulation Part A + B under strict exam conditions" }
    ]'::jsonb,
    true
  ),
  (
    'ceed-2027',
    'CEED',
    'CEED 2027: Common Entrance Examination for Design (M.Des / Ph.D)',
    'pg',
    '2027',
    '2026-09-28',
    '2027-01-16',
    '2027-01-17',
    '{
      "light": { "label": "Light", "summary": "14 to 16 hours a week (Part A Qualifying + Part B Problem Solving)" },
      "intensive": { "label": "Intensive", "summary": "20 to 24 hours a week (Portfolio, Part B Drawing, Systems Design)" }
    }'::jsonb,
    '[
      { "id": "ceed-p1", "name": "Part A Aptitude & Visual Perception", "startDate": "2026-09-28", "endDate": "2026-10-25", "summary": "Cut-off clearance strategy, spatial logic, environmental sensitivity" },
      { "id": "ceed-p2", "name": "Part B Creative Problem Solving", "startDate": "2026-10-26", "endDate": "2026-11-22", "summary": "User scenario sketches, product forms, communication design solutions" },
      { "id": "ceed-p3", "name": "Discipline Depth & Timed Rendering", "startDate": "2026-11-23", "endDate": "2026-12-20", "summary": "Industrial/Visual/Animation focused questions, speed drafting" },
      { "id": "ceed-p4", "name": "Mock Simulations & Portfolio Review", "startDate": "2026-12-21", "endDate": "2027-01-16", "summary": "Full 3-hour Part A + B tests, feedback calibration" }
    ]'::jsonb,
    true
  ),
  (
    'nift-2027',
    'NIFT',
    'NIFT 2027: National Institute of Fashion Technology (CAT & GAT)',
    'ug',
    '2027',
    '2026-10-05',
    '2027-02-06',
    '2027-02-07',
    '{
      "light": { "label": "Light", "summary": "12 to 15 hours a week" },
      "intensive": { "label": "Intensive", "summary": "18 to 22 hours a week" }
    }'::jsonb,
    '[
      { "id": "nift-p1", "name": "Creative Ability (CAT) Form & Color", "startDate": "2026-10-05", "endDate": "2026-11-08", "summary": "Color theory, styling compositions, 2D design, visual metaphors" },
      { "id": "nift-p2", "name": "General Ability (GAT) & Speed", "startDate": "2026-11-09", "endDate": "2026-12-13", "summary": "Communication, analytics, fashion & design awareness" },
      { "id": "nift-p3", "name": "CAT Scenario & Product Storyboarding", "startDate": "2026-12-14", "endDate": "2027-01-17", "summary": "3-frame narratives, packaging design, mascot development" },
      { "id": "nift-p4", "name": "Full Length Exam Sprints", "startDate": "2027-01-18", "endDate": "2027-02-06", "summary": "CAT + GAT 3-hour mocks with critique review" }
    ]'::jsonb,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  exam_code = EXCLUDED.exam_code,
  track = EXCLUDED.track,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  exam_date = EXCLUDED.exam_date,
  tiers = EXCLUDED.tiers,
  phases = EXCLUDED.phases,
  updated_at = now();

COMMIT;
