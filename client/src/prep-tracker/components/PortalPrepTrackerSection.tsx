import { useState, useEffect } from 'react';
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
import { CalendarDayStrip } from './CalendarDayStrip';
import { TrackerAnalyticsHistory } from './TrackerAnalyticsHistory';
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
  Settings,
  Clock,
  Compass,
  BarChart3,
} from 'lucide-react';

interface PortalPrepTrackerSectionProps {
  candidate: any;
  onSolvePortalMock?: () => void;
}

export function PortalPrepTrackerSection({ candidate, onSolvePortalMock }: PortalPrepTrackerSectionProps) {
  const [, setLocation] = useLocation();
  const effectiveCandidateId = candidate?.id || null;

  const [activeTab, setActiveTab] = useState<'today' | 'board' | 'ledger' | 'analytics'>('today');

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showClassNotes, setShowClassNotes] = useState(false);
  const [activeMilestoneTitle, setActiveMilestoneTitle] = useState('NID Milestone');
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

  // Pre-configured exam catalogue for switchable tabs
  const examOptions = [
    { id: 'nid-ug-2027', label: 'NID DAT (UG)', code: 'NID' },
    { id: 'nid-pg-2027', label: 'NID DAT (PG)', code: 'NID' },
    { id: 'uceed-2027', label: 'UCEED 2027', code: 'UCEED' },
    { id: 'ceed-2027', label: 'CEED 2027', code: 'CEED' },
    { id: 'nift-2027', label: 'NIFT 2027', code: 'NIFT' },
  ];

  // Current active exam label
  const currentExam = examOptions.find(e => e.id === activeExamId) || {
    id: activeExamId,
    label: (rawPlan as any)?.title || 'Design Prep Tracker',
  };

  // Trigger onboarding if no enrolment exists once loading finishes
  useEffect(() => {
    if (!trackerLoading && !enrolment && candidate) {
      setShowOnboarding(true);
    }
  }, [trackerLoading, enrolment, candidate]);

  if (trackerLoading || !candidate?.id) {
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
    setShowClassNotes(true);
  };

  const drillDoneThisWeek = resolvedDays
    .filter(d => d.week === (currentDay?.week || 0))
    .filter(d => Array.isArray(d.tasks) && d.tasks.some(t => t.block === 'drill' && t.completed)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 0. Multi-Exam Switcher Pill Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-[#f8fafc] border border-black/10 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {examOptions.map(exam => {
            const isSelected = activeExamId === exam.id;
            return (
              <button
                key={exam.id}
                type="button"
                onClick={() => setActiveExamId(exam.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a] hover:bg-black/5'
                }`}
              >
                {exam.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          className="text-xs font-bold text-foreground/60 hover:text-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Select Exams</span>
        </button>
      </div>

      {/* 1. Calm Header Bar */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary text-white uppercase tracking-wider">
              {currentExam.code || 'DESIGN PREP'}
            </span>
            <span className="text-xs font-bold text-foreground/60">
              Day {currentDay?.day || 1} of {resolvedDays.length || 92} · Week {currentDay?.week || 1}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/5 text-foreground/70">
              Exam Target: 2027
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#262626] tracking-tight">
            {currentExam.label}
          </h2>

          <p className="text-xs text-foreground/60 max-w-xl">
            {currentDay?.title || 'Daily Discipline Routine'} · {stats.completedCountedTasks} of {stats.totalCountedTasks} counted tasks completed ({stats.percentage}% progress, {Math.round(stats.totalMinutesLogged / 60)} hrs logged).
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {profile && (
            <div className="px-3 py-1.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs">
              <span className="text-foreground/50 block text-[10px] font-semibold">Diagnostic Band</span>
              <span className="capitalize text-[#262626] font-black">
                {profile.band} ({profile.total}/30)
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnboarding(true)}
            className="h-9 gap-1.5 text-xs font-bold border-black/15 bg-white hover:bg-black/5 text-[#262626]"
          >
            <Settings className="w-3.5 h-3.5 text-foreground/60" />
            <span>Adjust Plan</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenNotes('NID DAT Class Notes')}
            className={`h-9 gap-1.5 text-xs font-bold shadow-xs ${
              enrolment?.has_notes_access
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {enrolment?.has_notes_access ? (
              <BookOpen className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>{enrolment?.has_notes_access ? 'Class Notes Unlocked' : 'Class Notes (₹500)'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Weekly Habits Bar (The 4 Non-Negotiables) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
              1. Daily Drill
            </span>
            <Flame className={`w-3.5 h-3.5 ${drillDoneThisWeek >= 4 ? 'text-primary' : 'text-foreground/30'}`} />
          </div>
          <p className="text-xs font-bold text-[#262626]">
            {drillDoneThisWeek}/6 Completed
          </p>
          <p className="text-[10px] text-foreground/50">45 min Mon–Sat</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
              2. Critique
            </span>
            <Compass className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xs font-bold text-[#262626]">
            Every Thursday
          </p>
          <p className="text-[10px] text-foreground/50">3 framing questions</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
              3. Saturday Mock
            </span>
            <Clock className="w-3.5 h-3.5 text-red-500" />
          </div>
          <p className="text-xs font-bold text-[#262626]">
            Full Simulation
          </p>
          <p className="text-[10px] text-foreground/50">45m review protocol</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
              4. Sunday Review
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-[#262626]">
            Rest + Reflection
          </p>
          <p className="text-[10px] text-foreground/50">3 reflections + checklist</p>
        </div>
      </div>

      {/* 3. Intuitive View Switcher */}
      <div className="flex items-center justify-between border-b border-black/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'today'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'bg-black/5 hover:bg-black/10 text-foreground/70'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today's Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'board'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'bg-black/5 hover:bg-black/10 text-foreground/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>92-Day Roadmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'bg-black/5 hover:bg-black/10 text-foreground/70'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Error Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'bg-black/5 hover:bg-black/10 text-foreground/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>History & Analytics</span>
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLedgerModal(true)}
          className="h-8 gap-1.5 text-xs font-bold border-black/10 hover:bg-black/5 text-[#262626] hidden sm:flex"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>Log Mistake</span>
        </Button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === 'today' && currentDay && (
        <div className="space-y-6">
          <CalendarDayStrip
            days={resolvedDays}
            selectedDayNum={selectedDayNum}
            onSelectDay={dayNum => setSelectedDayNum(dayNum)}
            examTitle={currentExam.label}
          />
          <TodayDayView
            day={currentDay}
            totalDays={resolvedDays.length || 92}
            onSelectDay={dayNum => setSelectedDayNum(dayNum)}
            onToggleTask={(taskId, minutes) => toggleTask(taskId, minutes)}
            togglingTaskId={togglingTaskId}
            onOpenNotes={handleOpenNotes}
            onOpenCapture={handleOpenCapture}
            onSolvePortalMock={onSolvePortalMock || (() => setLocation('/portal/dashboard'))}
            hasNotesAccess={Boolean(enrolment?.has_notes_access)}
          />
        </div>
      )}

      {activeTab === 'board' && (
        <div className="bg-white rounded-2xl border border-black/10 p-5 sm:p-6 shadow-xs">
          <Board92Day
            days={resolvedDays}
            selectedDayNum={selectedDayNum}
            onSelectDay={dayNum => {
              setSelectedDayNum(dayNum);
              setActiveTab('today');
            }}
          />
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#262626]">
                4-Bucket Error Ledger
              </h3>
              <p className="text-xs text-foreground/60">
                Log simulation mistakes into Concept, Time, Clarity, and Care to target root causes.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowLedgerModal(true)}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold"
            >
              Add Entry
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {[
              { name: 'Concept', color: 'border-blue-200 bg-blue-50/50 text-blue-900', desc: 'Brief misunderstanding or missed requirement' },
              { name: 'Time', color: 'border-amber-200 bg-amber-50/50 text-amber-900', desc: 'Over-rendering early or pacing collapse' },
              { name: 'Clarity', color: 'border-purple-200 bg-purple-50/50 text-purple-900', desc: 'Weak visual hierarchy or illegible callouts' },
              { name: 'Care', color: 'border-rose-200 bg-rose-50/50 text-rose-900', desc: 'Smudging, unfinished linework, or messy sheets' },
            ].map(b => (
              <div key={b.name} className={`p-4 rounded-xl border ${b.color} space-y-1`}>
                <span className="text-xs font-extrabold block">{b.name} Bucket</span>
                <p className="text-[11px] opacity-80">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <TrackerAnalyticsHistory
          candidateId={effectiveCandidateId}
          resolvedDays={resolvedDays}
          tier={enrolment?.tier || 'intensive'}
          band={profile?.band}
          diagnostic={profile?.diagnostic}
        />
      )}

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
        hasAccess={Boolean(enrolment?.has_notes_access)}
        milestoneTitle={activeMilestoneTitle}
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
        taskId={activeCaptureTaskId}
      />

      <ExplanationCardModal
        open={showExplanationModal}
        onOpenChange={setShowExplanationModal}
        candidateId={effectiveCandidateId}
        taskId={activeCaptureTaskId}
      />

      <AwarenessCardModal
        open={showAwarenessModal}
        onOpenChange={setShowAwarenessModal}
        candidateId={effectiveCandidateId}
        taskId={activeCaptureTaskId}
      />

      <PitchLogModal
        open={showPitchModal}
        onOpenChange={setShowPitchModal}
        candidateId={effectiveCandidateId}
        taskId={activeCaptureTaskId}
      />
    </div>
  );
}
