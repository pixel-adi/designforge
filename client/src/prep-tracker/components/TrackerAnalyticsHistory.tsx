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
    async function loadData() {
      if (!candidateId) return;
      try {
        const [diag, errors, sims] = await Promise.all([
          prepApi.getDiagnostics(candidateId),
          prepApi.getErrorLedger(candidateId),
          prepApi.getSimulations(candidateId),
        ]);
        setDiagnosticsList(diag || []);
        setErrorLedger(errors || []);
        setSimLogs(sims || []);
      } catch (e) {
        console.error('Failed to load tracking analytics:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-4 rounded-2xl border border-black/10 bg-white shadow-xs">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Current Streak</span>
          </div>
          <div className="text-2xl font-black text-[#1e293b]">
            {currentStreak} <span className="text-xs font-semibold text-foreground/50">days</span>
          </div>
          <div className="text-[11px] text-foreground/40 mt-1 font-medium">
            Best streak: {maxStreak} days
          </div>
        </div>

        {/* Days Completed */}
        <div className="p-4 rounded-2xl border border-black/10 bg-white shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Completed Days</span>
          </div>
          <div className="text-2xl font-black text-[#1e293b]">
            {totalCompletedDays} <span className="text-xs font-semibold text-foreground/50">/ {resolvedDays.length}</span>
          </div>
          <div className="text-[11px] text-foreground/40 mt-1 font-medium">
            {Math.round((totalCompletedDays / (resolvedDays.length || 1)) * 100)}% itinerary done
          </div>
        </div>

        {/* Effort Logged */}
        <div className="p-4 rounded-2xl border border-black/10 bg-white shadow-xs">
          <div className="flex items-center gap-2 text-sky-600 mb-1">
            <Clock className="w-5 h-5 text-sky-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Effort Logged</span>
          </div>
          <div className="text-2xl font-black text-[#1e293b]">
            {hoursLogged} <span className="text-xs font-semibold text-foreground/50">hrs</span>
          </div>
          <div className="text-[11px] text-foreground/40 mt-1 font-medium">
            Tier: {tier === 'light' ? 'Light (12-15h/wk)' : 'Intensive (18-22h/wk)'}
          </div>
        </div>

        {/* Band Status */}
        <div className="p-4 rounded-2xl border border-black/10 bg-white shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Award className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Operating Band</span>
          </div>
          <div className="text-xl font-black text-[#1e293b] capitalize">
            {band}
          </div>
          <div className="text-[11px] text-foreground/40 mt-1 font-medium">
            Re-score in Week 8
          </div>
        </div>
      </div>

      {/* 6-Axis Diagnostic Trajectory */}
      <div className="p-5 rounded-2xl border border-black/10 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#1e293b]">6-Axis Diagnostic Scores</h4>
            <p className="text-xs text-foreground/60">
              Scored 1 to 5 per axis. Weakest two axes receive prioritized drills.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
            Total: {diagnostic ? Object.values(diagnostic).reduce((a, b) => a + b, 0) : 18} / 30
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {diagnostic &&
            Object.entries(diagnostic).map(([axisKey, score]) => (
              <div key={axisKey} className="p-3 rounded-xl border border-black/5 bg-[#f8fafc] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#334155]">{AXIS_NAMES[axisKey] || axisKey}</span>
                  <span className="font-bold text-primary">{score} / 5</span>
                </div>
                {/* Visual Bar */}
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
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
      <div className="p-5 rounded-2xl border border-black/10 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#1e293b]">Simulation Error Distribution</h4>
            <p className="text-xs text-foreground/60">
              Errors logged across full mock simulations categorized into the 4 method buckets.
            </p>
          </div>
          <span className="text-xs font-semibold text-foreground/60">
            {errorBuckets.total} total errors recorded
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Concept */}
          <div className="p-3 rounded-xl border border-black/5 bg-[#f8fafc] space-y-1">
            <div className="text-[11px] font-bold text-foreground/50 uppercase">Concept</div>
            <div className="text-lg font-black text-[#1e293b]">{errorBuckets.counts.concept}</div>
            <div className="text-[10px] text-foreground/40">{errorBuckets.percentages.concept}% of errors</div>
          </div>

          {/* Time */}
          <div className="p-3 rounded-xl border border-black/5 bg-[#f8fafc] space-y-1">
            <div className="text-[11px] font-bold text-foreground/50 uppercase">Time & Speed</div>
            <div className="text-lg font-black text-[#1e293b]">{errorBuckets.counts.time}</div>
            <div className="text-[10px] text-foreground/40">{errorBuckets.percentages.time}% of errors</div>
          </div>

          {/* Clarity */}
          <div className="p-3 rounded-xl border border-black/5 bg-[#f8fafc] space-y-1">
            <div className="text-[11px] font-bold text-foreground/50 uppercase">Clarity & Brief</div>
            <div className="text-lg font-black text-[#1e293b]">{errorBuckets.counts.clarity}</div>
            <div className="text-[10px] text-foreground/40">{errorBuckets.percentages.clarity}% of errors</div>
          </div>

          {/* Care */}
          <div className="p-3 rounded-xl border border-black/5 bg-[#f8fafc] space-y-1">
            <div className="text-[11px] font-bold text-foreground/50 uppercase">Care & Craft</div>
            <div className="text-lg font-black text-[#1e293b]">{errorBuckets.counts.care}</div>
            <div className="text-[10px] text-foreground/40">{errorBuckets.percentages.care}% of errors</div>
          </div>
        </div>

        {/* Simulation Test History */}
        {simLogs.length > 0 && (
          <div className="pt-3 border-t border-black/5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">
              Recent Full Simulations
            </h5>
            <div className="divide-y divide-black/5">
              {simLogs.slice(0, 5).map(sim => (
                <div key={sim.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#1e293b]">{sim.paper_code || 'Simulation'}</span>
                    <span className="text-foreground/40 ml-2">Week {sim.week}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground/60">{sim.minutes_taken || 180} mins</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-green-50 text-green-700">
                      Score: {sim.score_raw ?? 'Logged'}
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
