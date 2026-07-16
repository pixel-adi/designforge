-- ========================================================
-- Create System Settings Table for Secure Key/Value Store
-- ========================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated staff users (admin, sme, mentor) to read settings
DROP POLICY IF EXISTS "Allow staff to read settings" ON public.system_settings;
CREATE POLICY "Allow staff to read settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING (public.is_sme_or_admin() OR public.is_admin());

-- Allow admins to manage settings (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Allow admins to manage settings" ON public.system_settings;
CREATE POLICY "Allow admins to manage settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
