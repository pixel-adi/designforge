import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rounds any score to strictly at most two decimal places.
 */
export function roundScore(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

/**
 * Formats a score to at most 2 decimal places without trailing zeros (e.g. "12.5", "12.25", "12").
 */
export function formatScore(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  const rounded = roundScore(value);
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Resolves the accurate maximum allotted marks for a Part B subjective question.
 * Fallbacks safely if marks were not explicitly recorded in exam_test_questions.
 */
export function resolvePartBMaxMarks(q: any, test?: any): number {
  if (!q) return 15;
  if (q.marks && !isNaN(Number(q.marks)) && Number(q.marks) > 0) {
    return Number(q.marks);
  }
  if (q.test_question_marks && !isNaN(Number(q.test_question_marks)) && Number(q.test_question_marks) > 0) {
    return Number(q.test_question_marks);
  }
  
  // Test format heuristics
  const testTitle = (test?.title || '').toLowerCase();
  const progName = (test?.exam_programs?.name || '').toLowerCase();
  const progFormat = (test?.program_format || '').toLowerCase();

  const isCeed = testTitle.includes('ceed') || progName.includes('ceed') || testTitle.includes('m.des') || testTitle.includes('mdes') || progFormat === 'masters';
  if (isCeed && !testTitle.includes('uceed') && !progName.includes('uceed')) {
    return 20;
  }
  return 15;
}
