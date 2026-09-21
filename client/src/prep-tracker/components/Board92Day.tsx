import { ResolvedDay } from '../types';
import { Lock, Sparkles, CheckCircle2, Flame, Award } from 'lucide-react';

interface Board92DayProps {
  days: ResolvedDay[];
  selectedDayNum: number;
  onSelectDay: (dayNum: number) => void;
}

export function Board92Day({ days, selectedDayNum, onSelectDay }: Board92DayProps) {
  // Group days by week (Week 0 to Week 13)
  const weeksMap: Record<number, ResolvedDay[]> = {};
  for (const d of days) {
    if (!weeksMap[d.week]) weeksMap[d.week] = [];
    weeksMap[d.week].push(d);
  }

  const weekNumbers = Object.keys(weeksMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#262626]">92-Day Progression Board</h3>
          <p className="text-xs text-foreground/60">
            From Orientation (Week 0) to Prelims Eve (Week 13). Milestones unlock daily in Asia/Kolkata.
          </p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-foreground/60">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Today
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-foreground/40" /> Locked
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {weekNumbers.map(weekNum => {
          const weekDays = weeksMap[weekNum] || [];
          const weekCompleted = weekDays.every(
            d => d.totalCount > 0 && d.completedCount >= d.totalCount
          );

          return (
            <div
              key={weekNum}
              className="p-4 rounded-2xl border border-black/10 bg-white shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#262626]">
                    Week {weekNum} {weekNum === 0 ? '(Orientation)' : weekNum === 13 ? '(Taper)' : ''}
                  </span>
                  {weekCompleted && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-foreground/50 font-medium">
                  {weekDays[0]?.date} to {weekDays[weekDays.length - 1]?.date}
                </span>
              </div>

              {/* Day Grid for Week */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {weekDays.map(d => {
                  const isSelected = selectedDayNum === d.day;
                  const isDone = d.totalCount > 0 && d.completedCount >= d.totalCount;
                  const isPartiallyDone = d.completedCount > 0 && !isDone;
                  const hasSimulation = Boolean(
                    Array.isArray(d.tasks) &&
                    d.tasks.some(t => t.block === 'simulation' || t.kind === 'simulation')
                  );
                  const hasMilestone = Boolean(
                    Array.isArray(d.tasks) &&
                    d.tasks.some(t => t.kind === 'milestone')
                  );

                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => onSelectDay(d.day)}
                      className={`relative flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'ring-2 ring-primary border-primary bg-primary/[0.03] shadow-xs'
                          : d.isToday
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : isDone
                          ? 'border-green-300 bg-green-50/50'
                          : d.isLocked
                          ? 'border-black/5 bg-black/[0.02] text-foreground/50'
                          : 'border-black/10 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-[#262626]">
                          D{d.day}
                        </span>

                        {d.isToday ? (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        ) : d.isLocked ? (
                          <Lock className="w-3 h-3 text-foreground/30 shrink-0" />
                        ) : null}
                      </div>

                      <span className="text-[10px] text-foreground/50 font-semibold line-clamp-1">
                        {d.weekday.slice(0, 3)} · {d.date.slice(5)}
                      </span>

                      {/* Markers */}
                      <div className="flex items-center gap-1 mt-2">
                        {hasSimulation && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700">
                            Mock
                          </span>
                        )}
                        {hasMilestone && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                            Key
                          </span>
                        )}
                      </div>

                      {/* Completion bar */}
                      <div className="w-full bg-black/5 rounded-full h-1 mt-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isDone ? 'bg-green-500' : 'bg-primary'
                          }`}
                          style={{
                            width: `${
                              d.totalCount > 0 ? (d.completedCount / d.totalCount) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
