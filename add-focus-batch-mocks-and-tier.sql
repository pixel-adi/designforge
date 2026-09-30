-- ====================================================
-- Migration: Focus Batch Mocks & Tier Access
-- 1. Adds is_focus_batch & access_tier to exam_tests
-- 2. Adds has_focus_mocks_access to exam_candidates
-- 3. Updates self-escalation trigger for security
-- Safe & Idempotent
-- ====================================================

DO $$ 
BEGIN
  -- 1. Columns on exam_tests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_tests' AND column_name = 'is_focus_batch'
  ) THEN
    ALTER TABLE public.exam_tests ADD COLUMN is_focus_batch BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_tests' AND column_name = 'access_tier'
  ) THEN
    ALTER TABLE public.exam_tests ADD COLUMN access_tier TEXT DEFAULT 'all';
  END IF;

  -- 2. Columns on exam_candidates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_candidates' AND column_name = 'has_focus_mocks_access'
  ) THEN
    ALTER TABLE public.exam_candidates ADD COLUMN has_focus_mocks_access BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_candidates' AND column_name = 'focus_mocks_payment_id'
  ) THEN
    ALTER TABLE public.exam_candidates ADD COLUMN focus_mocks_payment_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_candidates' AND column_name = 'focus_mocks_purchased_at'
  ) THEN
    ALTER TABLE public.exam_candidates ADD COLUMN focus_mocks_purchased_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Security Trigger update to prevent client-side tampering of has_focus_mocks_access
CREATE OR REPLACE FUNCTION prevent_access_self_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only block if the authenticated user is modifying THEIR OWN row
  -- AND the access columns are actually changing.
  -- Admin updates other users' rows -> auth.uid() != target's auth_user_id -> allowed.
  -- Edge functions use service_role -> auth.uid() is NULL -> allowed.
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.auth_user_id
     AND (
       NEW.access_level IS DISTINCT FROM OLD.access_level
       OR NEW.access_expires_at IS DISTINCT FROM OLD.access_expires_at
       OR NEW.access_payment_id IS DISTINCT FROM OLD.access_payment_id
       OR NEW.has_focus_mocks_access IS DISTINCT FROM OLD.has_focus_mocks_access
       OR NEW.focus_mocks_payment_id IS DISTINCT FROM OLD.focus_mocks_payment_id
       OR NEW.focus_mocks_purchased_at IS DISTINCT FROM OLD.focus_mocks_purchased_at
     )
  THEN
    -- Silently revert the protected columns
    NEW.access_level := OLD.access_level;
    NEW.access_expires_at := OLD.access_expires_at;
    NEW.access_payment_id := OLD.access_payment_id;
    NEW.has_focus_mocks_access := OLD.has_focus_mocks_access;
    NEW.focus_mocks_payment_id := OLD.focus_mocks_payment_id;
    NEW.focus_mocks_purchased_at := OLD.focus_mocks_purchased_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_candidate_access_escalation ON public.exam_candidates;
CREATE TRIGGER prevent_candidate_access_escalation
BEFORE UPDATE ON public.exam_candidates
FOR EACH ROW
EXECUTE FUNCTION prevent_access_self_modification();
