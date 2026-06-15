-- Add active_session_id column for single-device session enforcement
ALTER TABLE public.exam_candidates
  ADD COLUMN IF NOT EXISTS active_session_id TEXT;
