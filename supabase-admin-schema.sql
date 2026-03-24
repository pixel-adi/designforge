-- =============================================
-- Admin Dashboard — Additional Schema
-- Run this in the Supabase Dashboard → SQL Editor
-- =============================================

-- Workshops table
CREATE TABLE IF NOT EXISTS workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ,
  duration TEXT,
  location TEXT DEFAULT 'Online',
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  is_featured BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  duration TEXT,
  start_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Workshops: public read visible, authenticated full
CREATE POLICY "Allow public read visible workshops" ON workshops
  FOR SELECT TO anon USING (is_visible = true);
CREATE POLICY "Allow authenticated full access workshops" ON workshops
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Programs: public read active, authenticated full
CREATE POLICY "Allow public read active programs" ON programs
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Allow authenticated full access programs" ON programs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add update+delete policies for registrations (for admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update registrations') THEN
    CREATE POLICY "Allow authenticated update registrations" ON registrations
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated delete registrations') THEN
    CREATE POLICY "Allow authenticated delete registrations" ON registrations
      FOR DELETE TO authenticated USING (true);
  END IF;
END$$;
