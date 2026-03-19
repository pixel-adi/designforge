-- =============================================
-- Designforge Supabase Schema
-- Run this in the Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  program TEXT NOT NULL,
  stage TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_id TEXT,
  order_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ranks table (achievers / AIR data)
CREATE TABLE IF NOT EXISTS ranks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rank_label TEXT NOT NULL,
  exam TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-primary',
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Site content (simple CMS key-value store)
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Email subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Registrations: anyone can INSERT (public form), only authenticated can SELECT
CREATE POLICY "Allow public insert" ON registrations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON registrations
  FOR SELECT TO authenticated USING (true);

-- Ranks: public read
CREATE POLICY "Allow public read" ON ranks
  FOR SELECT TO anon USING (is_visible = true);

CREATE POLICY "Allow authenticated full access" ON ranks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Site content: public read
CREATE POLICY "Allow public read" ON site_content
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated full access" ON site_content
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Subscribers: anyone can INSERT, only authenticated can SELECT
CREATE POLICY "Allow public subscribe" ON subscribers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated read subscribers" ON subscribers
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- Seed Data: Initial ranks (current hardcoded data)
-- =============================================
INSERT INTO ranks (rank_label, exam, color, display_order) VALUES
  ('AIR 12', 'NID BDes', 'bg-pop-3', 1),
  ('AIR 4', 'NID MDes', 'bg-primary', 2),
  ('AIR 28', 'UCEED', 'bg-pop-1', 3),
  ('AIR 15', 'CEED', 'bg-pop-2', 4),
  ('AIR 9', 'NID BDes', 'bg-pop-3', 5),
  ('AIR 18', 'NID MDes', 'bg-primary', 6),
  ('AIR 34', 'UCEED', 'bg-pop-1', 7),
  ('AIR 21', 'CEED', 'bg-pop-2', 8);
