-- ==============================================================================
-- ADVANCED PERFORMANCE ANALYTICS & STUDENT FEATURE REQUESTS
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. Add Telemetry Columns to Responses
ALTER TABLE public.exam_responses 
ADD COLUMN IF NOT EXISTS time_spent INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS answer_changes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS state_transitions JSONB DEFAULT '[]'::jsonb;

-- 2. Create Feature Requests Table
CREATE TABLE IF NOT EXISTS public.exam_feature_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'planned', 'completed')),
  votes UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Feature Requests
ALTER TABLE public.exam_feature_requests ENABLE ROW LEVEL SECURITY;

-- Allow candidates to view feature requests
CREATE POLICY "Candidates can read all feature requests" 
ON public.exam_feature_requests FOR SELECT TO authenticated USING (true);

-- Allow candidates to create feature requests
CREATE POLICY "Candidates can create feature requests" 
ON public.exam_feature_requests FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.exam_candidates WHERE id = candidate_id));

-- Allow candidates to upvote/update feature requests (e.g. to toggle votes array)
CREATE POLICY "Candidates can update feature requests" 
ON public.exam_feature_requests FOR UPDATE TO authenticated 
USING (true);
