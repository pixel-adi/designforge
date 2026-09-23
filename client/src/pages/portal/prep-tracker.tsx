import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import { usePrepTracker } from '@/prep-tracker/usePrepTracker';
import { ResolvedTask } from '@/prep-tracker/types';
import { ExamCountdownTimer } from '@/prep-tracker/components/ExamCountdownTimer';
import { NonNegotiablesStrip } from '@/prep-tracker/components/NonNegotiablesStrip';
import { TodayDayView } from '@/prep-tracker/components/TodayDayView';
import { Board92Day } from '@/prep-tracker/components/Board92Day';
import { OnboardingModal } from '@/prep-tracker/components/OnboardingModal';
import { MilestoneClassNotesModal } from '@/prep-tracker/components/MilestoneClassNotesModal';
import { SimulationLogModal } from '@/prep-tracker/components/SimulationLogModal';
import { ErrorLedgerModal } from '@/prep-tracker/components/ErrorLedgerModal';
import { CritiqueModal } from '@/prep-tracker/components/CritiqueModal';
import { SundayReviewModal } from '@/prep-tracker/components/SundayReviewModal';
import {
  DiaryModal,
  ExplanationCardModal,
  AwarenessCardModal,
  PitchLogModal,
} from '@/prep-tracker/components/DiaryAndArtifactsModals';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Layers,
  FileCheck,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Sparkles,
  BookOpen,
  Lock,
  Flame,
  CheckCircle2,
  Settings,
} from 'lucide-react';

export default function PortalPrepTracker() {
  const [, setLocation] = useLocation();
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'board' | 'simulations' | 'ledger'>(
    'today'
  );

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

  // Resolve authenticated candidate
  useEffect(() => {
    async function loadAuth() {
      setLoadingUser(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Instant local preview fallback so feature can be tested directly on localhost
          setCandidate({
            id: 'preview-candidate-id',
            name: 'Aspirant (Preview Mode)',
            email: 'aspirant@designforge.co.in',
            access_level: 'free',
          });
          return;
        }

        const { data: cand } = await supabase
          .from('exam_candidates')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (cand) {
          setCandidate(cand);
        } else {
          // If profile missing, send to dashboard for basic candidate registration
          setLocation('/portal/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUser(false);
      }
    }
    loadAuth();
  }, [setLocation]);

  const {
    loading: trackerLoading,
    enrolment,
    profile,
    resolvedDays,
    currentDay,
    selectedDayNum,
    setSelectedDayNum,
    stats,
    togglingTaskId,
    toggleTask,
    completeOnboarding,
    refreshData,
  } = usePrepTracker(candidate?.id || null);

  // Trigger onboarding if no enrolment exists once loading finishes
  useEffect(() => {
    if (!trackerLoading && !enrolment && candidate) {
      setShowOnboarding(true);
    }
  }, [trackerLoading, enrolment, candidate]);

  if (loadingUser && !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
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
    } else if (captureType === 'pitchRecording' || captureType === 'mockConversation') {
      setShowPitchModal(true);
    }
  };

  const handleOpenNotes = (milestoneTitle: string) => {
    setActiveMilestoneTitle(milestoneTitle);
    setShowClassNotes(true);
  };

  // Has notes access if enrolled flag is true OR candidate has focus_batch access
  const hasNotesAccess = Boolean(
    profile?.hasNotesAccess || candidate?.access_level === 'focus_batch'
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#262626]">
      {/* Top Portal Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/portal/dashboard')}
              className="h-8 px-2 text-foreground/60 hover:text-foreground gap-1 text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Portal
            </Button>
            <div className="h-4 w-px bg-black/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-[#262626] tracking-tight">
                92-Day NID Prep Tracker
              </span>
              {profile && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {profile.track} · {profile.tier}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOnboarding(true)}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-foreground/50" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => handleOpenNotes('General Class Notes')}
              className={`h-8 text-xs font-bold gap-1.5 shadow-xs ${
                hasNotesAccess
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-black/5 hover:bg-black/10 text-[#262626] border border-black/10'
              }`}
            >
              {hasNotesAccess ? (
                <BookOpen className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{hasNotesAccess ? 'Class Notes' : 'Notes (₹500)'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. Exam Countdown Timer */}
        <ExamCountdownTimer
          currentDayNum={currentDay?.day || 1}
          phaseName={currentDay?.phaseId ? 'Orientation & Foundation' : 'Preparation Phase'}
        />

        {/* 2. Progress Overview Banner */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-foreground/60">
                  Overall Completion
                </span>
                <span className="font-extrabold text-sm text-primary">
                  {stats.percentage}%
                </span>
              </div>
              <p className="text-xs text-foreground/60">
                {stats.completedCountedTasks} of {stats.totalCountedTasks} counted tasks completed ({Math.round(stats.totalMinutesLogged / 60)} hrs logged)
              </p>
            </div>

            {profile && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-xl border border-black/10 bg-black/[0.02]">
                  <span className="text-foreground/50 block text-[10px]">Diagnostic Band</span>
                  <strong className="capitalize text-[#262626] font-extrabold">
                    {profile.band} ({profile.total}/30)
                  </strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl border border-black/10 bg-black/[0.02]">
                  <span className="text-foreground/50 block text-[10px]">Weak Axes</span>
                  <strong className="text-primary font-bold">
                    {profile.axis1Name} & {profile.axis2Name}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div className="w-full bg-black/5 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* 3. The 4 Weekly Non-Negotiables Strip */}
        <NonNegotiablesStrip
          drillDoneDays={
            resolvedDays
              .filter(d => d.week === (currentDay?.week || 0))
              .filter(d => d.tasks.some(t => t.block === 'drill' && t.completed)).length
          }
          critiqueSubmitted={false}
          simulationLogged={false}
          sundayReviewDone={false}
          isSimulationRequiredThisWeek={Boolean(currentDay && currentDay.week >= 7)}
        />

        {/* 4. Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-black/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'today'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'text-foreground/70 hover:bg-black/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today's Tasks (Day {currentDay?.day || 1})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'board'
                ? 'bg-[#262626] text-white shadow-xs'
                : 'text-foreground/70 hover:bg-black/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>92-Day Board</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLedgerModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-foreground/70 hover:bg-black/5 transition-all flex items-center gap-2 ml-auto"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Error Ledger</span>
          </button>
        </div>

        {/* 5. Active Tab View */}
        {activeTab === 'today' && currentDay && (
          <TodayDayView
            day={currentDay}
            totalDays={resolvedDays.length || 92}
            onSelectDay={dayNum => setSelectedDayNum(dayNum)}
            onToggleTask={(taskId, minutes) => toggleTask(taskId, minutes)}
            togglingTaskId={togglingTaskId}
            onOpenNotes={handleOpenNotes}
            onOpenCapture={handleOpenCapture}
            onSolvePortalMock={() => {
              setActiveSimTask({ id: 'sim-live', title: 'Full Mock Exam' });
              setShowSimModal(true);
            }}
            hasNotesAccess={hasNotesAccess}
          />
        )}

        {activeTab === 'board' && (
          <Board92Day
            days={resolvedDays}
            selectedDayNum={selectedDayNum}
            onSelectDay={dayNum => {
              setSelectedDayNum(dayNum);
              setActiveTab('today');
            }}
          />
        )}
      </main>

      {/* MODALS */}
      {/* Onboarding / Diagnostic Calibration */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={completeOnboarding}
      />

      {/* Class Notes Modal (Locked with ₹500 unlock) */}
      <MilestoneClassNotesModal
        open={showClassNotes}
        onOpenChange={setShowClassNotes}
        candidateId={candidate?.id}
        candidateName={candidate?.name}
        candidateEmail={candidate?.email}
        hasAccess={hasNotesAccess}
        onAccessUnlocked={() => refreshData()}
        milestoneTitle={activeMilestoneTitle}
      />

      {/* Simulation Log Modal with Portal Mock Exam Linking */}
      <SimulationLogModal
        open={showSimModal}
        onOpenChange={setShowSimModal}
        candidateId={candidate?.id}
        taskId={activeSimTask.id}
        taskTitle={activeSimTask.title}
        track={profile?.track || 'ug'}
        onSaved={() => refreshData()}
      />

      {/* Error Ledger Modal */}
      <ErrorLedgerModal
        open={showLedgerModal}
        onOpenChange={setShowLedgerModal}
        candidateId={candidate?.id}
      />

      {/* Critique Submission Modal */}
      <CritiqueModal
        open={showCritiqueModal}
        onOpenChange={setShowCritiqueModal}
        candidateId={candidate?.id}
        taskId={activeCritiqueTask.id}
        taskTitle={activeCritiqueTask.title}
        onSubmitted={() => refreshData()}
      />

      {/* Sunday Review Modal */}
      <SundayReviewModal
        open={showSundayModal}
        onOpenChange={setShowSundayModal}
        candidateId={candidate?.id}
        week={activeSundayWeek}
        onSaved={() => refreshData()}
      />

      {/* Artifact Modals */}
      <DiaryModal
        open={showDiaryModal}
        onOpenChange={setShowDiaryModal}
        candidateId={candidate?.id}
        onSaved={() => refreshData()}
      />

      <ExplanationCardModal
        open={showExplanationModal}
        onOpenChange={setShowExplanationModal}
        candidateId={candidate?.id}
        taskId={activeCaptureTaskId}
        onSaved={() => refreshData()}
      />

      <AwarenessCardModal
        open={showAwarenessModal}
        onOpenChange={setShowAwarenessModal}
        candidateId={candidate?.id}
        onSaved={() => refreshData()}
      />

      <PitchLogModal
        open={showPitchModal}
        onOpenChange={setShowPitchModal}
        candidateId={candidate?.id}
        taskId={activeCaptureTaskId}
        onSaved={() => refreshData()}
      />
    </div>
  );
}
