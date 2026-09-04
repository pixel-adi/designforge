-- =========================================================================
-- Designforge: AI-Native UX Cohort Leads Table Migration
-- Run this in the Supabase Dashboard -> SQL Editor (Click 'New query' -> 'Run')
-- =========================================================================

-- 1. Create the cohort_leads table
CREATE TABLE IF NOT EXISTS public.cohort_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  interest TEXT DEFAULT 'Founding Cohort',
  program TEXT DEFAULT 'AI-Native UX',
  source TEXT DEFAULT '/courses/ai-native-ux',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.cohort_leads ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anonymous public visitors to submit the lead modal
DROP POLICY IF EXISTS "Allow public insert cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow public insert cohort_leads" 
ON public.cohort_leads
FOR INSERT 
TO anon 
WITH CHECK (
  length(trim(name)) > 0 AND 
  length(trim(email)) > 0 AND 
  length(trim(phone)) > 0
);

-- 4. Policy: Allow authenticated visitors/users to also insert
DROP POLICY IF EXISTS "Allow authenticated insert cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow authenticated insert cohort_leads" 
ON public.cohort_leads
FOR INSERT 
TO authenticated 
WITH CHECK (
  length(trim(name)) > 0 AND 
  length(trim(email)) > 0 AND 
  length(trim(phone)) > 0
);

-- 5. Policy: Allow authenticated staff / admin users to view all leads
DROP POLICY IF EXISTS "Allow authenticated select cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow authenticated select cohort_leads" 
ON public.cohort_leads
FOR SELECT 
TO authenticated 
USING (true);

-- 6. Policy: Allow authenticated staff / admin users to delete leads
DROP POLICY IF EXISTS "Allow authenticated delete cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow authenticated delete cohort_leads" 
ON public.cohort_leads
FOR DELETE 
TO authenticated 
USING (true);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cohort_leads_created_at ON public.cohort_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_leads_email ON public.cohort_leads (email);
CREATE INDEX IF NOT EXISTS idx_cohort_leads_program ON public.cohort_leads (program);
