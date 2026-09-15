import {
  Track,
  Tier,
  Band,
  DiagnosticScores,
  StudentProfileInput,
  ResolvedProfile,
  WhenCondition,
  TaskRecord,
  ResolvedTask,
  DayRecord,
  ResolvedDay,
} from './types';

export const AXIS_DISPLAY_NAMES: Record<string, string> = {
  form_material: 'Form and material',
  articulation: 'Articulation',
  observation: 'Observation',
  drawing: 'Drawing fluency',
  ideation: 'Ideation speed',
  awareness: 'Awareness',
};

export const TIE_BREAK_AXIS_ORDER: (keyof DiagnosticScores)[] = [
  'form_material',
  'articulation',
  'observation',
  'drawing',
  'ideation',
  'awareness',
];

export const PG_DISCIPLINE_GROUPS: Record<string, string[]> = {
  G1: [
    'Animation Film Design',
    'Film & Video Communication',
    'Graphic Design',
    'Photography Design',
  ],
  G2: [
    'Apparel Design',
    'Lifestyle Accessory Design',
    'Textile Design',
  ],
  G3: [
    'Design for Retail Experience',
    'Exhibition Design',
    'Furniture & Interior Design',
  ],
  G4: [
    'Ceramic & Glass Design',
    'Product Design',
    'Toy & Game Design',
    'Transportation & Automobile Design',
  ],
  G5: [
    'Digital Game Design',
    'Information Design',
    'Interaction Design',
    'New Media Design',
  ],
  GX: [
    'Design Trends and Futures',
    'Design Education',
    'Strategic Design Management',
    'Universal Design',
  ],
};

export function getDisciplineGroup(name: string): string | null {
  for (const [group, list] of Object.entries(PG_DISCIPLINE_GROUPS)) {
    if (list.includes(name)) return group;
  }
  return null;
}

export function validatePgDisciplines(disciplines: string[]): { valid: boolean; error?: string } {
  if (!disciplines || disciplines.length === 0) {
    return { valid: false, error: 'Please choose at least one discipline.' };
  }
  if (disciplines.length > 3) {
    return { valid: false, error: 'You can select a maximum of three disciplines.' };
  }

  const groups = disciplines.map(d => getDisciplineGroup(d)).filter(Boolean) as string[];
  if (groups.length !== disciplines.length) {
    return { valid: false, error: 'One or more selected disciplines are invalid.' };
  }

  // Count 1: Any one discipline
  if (disciplines.length === 1) {
    return { valid: true };
  }

  const nonGxGroups = groups.filter(g => g !== 'GX');
  const gxCount = groups.filter(g => g === 'GX').length;

  // Count 2: Two disciplines from same group (not GX), or one from 1-5 + one from GX
  if (disciplines.length === 2) {
    if (gxCount === 2) {
      return { valid: false, error: 'Cannot choose two disciplines from Group X.' };
    }
    if (gxCount === 1) {
      return { valid: true }; // One from 1-5 and one from GX
    }
    if (nonGxGroups[0] === nonGxGroups[1]) {
      return { valid: true }; // Two from same group (not GX)
    }
    return {
      valid: false,
      error: 'Two disciplines must be in the same group, or one of them must be in Group X.',
    };
  }

  // Count 3: Two from same group (not GX) + one from GX
  if (disciplines.length === 3) {
    if (gxCount !== 1) {
      return {
        valid: false,
        error: 'Three choices must include exactly one discipline from Group X and two from the same group.',
      };
    }
    if (nonGxGroups.length === 2 && nonGxGroups[0] === nonGxGroups[1]) {
      return { valid: true };
    }
    return {
      valid: false,
      error: 'The two non-Group X disciplines must both be from the same group.',
    };
  }

  return { valid: false, error: 'Invalid discipline combination.' };
}

export function calculateBand(total: number): Band {
  if (total <= 13) return 'foundation';
  if (total <= 22) return 'standard';
  return 'sharpening';
}

export function calculateAxes(diagnostic: DiagnosticScores | null | undefined): {
  axis1: string;
  axis2: string;
  axis1Name: string;
  axis2Name: string;
} {
  if (!diagnostic) {
    return {
      axis1: 'form_material',
      axis2: 'articulation',
      axis1Name: AXIS_DISPLAY_NAMES['form_material'],
      axis2Name: AXIS_DISPLAY_NAMES['articulation'],
    };
  }

  // Sort axes by score ascending; on tie, use TIE_BREAK_AXIS_ORDER
  const sorted = [...TIE_BREAK_AXIS_ORDER].sort((a, b) => {
    const scoreA = diagnostic[a] ?? 5;
    const scoreB = diagnostic[b] ?? 5;
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }
    return TIE_BREAK_AXIS_ORDER.indexOf(a) - TIE_BREAK_AXIS_ORDER.indexOf(b);
  });

  const a1 = sorted[0];
  const a2 = sorted[1];
  return {
    axis1: a1,
    axis2: a2,
    axis1Name: AXIS_DISPLAY_NAMES[a1] || a1,
    axis2Name: AXIS_DISPLAY_NAMES[a2] || a2,
  };
}

export function resolveProfile(input: StudentProfileInput): ResolvedProfile {
  let total = 18; // default to standard before diagnostic
  let band: Band = 'standard';
  if (input.diagnostic) {
    total = Object.values(input.diagnostic).reduce((sum, v) => sum + (v || 0), 0);
    band = calculateBand(total);
  }

  const { axis1, axis2, axis1Name, axis2Name } = calculateAxes(input.diagnostic);

  let primaryGroup: string | undefined;
  let hasSecondaryGroupX: boolean | undefined;

  if (input.track === 'pg' && input.disciplines && input.disciplines.length > 0) {
    const groups = input.disciplines.map(d => getDisciplineGroup(d)).filter(Boolean) as string[];
    const firstNonGx = groups.find(g => g !== 'GX');
    primaryGroup = firstNonGx || 'GX';
    hasSecondaryGroupX = groups.includes('GX') && primaryGroup !== 'GX';
  }

  return {
    track: input.track,
    tier: input.tier,
    diagnostic: input.diagnostic || null,
    total,
    band,
    axis1,
    axis2,
    axis1Name,
    axis2Name,
    primaryGroup,
    hasSecondaryGroupX,
    disciplines: input.disciplines || [],
    applicationSubmittedAt: input.applicationSubmittedAt || null,
    hasNotesAccess: input.hasNotesAccess || false,
  };
}

export function matches(when: WhenCondition | undefined, profile: ResolvedProfile): boolean {
  if (!when) return true;

  if (when.bands && when.bands.length > 0) {
    if (!when.bands.includes(profile.band)) return false;
  }

  if (when.hasSecondaryGroupX !== undefined) {
    if (Boolean(when.hasSecondaryGroupX) !== Boolean(profile.hasSecondaryGroupX)) {
      return false;
    }
  }

  if (when.axisBelow) {
    // If no diagnostic taken, spec says evaluate to true
    if (profile.diagnostic) {
      for (const [axis, limit] of Object.entries(when.axisBelow)) {
        const score = profile.diagnostic[axis as keyof DiagnosticScores];
        if (score === undefined || score >= limit) {
          return false;
        }
      }
    }
  }

  if (when.axisAtLeast) {
    // If no diagnostic taken, spec says evaluate to false
    if (!profile.diagnostic) return false;
    for (const [axis, limit] of Object.entries(when.axisAtLeast)) {
      const score = profile.diagnostic[axis as keyof DiagnosticScores];
      if (score === undefined || score < limit) {
        return false;
      }
    }
  }

  return true;
}

function replaceAxisTokens(text: string, axis1Name: string, axis2Name: string): string {
  if (!text) return text;
  return text.replaceAll('{axis1}', axis1Name).replaceAll('{axis2}', axis2Name);
}

export function resolveTask(task: TaskRecord, profile: ResolvedProfile): ResolvedTask | null {
  if (task.when && !matches(task.when, profile)) {
    return null;
  }

  const minutes = task.minutes[profile.tier];
  if (minutes === null || minutes === undefined) {
    return null;
  }

  const out: ResolvedTask = {
    id: task.id,
    block: task.block,
    module: task.module,
    kind: task.kind,
    capture: task.capture || [],
    title: task.title,
    detail: task.detail,
    minutes,
    optional: task.optional?.[profile.tier] === true,
  };

  // If group specific text for PG
  if (task.byGroup && profile.track === 'pg' && profile.primaryGroup) {
    const groupOverride = task.byGroup[profile.primaryGroup];
    if (groupOverride) {
      if (groupOverride.title) out.title = groupOverride.title;
      if (groupOverride.detail) out.detail = groupOverride.detail;
    }
  }

  // Variants in order
  if (task.variants && task.variants.length > 0) {
    for (const v of task.variants) {
      if (matches(v.when, profile)) {
        if (v.title) out.title = v.title;
        if (v.detail) out.detail = v.detail;
        if (v.minutes && v.minutes[profile.tier] !== undefined && v.minutes[profile.tier] !== null) {
          out.minutes = v.minutes[profile.tier]!;
        }
        break;
      }
    }
  }

  out.title = replaceAxisTokens(out.title, profile.axis1Name, profile.axis2Name);
  out.detail = replaceAxisTokens(out.detail, profile.axis1Name, profile.axis2Name);

  return out;
}

export function getTodayDateAsiaKolkata(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

export function resolveDay(
  day: DayRecord,
  profile: ResolvedProfile,
  completions: Record<string, { completedAt: string; minutesLogged?: number }> = {},
  todayDateStr: string = getTodayDateAsiaKolkata()
): ResolvedDay {
  const resolvedTasks: ResolvedTask[] = [];

  for (const t of day.tasks) {
    const res = resolveTask(t, profile);
    if (res) {
      const comp = completions[res.id];
      res.completed = Boolean(comp);
      res.completedAt = comp ? comp.completedAt : null;
      resolvedTasks.push(res);
    }
  }

  const isToday = day.date === todayDateStr;
  const isPast = day.date < todayDateStr;
  const isLocked = day.date > todayDateStr;

  const countedTasks = resolvedTasks.filter(t => !t.optional);
  const completedCount = countedTasks.filter(t => t.completed).length;

  return {
    day: day.day,
    date: day.date,
    weekday: day.weekday,
    week: day.week,
    phaseId: day.phaseId,
    title: day.title,
    tasks: resolvedTasks,
    isLocked,
    isToday,
    isPast,
    completedCount,
    totalCount: countedTasks.length,
  };
}
