-- =============================================
-- Tiered Access System — RLS Policies
-- Enforces access control at the database level
-- for all content tables + anti-escalation trigger.
-- =============================================

-- ====== study_materials ======
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- All authenticated can read visible, non-exclusive materials
-- Focus batch can additionally read exclusive materials
CREATE POLICY "Authenticated can read visible materials"
  ON public.study_materials FOR SELECT TO authenticated
  USING (
    is_visible = true
    AND (
      is_focus_batch_exclusive = false
      OR auth.jwt()->>'email' LIKE '%@designforge.co.in'
      OR EXISTS (
        SELECT 1 FROM public.exam_candidates
        WHERE auth_user_id = auth.uid()
        AND access_level = 'focus_batch'
        AND (access_expires_at IS NULL OR access_expires_at > now())
      )
    )
  );

CREATE POLICY "Admins manage materials"
  ON public.study_materials FOR ALL TO authenticated
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in');

-- Block anonymous access
CREATE POLICY "No anonymous access to materials"
  ON public.study_materials FOR ALL TO anon USING (false);

-- ====== class_assignments ======
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid candidates read visible assignments"
  ON public.class_assignments FOR SELECT TO authenticated
  USING (
    is_visible = true AND (
      auth.jwt()->>'email' LIKE '%@designforge.co.in'
      OR EXISTS (
        SELECT 1 FROM public.exam_candidates
        WHERE auth_user_id = auth.uid()
        AND access_level IN ('materials_only', 'focus_batch')
        AND (access_expires_at IS NULL OR access_expires_at > now())
      )
    )
  );

CREATE POLICY "Admins manage assignments"
  ON public.class_assignments FOR ALL TO authenticated
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "No anonymous access to assignments"
  ON public.class_assignments FOR ALL TO anon USING (false);

-- ====== assignment_submissions ======
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Candidates can manage their own submissions
CREATE POLICY "Candidates manage own submissions"
  ON public.assignment_submissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_candidates
      WHERE id = assignment_submissions.candidate_id
      AND auth_user_id = auth.uid()
    )
  );

-- Admins can read/update all submissions (for review)
CREATE POLICY "Admins manage all submissions"
  ON public.assignment_submissions FOR ALL TO authenticated
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "No anonymous access to submissions"
  ON public.assignment_submissions FOR ALL TO anon USING (false);

-- ====== class_notes ======
ALTER TABLE public.class_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid candidates read visible notes"
  ON public.class_notes FOR SELECT TO authenticated
  USING (
    is_visible = true AND (
      auth.jwt()->>'email' LIKE '%@designforge.co.in'
      OR (
        -- Non-exclusive notes: materials_only or focus_batch
        is_focus_batch_exclusive = false
        AND EXISTS (
          SELECT 1 FROM public.exam_candidates
          WHERE auth_user_id = auth.uid()
          AND access_level IN ('materials_only', 'focus_batch')
          AND (access_expires_at IS NULL OR access_expires_at > now())
        )
      )
      OR (
        -- Exclusive notes: focus_batch only
        is_focus_batch_exclusive = true
        AND EXISTS (
          SELECT 1 FROM public.exam_candidates
          WHERE auth_user_id = auth.uid()
          AND access_level = 'focus_batch'
          AND (access_expires_at IS NULL OR access_expires_at > now())
        )
      )
    )
  );

CREATE POLICY "Admins manage notes"
  ON public.class_notes FOR ALL TO authenticated
  USING (auth.jwt()->>'email' LIKE '%@designforge.co.in');

CREATE POLICY "No anonymous access to notes"
  ON public.class_notes FOR ALL TO anon USING (false);

-- =============================================
-- Anti-escalation Trigger
-- Prevents candidates from self-modifying access_level,
-- access_expires_at, or access_payment_id via .update().
-- Only admin-domain users and service-role edge functions
-- can modify these columns.
-- =============================================
CREATE OR REPLACE FUNCTION prevent_access_self_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF (auth.jwt()->>'email' NOT LIKE '%@designforge.co.in') THEN
    NEW.access_level := OLD.access_level;
    NEW.access_expires_at := OLD.access_expires_at;
    NEW.access_payment_id := OLD.access_payment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_candidate_access_escalation ON public.exam_candidates;
CREATE TRIGGER prevent_candidate_access_escalation
BEFORE UPDATE ON public.exam_candidates
FOR EACH ROW
EXECUTE FUNCTION prevent_access_self_modification();
