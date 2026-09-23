import React, { useState, useEffect } from 'react';
import { prepApi } from '../api';
import { ResolvedDay, DiagnosticScores, Band } from '../types';
import { Flame, Clock, Award, ShieldAlert, TrendingUp, CheckCircle2, AlertTriangle, Calendar, Layers } from 'lucide-react';

interface TrackerAnalyticsHistoryProps {
  candidateId: string;
  resolvedDays: ResolvedDay[];
  tier: 'light' | 'intensive';
  band?: Band;
  diagnostic?: DiagnosticScores | null;
}

const AXIS_NAMES: Record<string, string> = {
  observation: 'Observation',
  drawing: 'Drawing Fluency',
  ideation: 'Ideation Speed',
  form_material: 'Form & Material',
  articulation: 'Articulation',
  awareness: 'Awareness',
};

export function TrackerAnalyticsHistory({
  candidateId,
  resolvedDays,
  tier,
  band = 'standard',
  diagnostic,
}: TrackerAnalyticsHistoryProps) {
  const [diagnosticsList, setDiagnosticsList] = useState<any[]>([]);
  const [errorLedger, setErrorLedger] = useState<any[]>([]);
  const [simLogs, setSimLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!candidateId) {
        if (active) setLoading(false);
        return;
      }

      const withTimeout = (promise: Promise<any>, timeoutMs = 3000, fallback: any = []) =>
        Promise.race([
          promise,
          new Promise(resolve => setTimeout(() => resolve(fallback), timeoutMs)),
        ]);

      try {
        const [diag, errors, sims] = await Promise.all([
          withTimeout(prepApi.getDiagnostics(candidateId)),
          withTimeout(prepApi.getErrorLedgers(candidateId)),
          withTimeout(prepApi.getSimulationLogs(candidateId)),
        ]);
        if (active) {
          setDiagnosticsList(diag || []);
          setErrorLedger(errors || []);
          setSimLogs(sims || []);
        }
      } catch (e) {
        console.warn('Failed to load tracking analytics:', e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [candidateId]);

  // Calculate Streak & Completed Days
  const { currentStreak, maxStreak, totalCompletedDays, totalMinutesLogged } = React.useMemo(() => {
    let streak = 0;
    let max = 0;
    let completedDays = 0;
    let totalMinutes = 0;

    for (const d of resolvedDays) {
      const isDone = d.totalCount > 0 && d.completedCount >= d.totalCount;
      if (isDone) {
        completedDays++;
        streak++;
        if (streak > max) max = streak;
      } else if (d.isPast) {
        streak = 0;
      }
      for (const t of d.tasks) {
        if (t.completed) {
          totalMinutes += t.minutes || 0;
        }
      }
    }

    return {
      currentStreak: streak,
      maxStreak: max,
      totalCompletedDays: completedDays,
      totalMinutesLogged: totalMinutes,
    };
  }, [resolvedDays]);

  // Error Ledger Buckets
  const errorBuckets = React.useMemo(() => {
    const buckets = { concept: 0, time: 0, clarity: 0, care: 0 };
    for (const err of errorLedger) {
      if (err.bucket in buckets) {
        buckets[err.bucket as keyof typeof buckets]++;
      }
    }
    const total = Object.values(buckets).reduce((a, b) => a + b, 0);
    return {
      counts: buckets,
      total,
      percentages: {
        concept: total > 0 ? Math.round((buckets.concept / total) * 100) : 0,
        time: total > 0 ? Math.round((buckets.time / total) * 100) : 0,
        clarity: total > 0 ? Math.round((buckets.clarity / total) * 100) : 0,
        care: total > 0 ? Math.round((buckets.care / total) * 100) : 0,
      },
    };
  }, [errorLedger]);

  const targetHours = tier === 'light' ? 14 : 20;
  const hoursLogged = Math.round((totalMinutesLogged / 60) * 10) / 10;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full min-w-0">
      {/* Top Stat Cards (2-Column Grid perfectly sized for side panel) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Streak */}
        <div className="p-3.5 rounded-xl border border-black/5 bg-[#f8fafc] shadow-2xs">
          <div className="flex items-center gap-1.5 text-amber-500 mb-1">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Streak</span>
          </div>
          <div className="text-xl font-black text-[#1e293b]">
            {currentStreak} <span className="text-xs font-semibold text-foreground/50">days</span>
          </div>
          <div className="text-[10px] text-foreground/40 mt-0.5 font-medium truncate">
            Best: {maxStreak} days
          </div>
        </div>

        {/* Days Completed */}
        <div className="p-3.5 rounded-xl border border-black/5 bg-[#f8fafc] shadow-2xs">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Itinerary</span>
          </div>
          <div className="text-xl font-black text-[#1e293b]">
            {totalCompletedDays} <span className="text-xs font-semibold text-foreground/50">/ {resolvedDays.length}</span>
          </div>
          <div className="text-[10px] text-foreground/40 mt-0.5 font-medium truncate">
            {Math.round((totalCompletedDays / (resolvedDays.length || 1)) * 100)}% done
          </div>
        </div>

        {/* Effort Logged */}
        <div className="p-3.5 rounded-xl border border-black/5 bg-[#f8fafc] shadow-2xs">
          <div className="flex items-center gap-1.5 text-sky-600 mb-1">
            <Clock className="w-4 h-4 text-sky-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Hours</span>
          </div>
          <div className="text-xl font-black text-[#1e293b]">
            {hoursLogged} <span className="text-xs font-semibold text-foreground/50">hrs</span>
          </div>
          <div className="text-[10px] text-foreground/40 mt-0.5 font-medium truncate">
            {tier === 'light' ? 'Light Tier' : 'Intensive Tier'}
          </div>
        </div>

        {/* Band Status */}
        <div className="p-3.5 rounded-xl border border-black/5 bg-[#f8fafc] shadow-2xs">
          <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
            <Award className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Band</span>
          </div>
          <div className="text-base font-black text-[#1e293b] capitalize truncate">
            {band}
          </div>
          <div className="text-[10px] text-foreground/40 mt-0.5 font-medium truncate">
            Re-score Wk 8
          </div>
        </div>
      </div>

      {/* 6-Axis Diagnostic Trajectory */}
      <div className="p-4 rounded-xl border border-black/5 bg-[#f8fafc]/70 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1e293b]">6-Axis Diagnostics</h4>
            <p className="text-[11px] text-foreground/60 leading-tight">
              Focus on lowest two axes.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary shrink-0">
            {diagnostic ? Object.values(diagnostic).reduce((a, b) => a + b, 0) : 18}/30
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {diagnostic &&
            Object.entries(diagnostic).map(([axisKey, score]) => (
              <div key={axisKey} className="p-2 rounded-lg border border-black/5 bg-white space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#334155] truncate pr-1">{AXIS_NAMES[axisKey] || axisKey}</span>
                  <span className="font-black text-primary shrink-0">{score}/5</span>
                </div>
                {/* Visual Bar */}
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Error Ledger Analytics */}
      <div className="p-4 rounded-xl border border-black/5 bg-[#f8fafc]/70 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1e293b]">Error Buckets</h4>
            <p className="text-[11px] text-foreground/60 leading-tight">
              4 outline error categories.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-foreground/60 shrink-0">
            {errorBuckets.total} total
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Concept */}
          <div className="p-2.5 rounded-lg border border-black/5 bg-white space-y-0.5">
            <div className="text-[10px] font-bold text-foreground/50 uppercase">Concept</div>
            <div className="text-base font-black text-[#1e293b]">{errorBuckets.counts.concept}</div>
            <div className="text-[10px] text-foreground/40">{errorBuckets.percentages.concept}%</div>
          </div>

          {/* Time */}
          <div className="p-2.5 rounded-lg border border-black/5 bg-white space-y-0.5">
            <div className="text-[10px] font-bold text-foreground/50 uppercase">Time & Speed</div>
            <div className="text-base font-black text-[#1e293b]">{errorBuckets.counts.time}</div>
            <div className="text-[10px] text-foreground/40">{errorBuckets.percentages.time}%</div>
          </div>

          {/* Clarity */}
          <div className="p-2.5 rounded-lg border border-black/5 bg-white space-y-0.5">
            <div className="text-[10px] font-bold text-foreground/50 uppercase">Clarity</div>
            <div className="text-base font-black text-[#1e293b]">{errorBuckets.counts.clarity}</div>
            <div className="text-[10px] text-foreground/40">{errorBuckets.percentages.clarity}%</div>
          </div>

          {/* Care */}
          <div className="p-2.5 rounded-lg border border-black/5 bg-white space-y-0.5">
            <div className="text-[10px] font-bold text-foreground/50 uppercase">Care & Craft</div>
            <div className="text-base font-black text-[#1e293b]">{errorBuckets.counts.care}</div>
            <div className="text-[10px] text-foreground/40">{errorBuckets.percentages.care}%</div>
          </div>
        </div>

        {/* Simulation Test History */}
        {simLogs.length > 0 && (
          <div className="pt-2.5 border-t border-black/5">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1.5">
              Recent Full Simulations
            </h5>
            <div className="divide-y divide-black/5">
              {simLogs.slice(0, 4).map(sim => (
                <div key={sim.id} className="py-1.5 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-[#1e293b] truncate block">{sim.paper_code || 'Simulation'}</span>
                    <span className="text-[10px] text-foreground/40">Week {sim.week}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-foreground/60">{sim.minutes_taken || 180}m</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700">
                      {sim.score_raw ?? 'Logged'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
