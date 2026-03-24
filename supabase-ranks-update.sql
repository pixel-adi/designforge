-- Add student_name and stream to existing ranks table
ALTER TABLE ranks ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE ranks ADD COLUMN IF NOT EXISTS stream TEXT;

-- For backwards compatibility/safety, these columns can be null.
-- Update existing records if necessary, though they will just be null.
-- Now go to your Supabase Dashboard -> SQL Editor and Run this!
