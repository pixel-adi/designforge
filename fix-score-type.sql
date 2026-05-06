-- Fix exam_attempts score column type to support decimals
ALTER TABLE exam_attempts ALTER COLUMN score_part_a TYPE NUMERIC(10,2);
