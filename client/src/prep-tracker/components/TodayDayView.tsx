import { useState } from 'react';
import { ResolvedDay, ResolvedTask } from '../types';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Calendar,
  PenTool,
  ExternalLink,
  Flame,
  FileCheck,
  Camera,
  Mic,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface TodayDayViewProps {
  day: ResolvedDay;
  totalDays: number;
  onSelectDay: (dayNum: number) => void;
  onToggleTask: (taskId: string, minutes: number) => void;
  togglingTaskId: string | null;
  onOpenNotes: (milestoneTitle: string) => void;
  onOpenCapture: (captureType: string, task: ResolvedTask) => void;
  onSolvePortalMock?: () => void;
  hasNotesAccess: boolean;
}

const BLOCK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  drill: { bg: 'bg-blue-50/70', text: 'text-blue-700', border: 'border-blue-200' },
  build: { bg: 'bg-purple-50/70', text: 'text-purple-700', border: 'border-purple-200' },
  critique: { bg: 'bg-amber-50/70', text: 'text-amber-700', border: 'border-amber-200' },
  simulation: { bg: 'bg-red-50/70', text: 'text-red-700', border: 'border-red-200' },
  simulation_review: { bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-200' },
  sunday_review: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200' },
  axis_block: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-200' },
  awareness_card: { bg: 'bg-teal-50/70', text: 'text-teal-700', border: 'border-teal-200' },
  diagnostic: { bg: 'bg-orange-50/70', text: 'text-orange-700', border: 'border-orange-200' },
};

export function TodayDayView({
  day,
  totalDays = 92,
  onSelectDay,
  onToggleTask,
  togglingTaskId,
  onOpenNotes,
  onOpenCapture,
  onSolvePortalMock,
  hasNotesAccess,
}: TodayDayViewProps) {
  // Format date: e.g. "Sat 19 Sep 2026"
  const formattedDate = new Date(day.date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Day Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-black/10 bg-white p-5 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#262626] text-white">
              Day {day.day} of {totalDays}
            </span>
            <span className="text-xs font-bold text-foreground/60">
              Week {day.week} · {day.weekday}
            </span>
            {day.isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Today
              </span>
            )}
            {day.isLocked && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 text-foreground/60 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked until {formattedDate}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-[#262626] mt-1.5">{day.title}</h2>
          <p className="text-xs text-foreground/60">{formattedDate}</p>
        </div>

        {/* Day Navigation & Action */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectDay(Math.max(1, day.day - 1))}
            disabled={day.day <= 1}
            className="h-9 px-2.5"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectDay(day.day)}
            className="h-9 text-xs font-bold"
          >
            Day {day.day}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectDay(Math.min(totalDays, day.day + 1))}
            disabled={day.day >= totalDays}
            className="h-9 px-2.5"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Milestone Class Notes Button */}
          <Button
            size="sm"
            onClick={() => onOpenNotes(day.title)}
            className={`h-9 gap-1.5 text-xs font-bold shadow-xs ${
              hasNotesAccess
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-black/5 hover:bg-black/10 text-[#262626] border border-black/10'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${hasNotesAccess ? 'text-white' : 'text-primary'}`} />
            <span>Class Notes</span>
          </Button>
        </div>
      </div>

      {/* Locked Notice (if in future) */}
      {day.isLocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3 text-xs text-amber-900">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold">This milestone unlocks on {formattedDate}</h4>
            <p className="text-amber-800/80">
              Tasks unlock day-by-day to maintain pace and avoid burnout. You can preview the tasks below, and tick them off once this day arrives in Asia/Kolkata.
            </p>
          </div>
        </div>
      )}

      {/* Day Tasks List */}
      <div className="space-y-4">
        {day.tasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-black/5">
            <p className="text-sm text-foreground/50">Rest day / No tasks scheduled for today.</p>
          </div>
        ) : (
          day.tasks.map((task, idx) => {
            const blockStyle = BLOCK_COLORS[task.block] || {
              bg: 'bg-black/5',
              text: 'text-foreground/70',
              border: 'border-black/10',
            };
            const isToggling = togglingTaskId === task.id;
            const isSimulation = task.block === 'simulation' || task.kind === 'simulation';

            return (
              <div
                key={task.id || idx}
                className={`group relative rounded-2xl border transition-all p-5 shadow-xs ${
                  task.completed
                    ? 'bg-green-50/40 border-green-200'
                    : 'bg-white border-black/10 hover:border-black/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Task Completion Toggle */}
                  <button
                    type="button"
                    disabled={isToggling || day.isLocked}
                    onClick={() => onToggleTask(task.id, task.minutes)}
                    className={`mt-0.5 shrink-0 rounded-full transition-all focus:outline-none ${
                      day.isLocked ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-foreground/30 hover:text-foreground/60" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${blockStyle.bg} ${blockStyle.text} ${blockStyle.border}`}
                      >
                        {task.block.replace('_', ' ')}
                      </span>

                      <span className="flex items-center gap-1 text-[11px] font-bold text-foreground/60">
                        <Clock className="w-3 h-3" /> {task.minutes} min
                      </span>

                      {task.optional && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-black/5 text-foreground/50">
                          Optional
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-base font-bold text-[#262626] ${
                        task.completed ? 'line-through text-foreground/50' : ''
                      }`}
                    >
                      {task.title}
                    </h3>

                    <p className="text-xs text-foreground/70 leading-relaxed max-w-3xl">
                      {task.detail}
                    </p>

                    {/* Task Action Buttons & Capture Forms */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {/* Solve Mock Exam on Portal (for Simulation tasks) */}
                      {isSimulation && onSolvePortalMock && (
                        <Button
                          size="sm"
                          onClick={onSolvePortalMock}
                          className="bg-primary hover:bg-primary/90 text-white font-bold h-8 text-xs gap-1.5 shadow-xs"
                        >
                          <Flame className="w-3.5 h-3.5" /> Solve Live Mock Exam on Portal
                        </Button>
                      )}

                      {/* Capture Form Openers */}
                      {task.capture &&
                        task.capture.map(c => (
                          <Button
                            key={c}
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenCapture(c, task)}
                            className="h-8 text-xs font-semibold gap-1.5 bg-white hover:bg-black/5"
                          >
                            {c === 'diaryEntry' && <PenTool className="w-3 h-3 text-primary" />}
                            {c === 'simulationLog' && <FileCheck className="w-3 h-3 text-red-600" />}
                            {c === 'reviewSubmission' && <MessageSquare className="w-3 h-3 text-amber-600" />}
                            {c === 'sundayReview' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {c === 'buildPhoto' && <Camera className="w-3 h-3 text-purple-600" />}
                            {(c === 'pitchRecording' || c === 'mockConversation') && (
                              <Mic className="w-3 h-3 text-indigo-600" />
                            )}
                            <span className="capitalize">
                              {c === 'diaryEntry'
                                ? 'Design Diary'
                                : c === 'simulationLog'
                                ? 'Log Simulation'
                                : c === 'reviewSubmission'
                                ? 'Critique'
                                : c === 'sundayReview'
                                ? 'Sunday Review'
                                : c.replace(/([A-Z])/g, ' $1')}
                            </span>
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
