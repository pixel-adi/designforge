-- Fix Row Level Security (RLS) for the ranks table
-- This ensures that everyone can read the ranks, but only logged-in admins can edit them.

-- 1. Ensure RLS is enabled
ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Public ranks read" ON ranks;
DROP POLICY IF EXISTS "Admin ranks insert" ON ranks;
DROP POLICY IF EXISTS "Admin ranks update" ON ranks;
DROP POLICY IF EXISTS "Admin ranks delete" ON ranks;

-- 3. Allow public read access to ranks (needed for homepage and admin view)
CREATE POLICY "Public ranks read" ON ranks FOR SELECT USING (true);

-- 4. Allow authenticated users to insert/update/delete
CREATE POLICY "Admin ranks insert" ON ranks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin ranks update" ON ranks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin ranks delete" ON ranks FOR DELETE USING (auth.role() = 'authenticated');
