-- =========================================================================================
-- FIX SUPABASE LINTER WARNING: Signed-In Users Can Execute SECURITY DEFINER Function
-- Target functions: public.is_admin() and public.is_sme_or_admin()
-- Run this script in your Supabase Dashboard -> SQL Editor
-- =========================================================================================

-- 1. Ensure private schema exists
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Create isolated private schema functions for database-internal RLS checks
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt()->>'email' LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION private.is_sme_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt()->>'email' LIKE '%@designforge.co.in'
    OR EXISTS (
      SELECT 1 FROM public.staff_users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'sme')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant private schema functions to service_role and postgres
GRANT EXECUTE ON FUNCTION private.is_admin() TO postgres, service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION private.is_sme_or_admin() TO postgres, service_role, authenticated, anon;

-- 3. Revoke EXECUTE from PUBLIC, anon, and authenticated on public schema SECURITY DEFINER functions
DO $$ 
BEGIN
  -- Revoke on public.is_admin()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_admin') THEN
    ALTER FUNCTION public.is_admin() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres, service_role;
  END IF;

  -- Revoke on public.is_sme_or_admin()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_sme_or_admin') THEN
    ALTER FUNCTION public.is_sme_or_admin() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.is_sme_or_admin() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.is_sme_or_admin() TO postgres, service_role;
  END IF;

  -- Revoke on public.prevent_access_self_modification()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'prevent_access_self_modification') THEN
    ALTER FUNCTION public.prevent_access_self_modification() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.prevent_access_self_modification() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.prevent_access_self_modification() TO postgres, service_role;
  END IF;
END $$;
