-- 1. Disable RLS entirely for ALL admin tables for development
ALTER TABLE exam_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_test_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_test_questions DISABLE ROW LEVEL SECURITY;

-- 2. Ensure the "anon" and "authenticated" roles have database permissions to insert into ALL tables
GRANT ALL ON exam_questions TO anon;
GRANT ALL ON exam_options TO anon;
GRANT ALL ON exam_tests TO anon;
GRANT ALL ON exam_test_sections TO anon;
GRANT ALL ON exam_test_questions TO anon;

GRANT ALL ON exam_questions TO authenticated;
GRANT ALL ON exam_options TO authenticated;
GRANT ALL ON exam_tests TO authenticated;
GRANT ALL ON exam_test_sections TO authenticated;
GRANT ALL ON exam_test_questions TO authenticated;
