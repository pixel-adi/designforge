-- ==============================================================================
-- DESIGNFORGE MIGRATION: TEST CODES, DECIMAL PRECISION & SCORE ROUNDING
-- 1. Adds test_code column and index to exam_tests
-- 2. Backfills simplified nomenclature (FB-NID-01, GEN-UCEED-01, etc.)
-- 3. Enforces NUMERIC(10,2) precision on attempts and responses
-- Safe, idempotent, zero-downtime execution
-- ==============================================================================

-- 1. Add test_code column to exam_tests table
ALTER TABLE public.exam_tests 
ADD COLUMN IF NOT EXISTS test_code TEXT;

-- 2. Create index on test_code for fast search & filtering
CREATE INDEX IF NOT EXISTS idx_exam_tests_test_code 
ON public.exam_tests(test_code);

-- 3. Backfill test_code for existing tests using simplified nomenclature
DO $$
DECLARE
  r RECORD;
  v_seq INT;
  v_batch TEXT;
  v_prog TEXT;
  v_half TEXT;
  v_code TEXT;
BEGIN
  v_seq := 1;
  FOR r IN (
    SELECT t.id, t.title, t.is_focus_batch, t.program_format, t.category, p.name AS prog_name
    FROM public.exam_tests t
    LEFT JOIN public.exam_programs p ON t.program_id = p.id
    WHERE t.test_code IS NULL
    ORDER BY t.created_at ASC
  ) LOOP
    -- Determine Batch prefix (FB or GEN)
    IF r.is_focus_batch = true THEN
      v_batch := 'FB';
    ELSE
      v_batch := 'GEN';
    END IF;

    -- Determine Program prefix (NID, UCEED, CEED, NID-PG)
    IF lower(coalesce(r.prog_name, '')) LIKE '%nid%' OR lower(r.title) LIKE '%nid%' THEN
      IF r.program_format = 'masters' THEN
        v_prog := 'NID-PG';
      ELSE
        v_prog := 'NID';
      END IF;
    ELSIF lower(coalesce(r.prog_name, '')) LIKE '%ceed%' OR lower(r.title) LIKE '%ceed%' THEN
      IF lower(coalesce(r.prog_name, '')) LIKE '%uceed%' OR lower(r.title) LIKE '%uceed%' THEN
        v_prog := 'UCEED';
      ELSE
        v_prog := 'CEED';
      END IF;
    ELSE
      v_prog := 'DAT';
    END IF;

    -- Half-length indicator if applicable
    IF r.category = 'half_length' THEN
      v_half := 'H';
    ELSE
      v_half := '';
    END IF;

    -- Format: FB-NID-01 or FB-NID-H01
    v_code := v_batch || '-' || v_prog || '-' || v_half || lpad(v_seq::text, 2, '0');
    
    UPDATE public.exam_tests 
    SET test_code = v_code 
    WHERE id = r.id;

    v_seq := v_seq + 1;
  END LOOP;
END $$;

-- 4. Enforce strict NUMERIC(10,2) precision on attempt scores
ALTER TABLE public.exam_attempts 
ALTER COLUMN score_part_a TYPE NUMERIC(10,2),
ALTER COLUMN score_part_b TYPE NUMERIC(10,2),
ALTER COLUMN total_score TYPE NUMERIC(10,2);

-- 5. Enforce strict NUMERIC(10,2) precision on response marks
ALTER TABLE public.exam_responses 
ALTER COLUMN marks_awarded TYPE NUMERIC(10,2);

-- 6. Clean legacy score data to two decimal places
UPDATE public.exam_attempts 
SET 
  score_part_a = ROUND(score_part_a::numeric, 2),
  score_part_b = ROUND(score_part_b::numeric, 2),
  total_score = ROUND(total_score::numeric, 2)
WHERE 
  score_part_a IS NOT NULL OR score_part_b IS NOT NULL OR total_score IS NOT NULL;

UPDATE public.exam_responses 
SET marks_awarded = ROUND(marks_awarded::numeric, 2) 
WHERE marks_awarded IS NOT NULL;

-- 7. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

