export type QuestionPart = 'all' | 'A' | 'B';
export type QuestionType = 'all' | 'MCQ' | 'MSQ' | 'NAT' | 'SUBJECTIVE';
export type QuestionDifficulty = 'all' | 'Low' | 'Medium' | 'High';
export type PracticeStatusFilter = 'all' | 'unattempted' | 'practiced' | 'bookmarked';
export type ExamFilter = 'all' | 'nid' | 'uceed' | 'ceed' | 'nift' | 'pyq' | 'focus';

export interface QuestionOption {
  id: string;
  question_id: string;
  content_text: string;
  media_url?: string | null;
  is_correct?: boolean;
}

export interface QuestionItem {
  id: string;
  type: 'MCQ' | 'MSQ' | 'NAT' | 'SUBJECTIVE';
  part: 'A' | 'B';
  difficulty: 'Low' | 'Medium' | 'High';
  content_text: string;
  media_url?: string | null;
  topics?: string[];
  pyq_tag?: string | null;
  created_at?: string;
  sample_answer?: string | null;
  explanation?: string | null;
  solution_text?: string | null;
  correct_answer?: string | null;
  answer_key?: string | null;
  answer?: string | null;
  exam_options?: QuestionOption[];
}

export interface QuestionBankFilters {
  exam: ExamFilter;
  part: QuestionPart;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  domain: string;
  practiceStatus: PracticeStatusFilter;
  searchQuery: string;
}
