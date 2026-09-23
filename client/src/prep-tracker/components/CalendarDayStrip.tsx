import React, { useState, useMemo } from 'react';
import { ResolvedDay } from '../types';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Flame, Award, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarDayStripProps {
  days: ResolvedDay[];
  selectedDayNum: number;
  onSelectDay: (dayNum: number) => void;
  examTitle?: string;
  examDate?: string;
  onOpenRoadmap?: () => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarDayStrip({
  days,
  selectedDayNum,
  onSelectDay,
  examTitle,
  examDate,
  onOpenRoadmap,
}: CalendarDayStripProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Index days by date string 'YYYY-MM-DD'
  const daysByDate = useMemo(() => {
    const map = new Map<string, ResolvedDay>();
    for (const d of days) {
      map.set(d.date, d);
    }
    return map;
  }, [days]);

  // Current selected day object
  const selectedDay = useMemo(() => {
    return days.find(d => d.day === selectedDayNum) || days[0];
  }, [days, selectedDayNum]);

  // Determine current active date (defaults to selected day's date or today)
  const activeDateObj = useMemo(() => {
    if (selectedDay?.date) {
      const parsed = new Date(selectedDay.date + 'T00:00:00');
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [selectedDay]);

  // Active month and year for calendar display
  const [viewYear, setViewYear] = useState<number>(() => activeDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => activeDateObj.getMonth()); // 0-indexed

  // Format header month year (e.g. "October 2026")
  const monthYearLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  // Current week days (Sunday to Saturday) containing the selected day
  const currentWeekDays = useMemo(() => {
    if (!selectedDay?.date) return [];
    const curr = new Date(selectedDay.date + 'T00:00:00');
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    
    // Start Sunday
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const week: Array<{
      dateStr: string;
      dayOfMonth: number;
      dayOfWeekIndex: number;
      resolvedDay?: ResolvedDay;
      isCurrentMonth: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      week.push({
        dateStr,
        dayOfMonth: d.getDate(),
        dayOfWeekIndex: i,
        resolvedDay: daysByDate.get(dateStr),
        isCurrentMonth: d.getMonth() === viewMonth,
      });
    }

    return week;
  }, [selectedDay, daysByDate, viewMonth]);

  // Full Month Matrix (for expanded view)
  const monthGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun

    const gridStart = new Date(firstDayOfMonth);
    gridStart.setDate(firstDayOfMonth.getDate() - startDayOfWeek);

    const grid: Array<{
      dateStr: string;
      dayOfMonth: number;
      isCurrentMonth: boolean;
      resolvedDay?: ResolvedDay;
    }> = [];

    // 5 weeks (35 days) or 6 weeks (42 days)
    for (let i = 0; i < 35; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      grid.push({
        dateStr,
        dayOfMonth: d.getDate(),
        isCurrentMonth: d.getMonth() === viewMonth,
        resolvedDay: daysByDate.get(dateStr),
      });
    }

    return grid;
  }, [viewYear, viewMonth, daysByDate]);

  // Navigate Week or Month
  const handlePrev = () => {
    if (isExpanded) {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    } else {
      // Move 7 days backward in tracker
      if (selectedDayNum > 7) {
        onSelectDay(selectedDayNum - 7);
      } else {
        onSelectDay(1);
      }
    }
  };

  const handleNext = () => {
    if (isExpanded) {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    } else {
      // Move 7 days forward
      const maxDay = days[days.length - 1]?.day || 92;
      if (selectedDayNum + 7 <= maxDay) {
        onSelectDay(selectedDayNum + 7);
      } else {
        onSelectDay(maxDay);
      }
    }
  };

  // Return / Reset to Current Day
  const handleResetToToday = () => {
    const todayDay = days.find(d => d.isToday);
    if (todayDay) {
      onSelectDay(todayDay.day);
      if (todayDay.date) {
        const parsed = new Date(todayDay.date + 'T00:00:00');
        if (!isNaN(parsed.getTime())) {
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
        }
      }
    } else if (days.length > 0) {
      onSelectDay(1);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-black/10 shadow-xs overflow-hidden transition-all duration-300 select-none">
      {/* Header Month & Navigation & Roadmap Button */}
      <div className="pt-3 pb-2.5 px-4 sm:px-6 flex items-center justify-between border-b border-black/5 bg-[#f8fafc]/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-black/5 transition-colors"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-[#1e293b] tracking-tight">
            {monthYearLabel}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-black/5 transition-colors"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetToToday}
            className="ml-1 px-2.5 py-1 text-[11px] font-black rounded-lg border border-black/10 bg-white hover:bg-black/5 text-[#1e293b] transition-all shadow-2xs hover:border-black/20"
            title="Reset calendar to Today"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {examTitle && (
            <span className="hidden md:inline text-[11px] text-foreground/50 font-semibold truncate max-w-[180px]">
              {examTitle}
            </span>
          )}

          {onOpenRoadmap && (
            <button
              type="button"
              onClick={onOpenRoadmap}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all flex items-center gap-1.5 shadow-2xs border border-primary/20"
              title="Open 92-Day Full Roadmap"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>92-Day Roadmap</span>
            </button>
          )}
        </div>
      </div>

      {/* Weekday labels row: S M T W T F S */}
      <div className="grid grid-cols-7 px-4 pt-1 pb-1 text-center">
        {WEEKDAYS.map((w, idx) => (
          <span
            key={idx}
            className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider"
          >
            {w}
          </span>
        ))}
      </div>

      {/* Main Strip (Reference Image layout) */}
      {!isExpanded ? (
        <div className="bg-[#f8fafc]/80 border-t border-b border-black/5 px-4 py-2.5">
          <div className="grid grid-cols-7 gap-1 text-center">
            {currentWeekDays.map(item => {
              const rDay = item.resolvedDay;
              const isSelected = rDay && selectedDayNum === rDay.day;
              const isDone = rDay && rDay.totalCount > 0 && rDay.completedCount >= rDay.totalCount;
              const isPartiallyDone = rDay && rDay.completedCount > 0 && !isDone;
              const hasSimulation = Boolean(rDay && Array.isArray(rDay.tasks) && rDay.tasks.some(t => t.kind === 'simulation'));

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  disabled={!rDay}
                  onClick={() => rDay && onSelectDay(rDay.day)}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 group ${
                    isSelected
                      ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
                      : rDay
                      ? 'hover:bg-black/5 text-[#334155]'
                      : 'opacity-30 cursor-not-allowed text-[#94a3b8]'
                  }`}
                >
                  {/* Day Number */}
                  <span
                    className={`text-sm ${
                      isSelected
                        ? 'font-bold text-[#0369a1]'
                        : rDay?.isToday
                        ? 'font-semibold text-primary'
                        : 'font-medium'
                    }`}
                  >
                    {item.dayOfMonth}
                  </span>

                  {/* Status Indicator Pill (Faithful to Reference Image) */}
                  <div className="h-1.5 w-full flex items-center justify-center mt-1">
                    {isDone ? (
                      <span className="w-3.5 h-1 rounded-full bg-[#84cc16] shadow-xs animate-in fade-in" />
                    ) : isSelected ? (
                      <span className="w-3.5 h-1 rounded-full bg-[#84cc16]" />
                    ) : isPartiallyDone ? (
                      <span className="w-3 h-1 rounded-full bg-slate-300" />
                    ) : rDay && rDay.isPast ? (
                      <span className="w-2.5 h-1 rounded-full bg-slate-300" />
                    ) : hasSimulation ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-transparent" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Expanded Month Calendar Grid */
        <div className="bg-[#f8fafc]/80 border-t border-b border-black/5 px-4 py-3">
          <div className="grid grid-cols-7 gap-1 text-center">
            {monthGridDays.map(item => {
              const rDay = item.resolvedDay;
              const isSelected = rDay && selectedDayNum === rDay.day;
              const isDone = rDay && rDay.totalCount > 0 && rDay.completedCount >= rDay.totalCount;
              const isPartiallyDone = rDay && rDay.completedCount > 0 && !isDone;

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  disabled={!rDay}
                  onClick={() => rDay && onSelectDay(rDay.day)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-[#e0f2fe] text-[#0369a1] font-bold ring-1 ring-sky-300'
                      : rDay
                      ? item.isCurrentMonth
                        ? 'hover:bg-black/5 text-[#334155]'
                        : 'text-foreground/30 hover:bg-black/5'
                      : 'opacity-25 cursor-not-allowed text-foreground/20'
                  }`}
                >
                  <span className="text-xs">{item.dayOfMonth}</span>
                  <div className="h-1 mt-0.5 flex items-center justify-center">
                    {isDone ? (
                      <span className="w-2 h-0.5 rounded-full bg-[#84cc16]" />
                    ) : isPartiallyDone ? (
                      <span className="w-2 h-0.5 rounded-full bg-slate-300" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Center Expander / Drag Handle (Reference Image pill handle) */}
      <div className="py-2 flex items-center justify-center bg-white">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex flex-col items-center justify-center px-4 py-1 gap-0.5 text-foreground/30 hover:text-foreground/70 transition-colors"
          title={isExpanded ? 'Collapse to week strip' : 'Expand full month view'}
        >
          <span className="w-8 h-1 rounded-full bg-black/15 group-hover:bg-black/30 transition-colors" />
          <span className="w-5 h-0.5 rounded-full bg-black/10 group-hover:bg-black/20 transition-colors" />
        </button>
      </div>
    </div>
  );
}
