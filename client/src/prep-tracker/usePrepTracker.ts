import { useState, useEffect, useMemo, useCallback } from 'react';
import { prepApi, EnrolmentData } from './api';
import {
  Track,
  Tier,
  Band,
  DiagnosticScores,
  ResolvedProfile,
  ResolvedDay,
  DayRecord,
} from './types';
import {
  resolveProfile,
  resolveDay,
  getTodayDateAsiaKolkata,
  PG_DISCIPLINE_GROUPS,
} from './resolver';

// Import raw curriculum plans
import ugPlanData from '../../../prep-tracker-kit/content/plan.ug.json';
import pgPlanData from '../../../prep-tracker-kit/content/plan.pg.json';
import referenceData from '../../../prep-tracker-kit/content/reference.json';

export function usePrepTracker(candidateId: string | null) {
  const [loading, setLoading] = useState(true);
  const [enrolment, setEnrolment] = useState<any | null>(null);
  const [completions, setCompletions] = useState<Record<string, { completedAt: string; minutesLogged: number; note?: string }>>({});
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [allExamPlans, setAllExamPlans] = useState<any[]>([]);
  const [activeExamId, setActiveExamId] = useState<string>('nid-ug-2027');

  const todayDate = useMemo(() => getTodayDateAsiaKolkata(), []);

  // Fetch initial data
  const refreshData = useCallback(async () => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [enr, comp, diag, plans] = await Promise.all([
        prepApi.getEnrolment(candidateId),
        prepApi.getCompletions(candidateId),
        prepApi.getDiagnostics(candidateId),
        prepApi.getExamPlans(),
      ]);
      setEnrolment(enr);
      setCompletions(comp);
      setDiagnostics(diag);
      setAllExamPlans(plans || []);

      if (enr?.primary_exam_id) {
        setActiveExamId(enr.primary_exam_id);
      } else if (enr?.track === 'pg') {
        setActiveExamId('nid-pg-2027');
      } else {
        setActiveExamId('nid-ug-2027');
      }
    } catch (err) {
      console.error('Failed to load prep tracker data:', err);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Latest diagnostic
  const latestDiagnostic = useMemo<DiagnosticScores | null>(() => {
    if (!diagnostics || diagnostics.length === 0) return null;
    const latest = diagnostics[diagnostics.length - 1];
    return {
      observation: latest.observation,
      drawing: latest.drawing,
      ideation: latest.ideation,
      form_material: latest.form_material,
      articulation: latest.articulation,
      awareness: latest.awareness,
    };
  }, [diagnostics]);

  // Resolve active profile
  const resolvedProfile = useMemo<ResolvedProfile | null>(() => {
    if (!enrolment) return null;
    return resolveProfile({
      track: enrolment.track,
      tier: enrolment.tier,
      diagnostic: latestDiagnostic,
      disciplines: enrolment.disciplines || [],
      applicationSubmittedAt: enrolment.application_submitted_at,
      hasNotesAccess: Boolean(enrolment.has_notes_access),
    });
  }, [enrolment, latestDiagnostic]);

  // Raw plan
  const rawPlan = useMemo(() => {
    const matchedPlan = allExamPlans.find((p: any) => p.id === activeExamId);
    if (matchedPlan && Array.isArray(matchedPlan.days) && matchedPlan.days.length > 0) {
      return matchedPlan;
    }
    if (activeExamId === 'nid-pg-2027' || (resolvedProfile && resolvedProfile.track === 'pg')) {
      return pgPlanData;
    }
    return ugPlanData;
  }, [allExamPlans, activeExamId, resolvedProfile]);

  // Set today's day number when plan loads
  useEffect(() => {
    if (rawPlan && rawPlan.days) {
      const todayDay = rawPlan.days.find((d: any) => d.date === todayDate);
      if (todayDay) {
        setSelectedDayNum(todayDay.day);
      } else {
        // If before start date (Sep 19, 2026), default to Day 1
        setSelectedDayNum(1);
      }
    }
  }, [rawPlan, todayDate]);

  // Resolve all 92 days
  const resolvedDays = useMemo<ResolvedDay[]>(() => {
    if (!resolvedProfile || !rawPlan.days) return [];
    return (rawPlan.days as DayRecord[]).map(day =>
      resolveDay(day, resolvedProfile, completions, todayDate)
    );
  }, [rawPlan, resolvedProfile, completions, todayDate]);

  // Active selected day
  const currentDay = useMemo<ResolvedDay | null>(() => {
    if (!resolvedDays || resolvedDays.length === 0) return null;
    return resolvedDays.find(d => d.day === selectedDayNum) || resolvedDays[0];
  }, [resolvedDays, selectedDayNum]);

  // Overall statistics
  const stats = useMemo(() => {
    let totalCountedTasks = 0;
    let completedCountedTasks = 0;
    let totalMinutesLogged = 0;

    for (const d of resolvedDays) {
      for (const t of d.tasks) {
        if (!t.optional) {
          totalCountedTasks++;
          if (t.completed) completedCountedTasks++;
        }
        if (t.completed) {
          totalMinutesLogged += t.minutes || 0;
        }
      }
    }

    const percentage = totalCountedTasks > 0
      ? Math.round((completedCountedTasks / totalCountedTasks) * 100)
      : 0;

    return {
      totalCountedTasks,
      completedCountedTasks,
      percentage,
      totalMinutesLogged,
    };
  }, [resolvedDays]);

  // Task completion toggle
  const toggleTask = async (taskId: string, minutes: number = 0) => {
    if (!candidateId) return;
    const isCompleted = Boolean(completions[taskId]);
    setTogglingTaskId(taskId);

    // Optimistic update
    const previous = { ...completions };
    if (isCompleted) {
      const next = { ...completions };
      delete next[taskId];
      setCompletions(next);
    } else {
      setCompletions({
        ...completions,
        [taskId]: { completedAt: new Date().toISOString(), minutesLogged: minutes },
      });
    }

    try {
      await prepApi.toggleTaskCompletion(candidateId, taskId, !isCompleted, minutes);
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
      // Revert on error
      setCompletions(previous);
    } finally {
      setTogglingTaskId(null);
    }
  };

  // Complete onboarding
  const completeOnboarding = async (data: {
    track: Track;
    tier: Tier;
    disciplines?: string[];
    diagnosticScores: DiagnosticScores;
    activeExamIds?: string[];
    primaryExamId?: string;
  }) => {
    if (!candidateId) return;
    setLoading(true);
    try {
      let primaryGroup: string | undefined = undefined;
      const groups = (data.disciplines || []).map(discId => {
        for (const [groupKey, groupData] of Object.entries(PG_DISCIPLINE_GROUPS)) {
          if (groupData.disciplines.some(d => d.id === discId)) {
            return groupKey;
          }
        }
        return null;
      }).filter(Boolean) as string[];

      const firstNonGx = groups.find(g => g !== 'GX');
      const resolvedPrimaryGroup = firstNonGx || (groups.length > 0 ? 'GX' : undefined);

      const savedEnrolment = await prepApi.saveEnrolment({
        candidate_id: candidateId,
        track: data.track,
        tier: data.tier,
        disciplines: data.disciplines || [],
        primary_group: resolvedPrimaryGroup,
        active_exam_ids: data.activeExamIds && data.activeExamIds.length > 0 ? data.activeExamIds : ['nid-ug-2027'],
        primary_exam_id: data.primaryExamId || 'nid-ug-2027',
      });

      const total = Object.values(data.diagnosticScores).reduce((a, b) => a + b, 0);
      const band: Band = total <= 13 ? 'foundation' : total <= 22 ? 'standard' : 'sharpening';

      await prepApi.saveDiagnostic({
        candidate_id: candidateId,
        week: 0,
        scores: data.diagnosticScores,
        total,
        band,
      });

      setEnrolment(savedEnrolment);
      if (data.primaryExamId) {
        setActiveExamId(data.primaryExamId);
      }
      await refreshData();
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    enrolment,
    profile: resolvedProfile,
    rawPlan,
    referenceData,
    resolvedDays,
    currentDay,
    selectedDayNum,
    setSelectedDayNum,
    stats,
    todayDate,
    togglingTaskId,
    toggleTask,
    completeOnboarding,
    refreshData,
    activeExamId,
    setActiveExamId,
    allExamPlans,
    availableExamIds: enrolment?.active_exam_ids || ['nid-ug-2027'],
  };
}
