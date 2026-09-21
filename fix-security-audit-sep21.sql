-- =========================================================================================
-- FIX: Security vulnerabilities — Sep 21 audit
-- 
-- 1. Workshops/Programs: USING(true) → private.is_admin() for write access
-- 2. Registrations: USING(true) → private.is_admin() for update/delete
-- 3. cohort_leads: add unique constraint on (email, interest) to prevent spam
-- 4. Remove anon EXECUTE on private.is_admin() and private.is_sme_or_admin()
--
-- Run in Supabase Dashboard → SQL Editor
-- =========================================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Workshops: keep public read, restrict write to admin
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated full access workshops" ON public.workshops;

CREATE POLICY "Admins manage workshops" ON public.workshops
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Keep public read for anon (already correct)
-- "Allow public read visible workshops" → FOR SELECT TO anon USING (is_visible = true)

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Programs: keep public read, restrict write to admin
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated full access programs" ON public.programs;

CREATE POLICY "Admins manage programs" ON public.programs
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Registrations: restrict update/delete to admin
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow authenticated delete registrations" ON public.registrations;

CREATE POLICY "Admins can update registrations" ON public.registrations
  FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admins can delete registrations" ON public.registrations
  FOR DELETE TO authenticated
  USING (private.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. cohort_leads: remove existing duplicates & add unique constraint to prevent spam
-- ─────────────────────────────────────────────────────────────────────────────
-- Keep earliest entry for duplicate (email, interest) pairs
DELETE FROM public.cohort_leads
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email, interest ORDER BY created_at ASC, id ASC) as rnum
    FROM public.cohort_leads
  ) t
  WHERE t.rnum > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_leads_email_interest_unique'
  ) THEN
    ALTER TABLE public.cohort_leads
      ADD CONSTRAINT cohort_leads_email_interest_unique
      UNIQUE (email, interest);
  END IF;
END$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Revoke anon EXECUTE on private functions (anon is never admin)
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION private.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION private.is_sme_or_admin() FROM anon;

COMMIT;
