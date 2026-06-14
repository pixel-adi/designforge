-- =============================================
-- Security Fix: Prevent Self-Escalation of Access Level
-- 
-- Uses auth.uid() instead of auth.jwt()->>'email' because
-- auth.uid() works reliably in Postgres trigger context.
--
-- Logic:
--   - If the updater IS the candidate (auth.uid() = auth_user_id),
--     silently revert any access column changes.
--   - If the updater is someone else (admin updating another user),
--     allow the change.
--   - If auth.uid() is NULL (service_role edge function),
--     allow the change.
-- =============================================

CREATE OR REPLACE FUNCTION prevent_access_self_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only block if the authenticated user is modifying THEIR OWN row
  -- AND the access columns are actually changing.
  -- Admin updates other users' rows → auth.uid() ≠ target's auth_user_id → allowed.
  -- Edge functions use service_role → auth.uid() is NULL → allowed.
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.auth_user_id
     AND (
       NEW.access_level IS DISTINCT FROM OLD.access_level
       OR NEW.access_expires_at IS DISTINCT FROM OLD.access_expires_at
       OR NEW.access_payment_id IS DISTINCT FROM OLD.access_payment_id
     )
  THEN
    -- Silently revert the protected columns
    NEW.access_level := OLD.access_level;
    NEW.access_expires_at := OLD.access_expires_at;
    NEW.access_payment_id := OLD.access_payment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger
DROP TRIGGER IF EXISTS prevent_candidate_access_escalation ON public.exam_candidates;
CREATE TRIGGER prevent_candidate_access_escalation
BEFORE UPDATE ON public.exam_candidates
FOR EACH ROW
EXECUTE FUNCTION prevent_access_self_modification();
