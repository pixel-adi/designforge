-- ====================================================
-- Migration: Add Category Column to exam_tests Table
-- Supports 'full_length', 'half_length', 'custom_short'
-- Safe & Idempotent
-- ====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'exam_tests' AND column_name = 'category'
  ) THEN
    ALTER TABLE exam_tests 
    ADD COLUMN category TEXT DEFAULT 'full_length';

    -- Add check constraint for category
    ALTER TABLE exam_tests 
    ADD CONSTRAINT check_exam_test_category 
    CHECK (category IN ('full_length', 'half_length', 'custom_short'));
  END IF;
END $$;
