export type Track = 'ug' | 'pg';
export type Tier = 'light' | 'intensive';
export type Band = 'foundation' | 'standard' | 'sharpening';

export type DiagnosticScores = {
  observation: number;
  drawing: number;
  ideation: number;
  form_material: number;
  articulation: number;
  awareness: number;
};

export type ExamCode = 'NID' | 'UCEED' | 'CEED' | 'NIFT' | string;

export interface ExamPlanMetadata {
  id: string;
  exam_code: ExamCode;
  title: string;
  track: Track;
  academic_year: string;
  start_date: string;
  end_date: string;
  exam_date: string;
  tiers?: Record<string, { label: string; summary: string }>;
  phases?: Array<{ id: string; name: string; startDate: string; endDate: string; summary: string }>;
  days?: DayRecord[];
  reference_data?: any;
  is_active?: boolean;
}

export interface StudentProfileInput {
  track: Track;
  tier: Tier;
  diagnostic?: DiagnosticScores | null;
  disciplines?: string[]; // PG only
  applicationSubmittedAt?: string | null;
  hasNotesAccess?: boolean;
  activeExamIds?: string[];
  primaryExamId?: string;
}

export interface ResolvedProfile {
  track: Track;
  tier: Tier;
  diagnostic: DiagnosticScores | null;
  total: number;
  band: Band;
  axis1: string; // lowest axis id
  axis2: string; // second lowest axis id
  axis1Name: string;
  axis2Name: string;
  primaryGroup?: string; // G1..G5 or GX
  hasSecondaryGroupX?: boolean;
  disciplines: string[];
  applicationSubmittedAt?: string | null;
  hasNotesAccess: boolean;
}

export interface WhenCondition {
  bands?: Band[];
  axisBelow?: Record<string, number>;
  axisAtLeast?: Record<string, number>;
  hasSecondaryGroupX?: boolean;
}

export interface TaskVariant {
  when: WhenCondition;
  title?: string;
  detail?: string;
  minutes?: { light?: number | null; intensive?: number | null };
}

export interface TaskRecord {
  id: string;
  block: string;
  module: string;
  kind: 'task' | 'milestone' | 'simulation' | 'review';
  title: string;
  detail: string;
  minutes: { light: number | null; intensive: number | null };
  capture: string[];
  optional?: { light?: boolean; intensive?: boolean };
  when?: WhenCondition;
  variants?: TaskVariant[];
  byGroup?: Record<string, { title?: string; detail?: string }>;
  axisSlot?: 1 | 2;
  source: string[];
}

export interface ResolvedTask {
  id: string;
  block: string;
  module: string;
  kind: 'task' | 'milestone' | 'simulation' | 'review';
  title: string;
  detail: string;
  minutes: number;
  capture: string[];
  optional: boolean;
  completed?: boolean;
  completedAt?: string | null;
}

export interface DayRecord {
  day: number;
  date: string;
  weekday: string;
  week: number;
  phaseId: string;
  title: string;
  tasks: TaskRecord[];
}

export interface ResolvedDay {
  day: number;
  date: string;
  weekday: string;
  week: number;
  phaseId: string;
  title: string;
  tasks: ResolvedTask[];
  isLocked: boolean;
  isToday: boolean;
  isPast: boolean;
  completedCount: number;
  totalCount: number;
}
