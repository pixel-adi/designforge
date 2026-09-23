import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePrepTracker } from '../usePrepTracker';
import { ResolvedTask } from '../types';
import { TodayDayView } from './TodayDayView';
import { Board92Day } from './Board92Day';
import { OnboardingModal } from './OnboardingModal';
import { MilestoneClassNotesModal } from './MilestoneClassNotesModal';
import { SimulationLogModal } from './SimulationLogModal';
import { ErrorLedgerModal } from './ErrorLedgerModal';
import { CritiqueModal } from './CritiqueModal';
import { SundayReviewModal } from './SundayReviewModal';
import {
  DiaryModal,
  ExplanationCardModal,
  AwarenessCardModal,
  PitchLogModal,
} from './DiaryAndArtifactsModals';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CalendarDayStrip } from './CalendarDayStrip';
import { TrackerAnalyticsHistory } from './TrackerAnalyticsHistory';
import { PortalWeeklyUpdatesModal, WeeklyUpdatesTriggerButton } from './PortalWeeklyUpdatesModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Calendar,
  Layers,
  FileCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
  BookOpen,
  Lock,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
  BarChart3,
  SlidersHorizontal,
  Award,
  Trophy,
} from 'lucide-react';

interface PortalPrepTrackerSectionProps {
  candidate: any;
  onSolvePortalMock?: () => void;
}

const EXAM_DATES: Record<string, string> = {
  'nid-ug-2027': '2026-12-20',
  'nid-pg-2027': '2026-12-20',
  'uceed-2027': '2027-01-17',
  'ceed-2027': '2027-01-17',
  'nift-ug-2027': '2027-02-07',
  'nift-pg-2027': '2027-02-07',
  'nift-2027': '2027-02-07',
};

export function PortalPrepTrackerSection({ candidate, onSolvePortalMock }: PortalPrepTrackerSectionProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const effectiveCandidateId = candidate?.id || null;

  // Material upgrade & Notes access calculation:
  // Anyone with a material upgrade (materials_only / focus_batch / has_materials_access) automatically gets notes access
  const hasMaterialAccess =
    candidate?.access_level === 'materials_only' ||
    candidate?.access_level === 'focus_batch' ||
    Boolean(candidate?.has_materials_access);
  const hasNotesAccess = Boolean(enrolment?.has_notes_access || hasMaterialAccess);

  // View state for right-hand side performance unit
  const [sideUnitTab, setSideUnitTab] = useState<'ledger' | 'analytics'>('ledger');
  const [showRoadmapModal, setShowRoadmapModal] = useState<boolean>(false);
  const [showWeeklyUpdatesModal, setShowWeeklyUpdatesModal] = useState<boolean>(false);

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showClassNotes, setShowClassNotes] = useState(false);
  const [activeMilestoneTitle, setActiveMilestoneTitle] = useState('Design Milestone');
  const [showSimModal, setShowSimModal] = useState(false);
  const [activeSimTask, setActiveSimTask] = useState<{ id: string; title: string }>({
    id: '',
    title: '',
  });
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showCritiqueModal, setShowCritiqueModal] = useState(false);
  const [activeCritiqueTask, setActiveCritiqueTask] = useState<{ id: string; title: string }>({
    id: '',
    title: '',
  });
  const [showSundayModal, setShowSundayModal] = useState(false);
  const [activeSundayWeek, setActiveSundayWeek] = useState(0);

  // Capture Modals
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showAwarenessModal, setShowAwarenessModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [activeCaptureTaskId, setActiveCaptureTaskId] = useState<string | undefined>(undefined);

  const {
    loading: trackerLoading,
    enrolment,
    profile,
    rawPlan,
    resolvedDays,
    currentDay,
    selectedDayNum,
    setSelectedDayNum,
    stats,
    togglingTaskId,
    toggleTask,
    completeOnboarding,
    refreshData,
    activeExamId,
    setActiveExamId,
    allExamPlans,
    availableExamIds,
  } = usePrepTracker(effectiveCandidateId);

  // Pre-configured exam catalogue for dropdown selector
  const baseExamOptions = [
    { id: 'nid-ug-2027', label: 'NID DAT (UG: B.Des & Int. M.Des)', code: 'NID UG', track: 'ug' },
    { id: 'nid-pg-2027', label: 'NID DAT (PG: M.Des Disciplines)', code: 'NID PG', track: 'pg' },
    { id: 'uceed-2027', label: 'UCEED 2027 (IIT Bombay B.Des)', code: 'UCEED', track: 'ug' },
    { id: 'ceed-2027', label: 'CEED 2027 (IITs M.Des)', code: 'CEED', track: 'pg' },
    { id: 'nift-ug-2027', label: 'NIFT 2027 (Bachelor of Design)', code: 'NIFT UG', track: 'ug' },
    { id: 'nift-pg-2027', label: 'NIFT 2027 (Master of Design)', code: 'NIFT PG', track: 'pg' },
  ];

  const allExamOptions = useMemo(() => {
    const list = [...baseExamOptions];
    for (const p of allExamPlans || []) {
      const targetId = p.id === 'nift-2027' ? 'nift-ug-2027' : p.id;
      if (!list.some(e => e.id === targetId)) {
        list.push({
          id: targetId,
          label: p.title?.split(':')[1]?.trim() || p.title || targetId,
          code: p.exam_code || 'EXAM',
          track: p.track || 'ug',
        });
      }
    }
    return list;
  }, [allExamPlans]);

  // Current active exam info
  const currentExam = useMemo(() => {
    return allExamOptions.find(e => e.id === activeExamId) || {
      id: activeExamId,
      label: (rawPlan as any)?.title || 'Exam Tracker 2027',
      code: 'EXAM',
      track: 'ug',
    };
  }, [allExamOptions, activeExamId, rawPlan]);

  // Dynamic days until exam countdown calculation
  const targetExamDateStr = rawPlan?.examDate || rawPlan?.exam_date || EXAM_DATES[activeExamId] || '2026-12-20';
  const daysUntilExam = useMemo(() => {
    if (!targetExamDateStr) return null;
    const examTime = new Date(targetExamDateStr + 'T00:00:00').getTime();
    const today = new Date().getTime();
    const diff = Math.ceil((examTime - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [targetExamDateStr]);

  // Trigger onboarding if no enrolment exists once loading finishes
  useEffect(() => {
    if (!trackerLoading && !enrolment && candidate) {
      setShowOnboarding(true);
    }
  }, [trackerLoading, enrolment, candidate]);

  if (trackerLoading && !rawPlan) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs font-bold text-foreground/60">
            Calibrating your 92-day preparation plan...
          </p>
        </div>
      </div>
    );
  }

  // Handle capture modal opens from task actions
  const handleOpenCapture = (captureType: string, task: ResolvedTask) => {
    setActiveCaptureTaskId(task.id);
    if (captureType === 'diaryEntry') {
      setShowDiaryModal(true);
    } else if (captureType === 'simulationLog') {
      setActiveSimTask({ id: task.id, title: task.title });
      setShowSimModal(true);
    } else if (captureType === 'reviewSubmission') {
      setActiveCritiqueTask({ id: task.id, title: task.title });
      setShowCritiqueModal(true);
    } else if (captureType === 'sundayReview') {
      setActiveSundayWeek(currentDay?.week || 0);
      setShowSundayModal(true);
    } else if (captureType === 'explanationCard') {
      setShowExplanationModal(true);
    } else if (captureType === 'awarenessCard') {
      setShowAwarenessModal(true);
    } else if (captureType === 'pitch') {
      setShowPitchModal(true);
    }
  };

  const handleOpenNotes = (milestoneTitle: string) => {
    setActiveMilestoneTitle(milestoneTitle);
    if (!hasNotesAccess) {
      toast({
        title: 'Class Notes — Coming Soon',
        description:
          'Milestone class notes are currently being curated. Anyone with a Study Materials upgrade or Focus Batch automatically gets full access!',
      });
    }
    setShowClassNotes(true);
  };

  const drillDoneThisWeek = resolvedDays
    .filter(d => d.week === (currentDay?.week || 0))
    .filter(d => Array.isArray(d.tasks) && d.tasks.some(t => t.block === 'drill' && t.completed)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full min-w-0">
      {/* 1. Integrated Header Controls Bar (Aligned seamlessly with the header line) */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3.5 pb-2">
        {/* Left: Exam Selector Dropdown & Day/Phase Counter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exam Selector Dropdown */}
          <Select value={activeExamId} onValueChange={setActiveExamId}>
            <SelectTrigger className="w-auto min-w-[240px] sm:min-w-[280px] h-9 rounded-xl bg-white border border-black/15 shadow-2xs font-extrabold text-xs text-[#1e293b] gap-2 px-3">
              <SelectValue placeholder="Select Exam Tracker..." />
            </SelectTrigger>
            <SelectContent className="bg-white border-black/10 shadow-lg min-w-[360px] sm:min-w-[420px] max-w-[90vw]">
              <div className="px-2 py-1.5 text-[10px] font-black uppercase text-foreground/40 tracking-wider border-b border-black/5 mb-1">
                Select Target Exam
              </div>
              {allExamOptions.map(exam => (
                <SelectItem key={exam.id} value={exam.id} className="py-2 px-2 cursor-pointer focus:bg-slate-100">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 whitespace-nowrap min-w-[62px] text-center ${exam.track === 'pg' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {exam.code}
                    </span>
                    <span className="font-bold text-xs text-[#1e293b] whitespace-nowrap">{exam.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Day / Week / Phase Progress Badge */}
          <div className="flex items-center gap-2 text-xs bg-slate-100/80 border border-slate-200/60 px-3 py-1.5 rounded-xl">
            <span className="font-extrabold text-[#1e293b]">
              Day {currentDay?.day || 1} of {resolvedDays.length || 92}
            </span>
            <span className="text-foreground/40 hidden sm:inline">·</span>
            <span className="font-bold text-foreground/70 hidden sm:inline">
              Week {currentDay?.week || 0}
            </span>
            {currentDay?.phaseName && (
              <>
                <span className="text-foreground/40 hidden md:inline">·</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary hidden md:inline">
                  {currentDay.phaseName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Dynamic Countdown Pill & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {/* Dynamic Countdown Counter */}
          {daysUntilExam !== null && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{daysUntilExam} Days to {currentExam.code || 'Exam'}</span>
            </div>
          )}

          {/* Weekly Updates Trigger Button */}
          <WeeklyUpdatesTriggerButton onClick={() => setShowWeeklyUpdatesModal(true)} />

          {/* Unified Adjust Exam Plan Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnboarding(true)}
            className="h-9 gap-1.5 text-xs font-bold border-black/15 bg-white hover:bg-black/5 text-[#262626] shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-foreground/60" />
            <span>Adjust Plan</span>
          </Button>

          {/* Class Notes Button */}
          <Button
            size="sm"
            onClick={() => handleOpenNotes('Class Notes')}
            className={`h-9 gap-1.5 text-xs font-bold shadow-2xs ${
              hasNotesAccess
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#262626] hover:bg-black text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Class Notes</span>
          </Button>
        </div>
      </div>

      {/* 2. Streamlined Curriculum Progress & Non-Negotiables Surface */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Progress Bar Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1e293b]">
              Curriculum Progress: <span className="text-primary font-black">{stats.percentage}%</span>
            </span>
            <span className="text-foreground/50 text-[11px] font-medium">
              {stats.completedCountedTasks} of {stats.totalCountedTasks} counted tasks completed · {Math.round(stats.totalMinutesLogged / 60)} hrs logged
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, stats.percentage))}%` }}
            />
          </div>
        </div>

        {/* The 4 Non-Negotiables & Diagnostic Band Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-black/5">
          {/* 1. Daily Drill */}
          <div className="p-2.5 rounded-xl border border-black/5 bg-[#f8fafc] flex items-center justify-between hover:bg-[#f1f5f9] transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/40 block">1. Daily Drill</span>
              <p className="text-xs font-black text-[#1e293b]">{drillDoneThisWeek}/6 Completed</p>
              <span className="text-[9px] text-foreground/50">45m Mon–Sat</span>
            </div>
            <Flame className={`w-4 h-4 shrink-0 ${drillDoneThisWeek >= 4 ? 'text-primary' : 'text-foreground/30'}`} />
          </div>

          {/* 2. Weekly Critique */}
          <div className="p-2.5 rounded-xl border border-black/5 bg-[#f8fafc] flex items-center justify-between hover:bg-[#f1f5f9] transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/40 block">2. Critique</span>
              <p className="text-xs font-black text-[#1e293b]">Every Thursday</p>
              <span className="text-[9px] text-foreground/50">Peer & Mentor review</span>
            </div>
            <Compass className="w-4 h-4 shrink-0 text-amber-500" />
          </div>

          {/* 3. Saturday Mock */}
          <div className="p-2.5 rounded-xl border border-black/5 bg-[#f8fafc] flex items-center justify-between hover:bg-[#f1f5f9] transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/40 block">3. Saturday Mock</span>
              <p className="text-xs font-black text-[#1e293b]">Full Simulation</p>
              <span className="text-[9px] text-foreground/50">3h paper + 45m review</span>
            </div>
            <Clock className="w-4 h-4 shrink-0 text-red-500" />
          </div>

          {/* 4. Sunday Review */}
          <div className="p-2.5 rounded-xl border border-black/5 bg-[#f8fafc] flex items-center justify-between hover:bg-[#f1f5f9] transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/40 block">4. Sunday Review</span>
              <p className="text-xs font-black text-[#1e293b]">Rest & Reflection</p>
              <span className="text-[9px] text-foreground/50">Weekly audit</span>
            </div>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          </div>

          {/* Diagnostic Band */}
          <div className="p-2.5 rounded-xl border border-black/5 bg-[#f8fafc] flex items-center justify-between col-span-2 sm:col-span-1 hover:bg-[#f1f5f9] transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/40 block">Diagnostic Band</span>
              <p className="text-xs font-black capitalize text-[#1e293b]">{profile?.band || 'Calibrating'}</p>
              <span className="text-[9px] text-foreground/50">{profile ? `${profile.total}/30 Score` : 'Week 0 baseline'}</span>
            </div>
            <Award className="w-4 h-4 shrink-0 text-purple-600" />
          </div>
        </div>
      </div>

      {/* 3. Lower Dashboard: Workout Unit (Left) + Performance & Error Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Col-Span 7): Calendar Day Strip & Today's Tasks in ONE Unit */}
        <div className="lg:col-span-7 space-y-4 min-w-0 max-w-full">
          <CalendarDayStrip
            days={resolvedDays}
            selectedDayNum={selectedDayNum}
            onSelectDay={dayNum => setSelectedDayNum(dayNum)}
            examTitle={currentExam.label}
            examDate={targetExamDateStr}
            onOpenRoadmap={() => setShowRoadmapModal(true)}
          />

          {currentDay && (
            <TodayDayView
              day={currentDay}
              totalDays={resolvedDays.length || 92}
              onSelectDay={dayNum => setSelectedDayNum(dayNum)}
              onToggleTask={(taskId, minutes) => toggleTask(taskId, minutes)}
              togglingTaskId={togglingTaskId}
              onOpenNotes={handleOpenNotes}
              onOpenCapture={handleOpenCapture}
              onSolvePortalMock={onSolvePortalMock || (() => setLocation('/portal/dashboard'))}
              hasNotesAccess={hasNotesAccess}
            />
          )}
        </div>

        {/* Right Column (Col-Span 5): Error Ledger & History / Analytics in ONE Unit */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-black/10 p-5 sm:p-6 shadow-xs space-y-5 min-w-0 max-w-full overflow-hidden">
          {/* Tab Switcher Header */}
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f8fafc] border border-black/5">
              <button
                type="button"
                onClick={() => setSideUnitTab('ledger')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  sideUnitTab === 'ledger'
                    ? 'bg-[#1e293b] text-white shadow-2xs'
                    : 'text-foreground/60 hover:text-foreground hover:bg-black/5'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Error Ledger</span>
              </button>

              <button
                type="button"
                onClick={() => setSideUnitTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  sideUnitTab === 'analytics'
                    ? 'bg-[#1e293b] text-white shadow-2xs'
                    : 'text-foreground/60 hover:text-foreground hover:bg-black/5'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span>Analytics</span>
              </button>
            </div>

            {sideUnitTab === 'ledger' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLedgerModal(true)}
                className="h-8 gap-1 text-xs font-bold border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Log Mistake</span>
              </Button>
            )}
          </div>

          {/* Sub-view 1: Error Ledger */}
          {sideUnitTab === 'ledger' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-black text-[#1e293b]">4-Bucket Error Classification</h3>
                <p className="text-[11px] text-foreground/50">
                  Categorize simulation errors into root causes to prevent repeat mistakes in the exam.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { name: 'Concept', color: 'border-blue-200 bg-blue-50/60 text-blue-900', desc: 'Brief misunderstanding or missed question clause' },
                  { name: 'Time', color: 'border-amber-200 bg-amber-50/60 text-amber-900', desc: 'Pacing collapse, late start or over-rendering' },
                  { name: 'Clarity', color: 'border-purple-200 bg-purple-50/60 text-purple-900', desc: 'Illegible callouts or weak visual layout' },
                  { name: 'Care', color: 'border-rose-200 bg-rose-50/60 text-rose-900', desc: 'Smudges, unfinished sheets, or sloppy execution' },
                ].map(b => (
                  <div key={b.name} className={`p-3 rounded-xl border ${b.color} space-y-1`}>
                    <span className="text-xs font-black block">{b.name}</span>
                    <p className="text-[10px] opacity-75 leading-snug">{b.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-black/5 space-y-2">
                <span className="text-xs font-black text-[#1e293b] block">Simulation Error Audits</span>
                <p className="text-xs text-foreground/50 italic">
                  Complete Saturday full simulations and run the same-day 45-minute review protocol to log mistakes.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowLedgerModal(true)}
                  className="w-full bg-[#1e293b] hover:bg-black text-white text-xs font-bold gap-1.5 h-8 mt-1"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Open Full Mistake Ledger</span>
                </Button>
              </div>
            </div>
          )}

          {/* Sub-view 2: History & Analytics */}
          {sideUnitTab === 'analytics' && (
            <div className="animate-in fade-in duration-200">
              <TrackerAnalyticsHistory
                candidateId={effectiveCandidateId || ''}
                resolvedDays={resolvedDays}
                tier={enrolment?.tier || 'intensive'}
                band={profile?.band}
                diagnostic={profile?.diagnostic}
              />
            </div>
          )}
        </div>
      </div>

      {/* 92-Day Full Roadmap Modal */}
      <Dialog open={showRoadmapModal} onOpenChange={setShowRoadmapModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                {currentExam.code || 'EXAM'}
              </span>
              <span className="text-xs font-bold text-foreground/50">Full 92-Day Operating Matrix</span>
            </div>
            <DialogTitle className="text-xl">
              {currentExam.label} Curriculum Roadmap
            </DialogTitle>
            <DialogDescription>
              Click any day to jump directly to its workout tasks and exercises.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Board92Day
              days={resolvedDays}
              selectedDayNum={selectedDayNum}
              onSelectDay={dayNum => {
                setSelectedDayNum(dayNum);
                setShowRoadmapModal(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals Container */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={completeOnboarding}
      />

      <MilestoneClassNotesModal
        open={showClassNotes}
        onOpenChange={setShowClassNotes}
        candidateId={effectiveCandidateId}
        candidateName={candidate?.name || 'Aspirant'}
        candidateEmail={candidate?.email || 'aspirant@designforge.co.in'}
        hasAccess={hasNotesAccess}
        milestoneTitle={activeMilestoneTitle}
        examCode={currentExam.code || 'NID'}
        onAccessUnlocked={() => {
          refreshData();
        }}
      />

      <SimulationLogModal
        open={showSimModal}
        onOpenChange={setShowSimModal}
        candidateId={effectiveCandidateId}
        taskId={activeSimTask.id}
        taskTitle={activeSimTask.title}
        track={profile?.track || 'ug'}
        onSaved={() => {
          refreshData();
        }}
      />

      <ErrorLedgerModal
        open={showLedgerModal}
        onOpenChange={setShowLedgerModal}
        candidateId={effectiveCandidateId}
      />

      <CritiqueModal
        open={showCritiqueModal}
        onOpenChange={setShowCritiqueModal}
        candidateId={effectiveCandidateId}
        taskId={activeCritiqueTask.id}
        taskTitle={activeCritiqueTask.title}
        onSubmitted={() => {
          refreshData();
        }}
      />

      <SundayReviewModal
        open={showSundayModal}
        onOpenChange={setShowSundayModal}
        candidateId={effectiveCandidateId}
        week={activeSundayWeek}
        onSaved={() => {
          refreshData();
        }}
      />

      <DiaryModal
        open={showDiaryModal}
        onOpenChange={setShowDiaryModal}
        candidateId={effectiveCandidateId}
        dayNum={selectedDayNum}
        taskId={activeCaptureTaskId}
        diaryTheme={currentDay?.diaryTheme}
        onSaved={() => {
          refreshData();
        }}
      />

      <ExplanationCardModal
        open={showExplanationModal}
        onOpenChange={setShowExplanationModal}
        candidateId={effectiveCandidateId}
        dayNum={selectedDayNum}
        taskId={activeCaptureTaskId}
        onSaved={() => {
          refreshData();
        }}
      />

      <AwarenessCardModal
        open={showAwarenessModal}
        onOpenChange={setShowAwarenessModal}
        candidateId={effectiveCandidateId}
        dayNum={selectedDayNum}
        taskId={activeCaptureTaskId}
        onSaved={() => {
          refreshData();
        }}
      />

      <PitchLogModal
        open={showPitchModal}
        onOpenChange={setShowPitchModal}
        candidateId={effectiveCandidateId}
        dayNum={selectedDayNum}
        taskId={activeCaptureTaskId}
        onSaved={() => {
          refreshData();
        }}
      />

      {/* Weekly Feature Additions & Changelog Modal */}
      <PortalWeeklyUpdatesModal
        open={showWeeklyUpdatesModal}
        onOpenChange={setShowWeeklyUpdatesModal}
      />
    </div>
  );
}
