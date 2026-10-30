import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, AlertCircle, FileText, UploadCloud, EyeOff, FileCheck2, AlertTriangle, ShieldAlert, WifiOff, Lock, ClipboardList, Camera, Clipboard, Image as ImageIcon, Sparkles, CheckCircle2, PauseCircle, Play, Bookmark, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { sanitizeHtml, cleanPlainText } from "@/lib/sanitize";
import { resolvePartBMaxMarks, formatScore } from "@/lib/utils";

// Deployment Protection: Guard against Vite chunk hash invalidation during live production pushes
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    console.warn("[Deploy Protection] Prevented chunk preload crash during active exam.");
  });
}

export const parseFileUrls = (fileUrlString: string | undefined | null): string[] => {
  if (!fileUrlString) return [];
  try {
    const trimmed = fileUrlString.trim();
    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(s => String(s)).filter(Boolean);
    }
  } catch (e) {
    // Fallback to single URL
  }
  return fileUrlString ? [fileUrlString] : [];
};

interface EngineState {
  test: any;
  sections: any[];
  questions: any[];
  options: Record<string, any[]>;
  totalMins: number;
  partAMins: number;
  partA_TimeThreshold: number;
  hasPartB: boolean;
  hasPartA: boolean;
  hasTimedPartALock: boolean;
  isNid: boolean;
}

type TestStep = 'instructions' | 'test' | 'part-b-instructions' | 'upload_buffer' | 'submitted' | 'review';
type QuestionStatus = 'unseen' | 'visited' | 'answered' | 'marked';

interface ResponseData {
  status: QuestionStatus;
  selectedOptions: string[];
  answerText: string;
  fileUrl: string;
  marksAwarded?: number;
  rubricMarks?: Record<string, any>;
  mentorComments?: string;
  mentorImprovements?: string;
  mentorLoomLink?: string;
  timeSpent?: number;
  answerChanges?: number;
  stateTransitions?: Array<{ action: string; timestamp: string }>;
}

export default function PortalTestEngine({ params }: { params?: { id: string } }) {
  const { id: paramId } = useParams();
  const id = params?.id || paramId;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [engineData, setEngineData] = useState<EngineState | null>(null);

  // Test State
  const [testStep, setTestStep] = useState<TestStep>('instructions');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseData>>({});

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [timerRunning, setTimerRunning] = useState(false);
  const testEndTimeRef = useRef<number | null>(null);
  const hasAutoSubmittedRef = useRef(false);
  const hasTransitionedPartBRef = useRef(false);

  // 10-Minute Post-Exam Solution Upload Buffer State
  const [uploadBufferTimeLeft, setUploadBufferTimeLeft] = useState(600); // 10 minutes in seconds
  const uploadBufferEndTimeRef = useRef<number | null>(null);
  const hasStartedUploadBufferRef = useRef(false);

  // Pause & Resume State (Max 2 resumes allowed)
  const [isPaused, setIsPaused] = useState(false);
  const [isSystemRecovery, setIsSystemRecovery] = useState(false);
  const [resumesUsed, setResumesUsed] = useState(0); // 0, 1, or 2
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPausedSecs, setTotalPausedSecs] = useState(0);

  // Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Security State
  const [warningsCount, setWarningsCount] = useState(0);
  const MAX_WARNINGS = 3;

  // Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [modalType, setModalType] = useState<'submit' | 'exit'>('submit');

  // Part Locks
  const [showPartBLockedModal, setShowPartBLockedModal] = useState(false);
  const [partBWaitMins, setPartBWaitMins] = useState(0);

  // Attempt & High-Performance Batched Auto-Save State
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const pendingSyncQuestionsRef = useRef<Set<string>>(new Set());
  const batchSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestResponsesRef = useRef<Record<string, ResponseData>>({});

  // LocalStorage mirroring for 0ms offline recovery & crash resistance
  useEffect(() => {
    latestResponsesRef.current = responses;
    if (attemptId && Object.keys(responses).length > 0) {
      try {
        localStorage.setItem(`df_attempt_${attemptId}`, JSON.stringify(responses));
      } catch (e) {
        // Quota fallback
      }
    }
  }, [responses, attemptId]);

  // Candidate Upload & Camera Enhancement State
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Scoring Details State
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({ NAT: 0, MSQ: 0, MCQ: 0 });
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [questionCorrectness, setQuestionCorrectness] = useState<Record<string, 'correct' | 'incorrect' | 'unattempted'>>({});
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<string, any[]>>({});
  const [attemptDetails, setAttemptDetails] = useState<any>(null);

  useEffect(() => {
    if (id) fetchTestEngineData();
    else {
      toast({ title: "Error", description: "No Test ID provided in URL", variant: "destructive" });
      setLocation('/portal/dashboard');
    }
  }, [id]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (engineData && !loading) {
      const searchParams = new URLSearchParams(window.location.search);
      const attemptIdFromUrl = searchParams.get('review_attempt');
      if (attemptIdFromUrl && testStep === 'instructions') {
        loadReviewAttempt(attemptIdFromUrl);
      }
    }
  }, [engineData, loading]);

  const loadReviewAttempt = async (attemptIdFromUrl: string) => {
    try {
      setLoading(true);
      const { data: pastResp } = await supabase.from('exam_responses').select('*').eq('attempt_id', attemptIdFromUrl);
      const { data: attemptInfo } = await supabase.from('exam_attempts').select('*').eq('id', attemptIdFromUrl).single();
      
      if (attemptInfo) {
        setAttemptDetails(attemptInfo);
      }

      setAttemptId(attemptIdFromUrl);

      const loadedResponses: Record<string, ResponseData> = {};
      (engineData?.questions || []).forEach(q => {
        loadedResponses[q.id] = {
          status: 'unseen',
          selectedOptions: [],
          answerText: '',
          fileUrl: '',
          timeSpent: 0,
          answerChanges: 0,
          stateTransitions: []
        };
      });

      if (pastResp) {
        pastResp.forEach(r => {
          loadedResponses[r.question_id] = {
            status: r.status,
            selectedOptions: r.selected_options || [],
            answerText: r.answer_text || '',
            fileUrl: r.file_url || '',
            marksAwarded: r.marks_awarded !== null && r.marks_awarded !== undefined ? Number(r.marks_awarded) : undefined,
            rubricMarks: r.rubric_marks || undefined,
            mentorComments: r.mentor_comments,
            mentorImprovements: r.mentor_improvements,
            mentorLoomLink: r.mentor_loom_link,
            timeSpent: r.time_spent || 0,
            answerChanges: r.answer_changes || 0,
            stateTransitions: r.state_transitions || []
          };
        });
      }

      setResponses(loadedResponses);
      setTestStep('review');
      setActiveQuestionIndex(0);

      await finalizeAttempt(loadedResponses, attemptIdFromUrl, true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkIsPartBActive = (currentTimeLeft: number) => {
    // If exam does not have a timed Part A lock (e.g. NID papers or tests without Part A), all questions are fully accessible from minute 1
    if (!engineData?.hasTimedPartALock) return true;
    if (testStep === 'part-b-instructions') return true;
    const totalSecs = (engineData.totalMins || 180) * 60;
    if (engineData.partA_TimeThreshold >= totalSecs) return false;
    return currentTimeLeft <= engineData.partA_TimeThreshold && currentTimeLeft < totalSecs;
  };

  // Tab switching detection (Only monitored during Part A for exams that strictly enforce timed Part A lockout)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Malpractice check is suspended while examination is paused
      if (isPaused) return;

      const isPartBActive = checkIsPartBActive(timeLeft);
      // Malpractice warning applies only during locked Part A mode (not during Part B or on NID tests where students upload sketches)
      if (document.hidden && testStep === 'test' && engineData?.hasTimedPartALock && !isPartBActive) {
        setWarningsCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_WARNINGS) {
            handleAutoSubmit("Maximum tab switching limit reached (3). Your test has been automatically submitted.");
          } else {
            toast({
              title: "⚠️ Warning: Malpractice Detected",
              description: `You have switched tabs. This activity has been logged (${newCount}/${MAX_WARNINGS} warnings). Test will auto-submit on the 3rd attempt.`,
              variant: "destructive",
              duration: 8000,
            });
          }
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testStep, timeLeft, engineData, isPaused]);

  // Active Question Time Tracker (Decoupled from timeLeft countdown to eliminate re-renders)
  useEffect(() => {
    let timerId: any;
    if (timerRunning && !isPaused && testStep === 'test' && engineData?.questions?.[activeQuestionIndex]) {
      const activeQId = engineData.questions[activeQuestionIndex].id;
      timerId = setInterval(() => {
        // Accumulate in latestResponsesRef without triggering heavy component re-renders every 1000ms
        const currentQ = latestResponsesRef.current[activeQId] || {
          status: 'unseen',
          selectedOptions: [],
          answerText: '',
          fileUrl: '',
          timeSpent: 0,
          answerChanges: 0,
          stateTransitions: []
        };
        const updatedTime = (currentQ.timeSpent || 0) + 1;
        latestResponsesRef.current[activeQId] = {
          ...currentQ,
          timeSpent: updatedTime
        };

        // Sync to React state every 5 seconds or upon navigating questions to keep state fresh
        if (updatedTime % 5 === 0) {
          setResponses(prev => ({
            ...prev,
            [activeQId]: {
              ...(prev[activeQId] || currentQ),
              timeSpent: updatedTime
            }
          }));
        }
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [timerRunning, isPaused, testStep, activeQuestionIndex, engineData]);

  // Wall-Clock Synchronized Timer Countdown (Guaranteed precision regardless of tab backgrounding or lag)
  useEffect(() => {
    if (!timerRunning || isPaused || !testEndTimeRef.current) return;

    const checkAndTick = () => {
      if (isPaused || !testEndTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.round((testEndTimeRef.current - now) / 1000));
      setTimeLeft(remaining);

      // Continuously persist remaining seconds to localStorage for 0ms crash/deploy recovery
      if (attemptId && remaining > 0) {
        try {
          localStorage.setItem(`df_frozen_seconds_${attemptId}`, String(remaining));
        } catch (e) {
          // Ignore quota errors
        }
      }

      // Auto-submit or transition to 10-minute Post-Exam Solution Upload Buffer when time has fully elapsed
      if (remaining <= 0) {
        if (!hasAutoSubmittedRef.current) {
          // Buffer window ONLY activates if the student was actively taking the exam and duration just expired
          if (engineData?.hasPartB && !hasStartedUploadBufferRef.current && testStep === 'test') {
            hasStartedUploadBufferRef.current = true;
            const bufferEnd = Date.now() + 600 * 1000;
            uploadBufferEndTimeRef.current = bufferEnd;
            if (attemptId) {
              localStorage.setItem(`df_upload_buffer_end_${attemptId}`, String(bufferEnd));
            }
            setUploadBufferTimeLeft(600);
            setTimerRunning(false);
            setTestStep('upload_buffer');
            toast({
              title: "Exam Finished ⏱️ Upload Buffer Active",
              description: engineData.isNid
                ? "You have 10 minutes to photograph and upload your design sketches and solutions."
                : "You have 10 minutes to upload your question sketches. Objective questions are now locked.",
              duration: 9000
            });
            return;
          }

          hasAutoSubmittedRef.current = true;
          setTimerRunning(false);
          handleAutoSubmit("Time's up! Your test has been automatically submitted.");
        }
        return;
      }

      // Part A to Part B Transition: Auto-lock & score Part A (only when exam strictly enforces timed Part A lock)
      const totalSecs = (engineData?.totalMins || 180) * 60;
      if (
        engineData?.hasTimedPartALock &&
        engineData?.hasPartB &&
        engineData.partA_TimeThreshold < totalSecs &&
        remaining <= engineData.partA_TimeThreshold &&
        !hasTransitionedPartBRef.current &&
        testStep === 'test'
      ) {
        const currentQ = engineData.questions?.[activeQuestionIndex];
        if (currentQ?.part === 'A') {
          hasTransitionedPartBRef.current = true;
          finalizeAttempt(latestResponsesRef.current, attemptId, false);
          setTestStep('part-b-instructions');
          toast({
            title: "Part A Time Up 🔒",
            description: "Part A has been auto-submitted and locked. Please proceed to Part B.",
            duration: 8000
          });
        }
      }
    };

    // Immediate initial sync
    checkAndTick();

    // 500ms heartbeat guarantees sub-second accuracy without drift
    const timerId = setInterval(checkAndTick, 500);

    // Instant resync on tab visibility change or window focus
    const handleSync = () => {
      if (!document.hidden) {
        checkAndTick();
      }
    };
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [timerRunning, engineData?.hasTimedPartALock, engineData?.hasPartB, engineData?.partA_TimeThreshold, engineData?.totalMins, testStep, activeQuestionIndex, attemptId]);

  // 10-Minute Post-Exam Solution Upload Buffer Countdown Effect
  useEffect(() => {
    if (testStep !== 'upload_buffer') return;

    if (!uploadBufferEndTimeRef.current) {
      const stored = attemptId ? Number(localStorage.getItem(`df_upload_buffer_end_${attemptId}`)) : null;
      if (stored && stored > Date.now()) {
        uploadBufferEndTimeRef.current = stored;
      } else {
        const newEnd = Date.now() + 600 * 1000;
        uploadBufferEndTimeRef.current = newEnd;
        if (attemptId) localStorage.setItem(`df_upload_buffer_end_${attemptId}`, String(newEnd));
      }
    }

    const checkBufferTick = () => {
      if (!uploadBufferEndTimeRef.current) return;
      const rem = Math.max(0, Math.round((uploadBufferEndTimeRef.current - Date.now()) / 1000));
      setUploadBufferTimeLeft(rem);

      if (rem <= 0) {
        if (attemptId) {
          localStorage.removeItem(`df_upload_buffer_end_${attemptId}`);
        }
        handleAutoSubmit("Upload buffer ended. Your test and solutions have been submitted.");
      }
    };

    checkBufferTick();
    const interval = setInterval(checkBufferTick, 500);

    return () => clearInterval(interval);
  }, [testStep, attemptId]);

  // Deployment & Reload Protection: Automatically freeze time and save latest responses on tab close or page reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (attemptId && timeLeft > 0 && testStep === 'test') {
        try {
          localStorage.setItem(`df_frozen_seconds_${attemptId}`, String(timeLeft));
          localStorage.setItem(`df_attempt_${attemptId}`, JSON.stringify(latestResponsesRef.current));
        } catch (e) {
          // Ignore quota errors
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attemptId, timeLeft, testStep]);

  const fetchTestEngineData = async () => {
    setLoading(true);
    try {
      if (!id) throw new Error("Invalid Test ID");
      
      // Safe defensive query for exam_test_questions (with marks)
      const fetchTqDefensive = async () => {
        const res = await supabase.from('exam_test_questions').select('question_id, marks').eq('test_id', id);
        if (res.error && (res.error.message?.includes('marks') || res.error.code === '42703')) {
          return supabase.from('exam_test_questions').select('question_id').eq('test_id', id);
        }
        return res;
      };

      // Parallel Batch 1: Fetch Test Details, Sections, and Question Links simultaneously
      const [testRes, sectionsRes, tqRes] = await Promise.all([
        supabase.from('exam_tests').select('*, exam_programs(name)').eq('id', id).single(),
        supabase.from('exam_test_sections').select('*').eq('test_id', id),
        fetchTqDefensive()
      ]);

      if (testRes.error) throw new Error(`DB Error: ${testRes.error.message}`);
      if (!testRes.data) throw new Error(`Test not found in DB for ID: ${id}`);

      const testData = testRes.data;
      const sectionsData = sectionsRes.data || [];
      const questionIds = tqRes.data?.map((t: any) => t.question_id) || [];

      let questionsData: any[] = [];
      let optionsMap: Record<string, any[]> = {};
      let initialResponses: Record<string, ResponseData> = {};

      if (questionIds.length > 0) {
        // Parallel Batch 2: Fetch Questions and Options simultaneously
        const [qRes, optRes] = await Promise.all([
          supabase.from('exam_questions').select('*').in('id', questionIds),
          supabase.from('exam_options')
            .select('id, question_id, content_text, media_url, created_at')
            .in('question_id', questionIds)
            .order('id', { ascending: true })
        ]);

        const tqMarksMap = new Map((tqRes.data || []).map((t: any) => [t.question_id, t.marks]));
        questionsData = (qRes.data || []).map((q: any) => {
          const explicitMarks = tqMarksMap.get(q.id) != null && Number(tqMarksMap.get(q.id)) > 0
            ? Number(tqMarksMap.get(q.id))
            : (q.marks != null && Number(q.marks) > 0 ? Number(q.marks) : null);

          const finalMarks = explicitMarks != null
            ? explicitMarks
            : (q.part === 'B' ? resolvePartBMaxMarks(q, testData) : q.marks);

          return {
            ...q,
            marks: finalMarks
          };
        });
        const optData = optRes.data || [];
        optData.forEach(opt => {
          if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
          optionsMap[opt.question_id].push(opt);
        });

        // Sort questions by Part, then strictly NAT -> MSQ -> MCQ -> SUBJECTIVE, then ID for determinism
        const typeOrder: Record<string, number> = { 'NAT': 1, 'MSQ': 2, 'MCQ': 3, 'SUBJECTIVE': 4 };
        questionsData.sort((a, b) => {
          if (a.part !== b.part) return a.part.localeCompare(b.part);
          if (a.type !== b.type) return (typeOrder[a.type] || 5) - (typeOrder[b.type] || 5);
          return a.id.localeCompare(b.id);
        });

        // Image Preloader: Cache all media URLs in memory for instant rendering without flickering
        const imageUrlsToPreload: string[] = [];
        questionsData.forEach(q => {
          if (q.media_url) imageUrlsToPreload.push(q.media_url);
          if (q.content_text) {
            const matches = q.content_text.match(/src=["'](.*?)["']/g);
            if (matches) {
              matches.forEach((m: string) => {
                const src = m.replace(/src=["']|["']/g, '');
                if (src && src.startsWith('http')) imageUrlsToPreload.push(src);
              });
            }
          }
        });
        Object.values(optionsMap).forEach(opts => {
          opts.forEach(opt => {
            if (opt.media_url) imageUrlsToPreload.push(opt.media_url);
          });
        });

        // Trigger asynchronous image preloading
        imageUrlsToPreload.forEach(url => {
          const img = new Image();
          img.src = url;
        });

        // Initialize Responses State
        questionsData.forEach(q => {
          initialResponses[q.id] = {
            status: 'unseen',
            selectedOptions: [],
            answerText: '',
            fileUrl: '',
            timeSpent: 0,
            answerChanges: 0,
            stateTransitions: []
          };
        });
      }

      const titleUpper = (testData?.title || '').toUpperCase();
      const codeUpper = (testData?.test_code || '').toUpperCase();
      const progNameUpper = (testData?.exam_programs?.name || '').toUpperCase();
      const category = (testData?.category || '').toLowerCase();

      // Rule: Full tests have 3 hours (180 min), Half tests have 1.5 hours (90 min),
      // and Custom tests have whatever is defined while creation of the tests.
      const isCustomTest = category === 'custom_short' || category === 'custom_practice' || Boolean(testData?.is_custom_practice) || titleUpper.includes('CUSTOM');
      const isHalfTest = !isCustomTest && (category === 'half_length' || titleUpper.includes('HALF') || codeUpper.includes('-H'));
      const isFullTest = !isCustomTest && !isHalfTest;

      let totalMins = 180; // default 3 hours
      if (isCustomTest) {
        const secSum = sectionsData?.reduce((acc: number, sec: any) => acc + (sec.duration_minutes || 0), 0);
        totalMins = (secSum && secSum > 0) ? secSum : (testData?.duration_minutes || 60);
      } else if (isHalfTest) {
        totalMins = 90; // strictly 1.5 hours
      } else {
        totalMins = 180; // strictly 3 hours
      }

      const isNid = titleUpper.includes('NID') || codeUpper.includes('NID') || progNameUpper.includes('NID');

      // For NID exams (B.Des and M.Des), there is strictly NO Part A. Candidates exclusively have Part B (Subjective Design & Drawing).
      // Normalize all questions for NID so they are Part B.
      const normalizedQuestions = isNid 
        ? questionsData.map(q => ({ ...q, part: 'B' }))
        : questionsData;

      const hasPartA = !isNid && normalizedQuestions.some(q => q.part === 'A');
      const hasPartB = isNid || normalizedQuestions.some(q => q.part === 'B');

      // A timed Part A lockout is strictly for non-NID exams (like CEED/UCEED) that explicitly configure a separate Part A duration.
      let partAMins = 0;
      if (!isNid && hasPartA) {
        const foundPartA = sectionsData?.find((s: any) => s.part === 'A')?.duration_minutes;
        if (foundPartA && foundPartA > 0 && foundPartA < totalMins) {
          partAMins = foundPartA;
        } else {
          // Standard official defaults if sections were not populated or mismatched
          if (titleUpper.includes('UCEED') || progNameUpper.includes('UCEED') || codeUpper.includes('UCEED')) {
            partAMins = isHalfTest ? 60 : 120;
          } else {
            // CEED default
            partAMins = isHalfTest ? 30 : 60;
          }
        }
      }

      const hasTimedPartALock = !isNid && hasPartA && hasPartB && partAMins > 0 && partAMins < totalMins;
      const partA_TimeThreshold = hasTimedPartALock ? (totalMins * 60) - (partAMins * 60) : 0;

      setEngineData({
        test: testData,
        sections: sectionsData || [],
        questions: normalizedQuestions,
        options: optionsMap,
        totalMins,
        partAMins,
        partA_TimeThreshold,
        hasPartB,
        hasPartA,
        hasTimedPartALock,
        isNid
      });
      // 0ms Zero-Loss Auto-Recovery: Detect active in-progress attempt for this student
      let hasRestoredActiveAttempt = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: candidate } = await supabase
            .from('exam_candidates')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (candidate) {
            const { data: activeAttempt } = await supabase
              .from('exam_attempts')
              .select('*')
              .eq('candidate_id', candidate.id)
              .eq('test_id', id)
              .eq('status', 'in_progress')
              .order('attempt_number', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (activeAttempt) {
              hasRestoredActiveAttempt = true;
              setAttemptId(activeAttempt.id);

              // 1. Restore Responses: Merge DB responses + LocalStorage (for freshest inputs)
              const recoveredResponses = { ...initialResponses };

              const { data: dbResponses } = await supabase
                .from('exam_responses')
                .select('*')
                .eq('attempt_id', activeAttempt.id);

              if (dbResponses) {
                dbResponses.forEach((r: any) => {
                  if (recoveredResponses[r.question_id]) {
                    recoveredResponses[r.question_id] = {
                      status: r.status || 'visited',
                      selectedOptions: r.selected_options || [],
                      answerText: r.answer_text || '',
                      fileUrl: r.file_url || '',
                      timeSpent: r.time_spent || 0,
                      answerChanges: r.answer_changes || 0,
                      stateTransitions: r.state_transitions || []
                    };
                  }
                });
              }

              // Layer localStorage cache on top for any unsynced offline edits
              try {
                const localCached = localStorage.getItem(`df_attempt_${activeAttempt.id}`);
                if (localCached) {
                  const parsedLocal = JSON.parse(localCached);
                  Object.keys(parsedLocal).forEach(qId => {
                    if (recoveredResponses[qId]) {
                      const localItem = parsedLocal[qId];
                      if (
                        (localItem.selectedOptions && localItem.selectedOptions.length > 0) ||
                        (localItem.answerText && localItem.answerText.trim()) ||
                        localItem.fileUrl
                      ) {
                        recoveredResponses[qId] = {
                          ...recoveredResponses[qId],
                          ...localItem
                        };
                      }
                    }
                  });
                }
              } catch (e) {
                console.warn("Could not parse local attempt cache:", e);
              }

              latestResponsesRef.current = recoveredResponses;
              setResponses(recoveredResponses);

              // 2. Recover Exact Remaining Seconds (Frozen Seconds)
              let remainingSecs = totalMins * 60;
              const frozenSecondsStr = typeof window !== 'undefined' ? localStorage.getItem(`df_frozen_seconds_${activeAttempt.id}`) : null;

              if (frozenSecondsStr && Number(frozenSecondsStr) > 0) {
                remainingSecs = Number(frozenSecondsStr);
              } else if (activeAttempt.start_time) {
                const elapsed = Math.max(0, Math.floor((Date.now() - new Date(activeAttempt.start_time).getTime()) / 1000));
                const storedTotalPaused = activeAttempt.total_paused_seconds || 0;
                remainingSecs = Math.max(0, (totalMins * 60) - Math.max(0, elapsed - storedTotalPaused));
              }

              // Restore pause metadata
              const storedResumes = (activeAttempt as any).pause_count ?? (Number(sessionStorage.getItem(`df_resumes_used_${activeAttempt.id}`)) || 0);
              const storedTotalPaused = (activeAttempt as any).total_paused_seconds ?? (Number(sessionStorage.getItem(`df_total_paused_${activeAttempt.id}`)) || 0);
              setResumesUsed(storedResumes);
              setTotalPausedSecs(storedTotalPaused);

              // 3. Check if upload buffer window is active or main exam timer expired
              const bufferEndKey = `df_upload_buffer_end_${activeAttempt.id}`;
              const storedBufferEnd = typeof window !== 'undefined' ? Number(localStorage.getItem(bufferEndKey)) : 0;

              if (hasPartB && storedBufferEnd && storedBufferEnd > Date.now()) {
                uploadBufferEndTimeRef.current = storedBufferEnd;
                hasStartedUploadBufferRef.current = true;
                setUploadBufferTimeLeft(Math.max(0, Math.round((storedBufferEnd - Date.now()) / 1000)));
                setTestStep('upload_buffer');
                setIsPaused(false);
                setTimerRunning(false);
                toast({
                  title: "Buffer Window Active ⏱️",
                  description: isNid
                    ? "You are in the 10-minute solution upload window."
                    : "You are in the 10-minute solution upload window. Objective answers are locked.",
                  duration: 6000
                });
              } else if (remainingSecs <= 0) {
                // The attempt has already expired in the past and no active buffer window exists.
                // Close this expired attempt so the candidate is NOT dropped into an artificial buffer window.
                await supabase.from('exam_attempts').update({
                  status: 'completed',
                  completed_at: new Date().toISOString()
                }).eq('id', activeAttempt.id);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(bufferEndKey);
                  localStorage.removeItem(`df_frozen_seconds_${activeAttempt.id}`);
                }
                hasRestoredActiveAttempt = false;
                setAttemptId(null);
                setTestStep('instructions');
              } else {
                testEndTimeRef.current = Date.now() + (remainingSecs * 1000);
                sessionStorage.setItem(`df_test_end_${id}`, String(testEndTimeRef.current));
                setTimeLeft(remainingSecs);

                setIsPaused(true);
                setIsSystemRecovery(true);
                setPausedAt(Date.now());
                setTimerRunning(true);
                setTestStep('test');

                toast({
                  title: "Exam Session Restored 🛡️",
                  description: `All your answers are safe. Your timer was automatically frozen at ${formatTime(remainingSecs)}. Click 'Resume Examination' to continue.`,
                  duration: 8000
                });
              }
            }
          }
        }
      } catch (recoveryErr) {
        console.warn("Could not check active attempt for auto-recovery:", recoveryErr);
      }

      if (!hasRestoredActiveAttempt) {
        setResponses(initialResponses);

        // Check cached session end time for instant reload/crash recovery
        const cachedEndTimeStr = typeof window !== 'undefined' ? sessionStorage.getItem(`df_test_end_${id}`) : null;
        if (cachedEndTimeStr) {
          const cachedEnd = Number(cachedEndTimeStr);
          if (cachedEnd > Date.now()) {
            const rem = Math.max(0, Math.round((cachedEnd - Date.now()) / 1000));
            testEndTimeRef.current = cachedEnd;
            setTimeLeft(rem);
          } else {
            testEndTimeRef.current = null;
            setTimeLeft(0);
          }
        } else {
          setTimeLeft(totalMins * 60);
        }
      }

    } catch (err: any) {
      toast({ title: "Failed to load test", description: err.message, variant: "destructive" });
      setLocation('/portal/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ---------- TASK 1: Create Attempt in DB (Multi-Attempt: max 3) ----------
  const MAX_ATTEMPTS = 3;

  const createAttempt = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get candidate record
      const { data: candidate } = await supabase
        .from('exam_candidates')
        .select('id, access_level, has_focus_mocks_access')
        .eq('auth_user_id', user.id)
        .single();
      if (!candidate) throw new Error('Candidate profile not found');

      // Access & 1-week deadline enforcement for Focus Batch tests
      const currentTest = engineData?.test;
      if (currentTest && (currentTest.is_focus_batch || currentTest.access_tier === 'focus_batch')) {
        const hasAccess = candidate.access_level === 'focus_batch' || Boolean(candidate.has_focus_mocks_access);
        if (!hasAccess) {
          toast({
            title: "Access Restricted",
            description: "This mock is exclusive to Focus Batch accounts. Unlock it from the portal dashboard.",
            variant: "destructive"
          });
          setLocation('/portal/dashboard');
          return null;
        }

        const deadline = currentTest.ends_at || currentTest.expires_at;
        if (deadline && new Date(deadline).getTime() < Date.now()) {
          toast({
            title: "Challenge Expired",
            description: "The 1-week submission deadline for this Focus Batch mock has passed.",
            variant: "destructive"
          });
          setLocation('/portal/dashboard');
          return null;
        }
      }

      // Fetch all existing attempts for this candidate + test
      const { data: existingAttempts } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('candidate_id', candidate.id)
        .eq('test_id', id)
        .order('attempt_number', { ascending: true });

      const attempts = existingAttempts || [];

      // Resume an in-progress attempt if one exists (handles page refresh)
      const inProgress = attempts.find(a => a.status === 'in_progress');
      if (inProgress) {
        const totalSecs = (engineData?.totalMins || 180) * 60;
        let remaining = totalSecs;

        // Restore pause metadata
        const storedResumes = (inProgress as any).pause_count ?? (Number(sessionStorage.getItem(`df_resumes_used_${inProgress.id}`)) || 0);
        const storedTotalPaused = (inProgress as any).total_paused_seconds ?? (Number(sessionStorage.getItem(`df_total_paused_${inProgress.id}`)) || 0);
        const isCurrentlyPaused = Boolean((inProgress as any).paused_at) || sessionStorage.getItem(`df_is_paused_${inProgress.id}`) === 'true';

        setResumesUsed(storedResumes);
        setTotalPausedSecs(storedTotalPaused);

        if (inProgress.start_time) {
          const startTimeMs = new Date(inProgress.start_time).getTime();
          let elapsedSecs = Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
          // Deduct paused time so student is not penalized for time spent while paused
          elapsedSecs = Math.max(0, elapsedSecs - storedTotalPaused);
          remaining = Math.max(0, totalSecs - elapsedSecs);
        }
        testEndTimeRef.current = Date.now() + (remaining * 1000);
        sessionStorage.setItem(`df_test_end_${id}`, String(testEndTimeRef.current));
        setTimeLeft(remaining);

        if (isCurrentlyPaused) {
          setIsPaused(true);
          setPausedAt(Date.now());
        }

        if (remaining <= 0) {
          // Check if test has Part B and upload buffer window is currently actively running
          const bufferEndKey = `df_upload_buffer_end_${inProgress.id}`;
          const storedBufferEnd = Number(localStorage.getItem(bufferEndKey));
          const hasPartB = engineData?.hasPartB ?? true;
          
          if (hasPartB && storedBufferEnd && storedBufferEnd > Date.now()) {
            uploadBufferEndTimeRef.current = storedBufferEnd;
            hasStartedUploadBufferRef.current = true;
            setUploadBufferTimeLeft(Math.max(0, Math.round((storedBufferEnd - Date.now()) / 1000)));
            setTestStep('upload_buffer');
            return inProgress.id;
          } else {
            // Main exam duration expired and there is no active buffer.
            // Mark the expired attempt completed so the student can create a fresh new attempt with full duration.
            await supabase.from('exam_attempts').update({
              status: 'completed',
              completed_at: new Date().toISOString()
            }).eq('id', inProgress.id);
            localStorage.removeItem(bufferEndKey);
            localStorage.removeItem(`df_frozen_seconds_${inProgress.id}`);
            // Fall through to create fresh attempt below
          }
        } else {
          return inProgress.id;
        }
      }

      // Check if max attempts reached
      const completedCount = attempts.filter(a => a.status === 'completed').length;
      if (completedCount >= MAX_ATTEMPTS) {
        toast({ title: "Maximum Attempts Reached", description: `You have already completed ${MAX_ATTEMPTS} attempts for this test.`, variant: "destructive", duration: 6000 });
        setLocation('/portal/dashboard');
        return null;
      }

      // Create a new attempt with incremented attempt_number
      const nextAttemptNumber = attempts.length > 0
        ? Math.max(...attempts.map(a => a.attempt_number || 1)) + 1
        : 1;

      const nowIso = new Date().toISOString();
      const totalSecs = (engineData?.totalMins || 180) * 60;
      testEndTimeRef.current = Date.now() + (totalSecs * 1000);
      sessionStorage.setItem(`df_test_end_${id}`, String(testEndTimeRef.current));
      setTimeLeft(totalSecs);

      const { data: attempt, error } = await supabase
        .from('exam_attempts')
        .insert({
          candidate_id: candidate.id,
          test_id: id,
          start_time: nowIso,
          status: 'in_progress',
          attempt_number: nextAttemptNumber
        })
        .select('id')
        .single();
      if (error) throw error;
      return attempt.id;
    } catch (err: any) {
      console.error('Failed to create attempt:', err.message);
      return null;
    }
  };

  // ---------- TASK 2: High-Concurrency Batched Auto-Save (90% Network Query Reduction) ----------
  const syncResponseToDb = (currentAttemptId: string, qId: string) => {
    pendingSyncQuestionsRef.current.add(qId);

    if (!batchSyncTimerRef.current) {
      batchSyncTimerRef.current = setTimeout(() => {
        flushPendingResponsesToDb(currentAttemptId);
      }, 3000);
    }
  };

  const flushPendingResponsesToDb = async (currentAttemptId: string) => {
    if (batchSyncTimerRef.current) {
      clearTimeout(batchSyncTimerRef.current);
      batchSyncTimerRef.current = null;
    }

    const dirtyQIds = Array.from(pendingSyncQuestionsRef.current);
    if (dirtyQIds.length === 0) return;

    pendingSyncQuestionsRef.current.clear();

    const responsesToUpsert: any[] = [];
    dirtyQIds.forEach(qId => {
      const resp = latestResponsesRef.current[qId];
      if (resp) {
        responsesToUpsert.push({
          attempt_id: currentAttemptId,
          question_id: qId,
          status: resp.status,
          selected_options: resp.selectedOptions,
          answer_text: resp.answerText || null,
          file_url: resp.fileUrl || null,
          time_spent: resp.timeSpent || 0,
          answer_changes: resp.answerChanges || 0,
          state_transitions: resp.stateTransitions || []
        });
      }
    });

    if (responsesToUpsert.length > 0) {
      try {
        const { error } = await supabase.from('exam_responses').upsert(responsesToUpsert, { onConflict: 'attempt_id,question_id' });
        if (error) console.warn('Batched auto-save warn:', error.message);
      } catch (err) {
        console.warn('Batched auto-save exception:', err);
      }
    }
  };

  const startTest = async () => {
    const newAttemptId = await createAttempt();
    if (!newAttemptId) return;
    setAttemptId(newAttemptId);
    setTestStep('test');

    // If resuming an existing attempt with saved answers, preserve them!
    try {
      const cached = localStorage.getItem(`df_attempt_${newAttemptId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Object.keys(parsed).length > 0) {
          setResponses(parsed);
          latestResponsesRef.current = parsed;
          setTimerRunning(true);
          return;
        }
      }
    } catch (e) {}

    const totalSecs = (engineData?.totalMins || 180) * 60;
    if (!testEndTimeRef.current || testEndTimeRef.current <= Date.now()) {
      testEndTimeRef.current = Date.now() + (totalSecs * 1000);
      sessionStorage.setItem(`df_test_end_${id}`, String(testEndTimeRef.current));
      setTimeLeft(totalSecs);
    }
    hasAutoSubmittedRef.current = false;
    hasTransitionedPartBRef.current = false;
    setTimerRunning(true);
    setActiveQuestionIndex(0);

    // Initialize fresh responses for the new attempt
    const freshResponses: Record<string, ResponseData> = {};
    (engineData?.questions || []).forEach(q => {
      freshResponses[q.id] = {
        status: 'unseen',
        selectedOptions: [],
        answerText: '',
        fileUrl: '',
        timeSpent: 0,
        answerChanges: 0,
        stateTransitions: []
      };
    });

    if (engineData?.questions.length) {
      const firstQId = engineData.questions[0].id;
      freshResponses[firstQId].status = 'visited';
    }

    setResponses(freshResponses);
  };

  const startPartB = () => {
    setTestStep('test');
    // Find first Part B question and navigate to it
    const firstPartBIdx = engineData!.questions.findIndex(q => q.part === 'B');
    if (firstPartBIdx !== -1) {
      handleNavigateQuestion(firstPartBIdx, true);
    }
  };

  // ---------- TASK 4: Score Evaluation + Finalize Attempt ----------
  const finalizeAttempt = async (responsesToScore: Record<string, ResponseData> = responses, currentAttemptId: string | null = attemptId, isReviewOnly: boolean = false) => {
    if (!currentAttemptId || !engineData?.questions) return;
    try {
      // Fetch correct answers for all Part A questions in this test
      const partAQuestionIds = (engineData.questions || [])
        .filter(q => q.part === 'A')
        .map(q => q.id);

      let scorePartA = 0;
      let totalPartA = 0;
      let qScores: Record<string, number> = {};
      let qCorrectness: Record<string, 'correct' | 'incorrect' | 'unattempted'> = {};

      if (partAQuestionIds.length > 0) {
        const { data: correctOpts } = await supabase
          .from('exam_options')
          .select('id, question_id, is_correct, content_text')
          .in('question_id', partAQuestionIds)
          .eq('is_correct', true);

        // Build map: question_id -> correct options array
        const correctMap: Record<string, any[]> = {};
        (correctOpts || []).forEach(opt => {
          if (!correctMap[opt.question_id]) correctMap[opt.question_id] = [];
          correctMap[opt.question_id].push(opt);
        });

        const titleUpper = (engineData!.test.title || '').toUpperCase();
        const codeUpper = (engineData!.test.test_code || '').toUpperCase();
        const programNameUpper = (engineData!.test.exam_programs?.name || '').toUpperCase();
        const programFormatUpper = (engineData!.test.program_format || '').toUpperCase();

        const isNid = engineData!.isNid || titleUpper.includes('NID') || codeUpper.includes('NID') || programNameUpper.includes('NID');

        // Check UCEED first (excluding NID)
        const isUceed = !isNid && (
          titleUpper.includes('UCEED') || 
          programNameUpper.includes('UCEED') || 
          titleUpper.includes('B.DES') || 
          titleUpper.includes('BDES') || 
          programFormatUpper === 'BACHELORS'
        );

        // CEED check (only if not UCEED and not NID)
        const isCeed = !isNid && !isUceed && (
          titleUpper.includes('CEED') || 
          programNameUpper.includes('CEED') || 
          titleUpper.includes('M.DES') || 
          titleUpper.includes('MDES') || 
          programFormatUpper === 'MASTERS'
        );

        let natCorrect = 4, natWrong = 0;
        let msCorrect = 4, msWrong = -1;
        let mcqCorrect = 3;
        let mcqWrong = isCeed ? -0.5 : -0.71;

        let breakdown: Record<string, number> = { NAT: 0, MSQ: 0, MCQ: 0, NAT_A: 0, MSQ_A: 0, MCQ_A: 0, NAT_T: 0, MSQ_T: 0, MCQ_T: 0 };

        // Score each Part A question
        partAQuestionIds.forEach(qId => {
          const qType = engineData!.questions.find(q => q.id === qId)?.type;
          const resp = responsesToScore[qId];
          const correctOptsArr = correctMap[qId] || [];

          let maxMarks = 1;
          if (qType === 'NAT') maxMarks = natCorrect;
          else if (qType === 'MCQ') maxMarks = mcqCorrect;
          else if (qType === 'MSQ') maxMarks = msCorrect;

          totalPartA += maxMarks; // Accumulating total possible marks

          const selected = resp?.selectedOptions || [];
          const answered = resp?.answerText?.trim();
          const isAttempted = selected.length > 0 || !!answered;
          let earned = 0;
          let isCorrect = false;

          if (qType === 'NAT') {
            breakdown.NAT_T++;
            if (answered) {
              breakdown.NAT_A++;
              const correctText = correctOptsArr[0]?.content_text?.trim();
              isCorrect = !isNaN(parseFloat(answered)) && !isNaN(parseFloat(correctText))
                ? parseFloat(answered) === parseFloat(correctText)
                : answered.toLowerCase() === correctText?.toLowerCase();

              if (isCorrect) earned = natCorrect;
              else earned = natWrong;
            }
            breakdown.NAT += earned;
          } else if (qType === 'MCQ') {
            breakdown.MCQ_T++;
            if (selected.length > 0) {
              breakdown.MCQ_A++;
              isCorrect = selected.length === 1 && correctOptsArr.some(c => c.id === selected[0]);
              if (isCorrect) earned = mcqCorrect;
              else earned = mcqWrong;
            }
            breakdown.MCQ += earned;
          } else if (qType === 'MSQ') {
            breakdown.MSQ_T++;
            if (selected.length > 0) {
              breakdown.MSQ_A++;
              const correctIds = correctOptsArr.map(c => String(c.id).toLowerCase());
              const selectedIds = selected.map((s: any) => String(s).toLowerCase());
              const C = correctIds.length;
              const S = selectedIds.length;
              const W = selectedIds.filter((s: string) => !correctIds.includes(s)).length;

              if (W > 0) {
                earned = msWrong; // Wrong option selected -> negative marking (-1)
                isCorrect = false;
              } else {
                // No wrong options selected (W === 0)
                if (S === C && C > 0) {
                  earned = msCorrect; // All correct chosen -> full marks (+4)
                  isCorrect = true;
                } else if (S > 0) {
                  earned = S; // Partial marking -> +S marks (+1, +2, +3)
                  isCorrect = true; // Positive marks earned
                }
              }
            }
            breakdown.MSQ += earned;
          }

          qScores[qId] = earned;
          qCorrectness[qId] = isCorrect ? 'correct' : (isAttempted ? 'incorrect' : 'unattempted');
          scorePartA += earned;
        });

        // Floor to 2 decimals if needed, but since it's score, keeping precision to 2
        scorePartA = Math.round(scorePartA * 100) / 100;
        breakdown.NAT = Math.round(breakdown.NAT * 100) / 100;
        breakdown.MSQ = Math.round(breakdown.MSQ * 100) / 100;
        breakdown.MCQ = Math.round(breakdown.MCQ * 100) / 100;

        setScoreBreakdown(breakdown);
        setCorrectAnswersMap(correctMap);
      }

      // Also populate scores and correctness for Part B questions if evaluated
      (engineData.questions || []).filter(q => q.part === 'B').forEach(q => {
        const resp = responsesToScore[q.id];
        if (resp?.marksAwarded !== undefined && resp?.marksAwarded !== null) {
          const awarded = Number(resp.marksAwarded);
          qScores[q.id] = awarded;
          qCorrectness[q.id] = awarded > 0 ? 'correct' : 'incorrect';
        }
      });

      setQuestionScores(qScores);
      setQuestionCorrectness(qCorrectness);

      const partBAnswered = (engineData?.questions || [])
        .filter(q => q.part === 'B')
        .filter(q => responsesToScore[q.id]?.fileUrl || responsesToScore[q.id]?.answerText?.trim()).length;

      // Update attempt with scores and save final telemetry bulk responses
      if (!isReviewOnly) {
        // Bulk upsert all final responses with their full accumulated telemetry
        const finalResponsesUpsert = Object.keys(responsesToScore).map(qId => {
          const resp = responsesToScore[qId];
          return {
            attempt_id: currentAttemptId,
            question_id: qId,
            status: resp.status,
            selected_options: resp.selectedOptions,
            answer_text: resp.answerText || null,
            file_url: resp.fileUrl || null,
            time_spent: resp.timeSpent || 0,
            answer_changes: resp.answerChanges || 0,
            state_transitions: resp.stateTransitions || []
          };
        });

        if (finalResponsesUpsert.length > 0) {
          const { error: respUpsertErr } = await supabase
            .from('exam_responses')
            .upsert(finalResponsesUpsert, { onConflict: 'attempt_id,question_id' });
          if (respUpsertErr) console.error("Error saving final responses:", respUpsertErr);
        }

        const { error: updateError } = await supabase.from('exam_attempts').update({
          completed_at: new Date().toISOString(),
          status: 'completed',
          score_part_a: scorePartA,
          total_part_a: totalPartA,
          part_b_answered: partBAnswered,
        }).eq('id', currentAttemptId);

        if (updateError) throw updateError;

        // If this is a custom practice test and Part B was answered, trigger background AI evaluation
        if (engineData?.test?.is_custom_practice && partBAnswered > 0 && currentAttemptId) {
          try {
            supabase.functions.invoke('evaluate-part-b', {
              body: { attemptId: currentAttemptId }
            }).then(({ data, error }) => {
              if (error) console.warn('Background AI evaluation error:', error);
              else console.log('Background AI evaluation completed:', data);
            }).catch(e => console.warn('Background AI evaluation failed to trigger:', e));
          } catch (invokeErr) {
            console.warn('Could not trigger AI eval invocation:', invokeErr);
          }
        }
      }

    } catch (err) {
      console.error('Failed to finalize attempt:', err);
      // Still mark as completed even if scoring fails
      if (!isReviewOnly) {
        await supabase.from('exam_attempts').update({ completed_at: new Date().toISOString(), status: 'completed' }).eq('id', currentAttemptId);
      }
    }
  };

  const handleAutoSubmit = async (reason: string) => {
    setLoading(true);
    testEndTimeRef.current = null;
    sessionStorage.removeItem(`df_test_end_${id}`);
    await finalizeAttempt();
    setShowSubmitModal(false);
    setTimerRunning(false);
    setTestStep('submitted');
    setLoading(false);
    toast({ title: "Test Auto-Submitted", description: reason, variant: "destructive", duration: 8000 });
  };

  const confirmSubmit = async () => {
    setLoading(true);
    testEndTimeRef.current = null;
    sessionStorage.removeItem(`df_test_end_${id}`);
    await finalizeAttempt();
    setShowSubmitModal(false);
    setTimerRunning(false);
    setTestStep('submitted');
    setLoading(false);
    toast({ title: "Test Submitted successfully", description: "Your answers have been securely recorded." });
  };

  const openSubmitModal = (type: 'submit' | 'exit') => {
    setModalType(type);
    setShowSubmitModal(true);
  };

  const handleNavigateQuestion = (idx: number, skipChecks: boolean = false) => {
    const q = engineData!.questions[idx];
    const isPartBActive = checkIsPartBActive(timeLeft);

    if (!skipChecks && testStep !== 'review' && testStep !== 'submitted') {
      // Part Locking Logic: Only enforced when the exam has an active timed Part A lock (e.g. CEED/UCEED)
      if (engineData?.hasTimedPartALock) {
        // Cannot access Part B if Part A time is still running
        if (q.part === 'B' && !isPartBActive) {
          const minsLeftForA = Math.ceil((timeLeft - engineData.partA_TimeThreshold) / 60);
          setPartBWaitMins(minsLeftForA);
          setShowPartBLockedModal(true);
          return;
        }

        // Cannot access Part A if Part B has started
        if (q.part === 'A' && isPartBActive) {
          toast({ title: "Section Locked 🔒", description: "Time for Part A has ended. You cannot view or modify those answers.", variant: "destructive" });
          return;
        }
      }
    }

    // Telemetry navigation flush: save previous question response data immediately
    const prevQ = engineData?.questions[activeQuestionIndex];
    if (prevQ && attemptId) {
      const prevQId = prevQ.id;
      const prevResponse = responses[prevQId];
      if (prevResponse) {
        supabase.from('exam_responses').upsert({
          attempt_id: attemptId,
          question_id: prevQId,
          status: prevResponse.status,
          selected_options: prevResponse.selectedOptions,
          answer_text: prevResponse.answerText || null,
          file_url: prevResponse.fileUrl || null,
          time_spent: latestResponsesRef.current[prevQId]?.timeSpent ?? prevResponse.timeSpent ?? 0,
          answer_changes: prevResponse.answerChanges || 0,
          state_transitions: prevResponse.stateTransitions || []
        }, { onConflict: 'attempt_id,question_id' }).then(({ error }) => {
          if (error) console.error("Navigation telemetry save error:", error);
        });
      }
    }

    setActiveQuestionIndex(idx);
    const qId = q.id;
    setResponses(prev => {
      const current = prev[qId] || {
        status: 'unseen',
        selectedOptions: [],
        answerText: '',
        fileUrl: '',
        timeSpent: 0,
        answerChanges: 0,
        stateTransitions: []
      };
      
      const newStatus = current.status === 'unseen' ? 'visited' : current.status;
      const transitions = current.stateTransitions || [];
      const lastAction = transitions[transitions.length - 1]?.action;
      let newTransitions = transitions;
      if (lastAction !== newStatus) {
        newTransitions = [...transitions, { action: newStatus, timestamp: new Date().toISOString() }];
      }

      return {
        ...prev,
        [qId]: {
          ...current,
          status: newStatus,
          stateTransitions: newTransitions
        }
      };
    });
  };

  const updateResponse = (qId: string, updates: Partial<ResponseData>) => {
    const q = engineData!.questions.find(x => x.id === qId);
    if (!q) return;

    const isPartBActive = checkIsPartBActive(timeLeft);

    // Safety check, should be blocked by navigation anyway
    if (engineData?.hasTimedPartALock && q.part === 'A' && isPartBActive && testStep !== 'review') {
      toast({ title: "Section Locked", description: "Time for Part A has ended. You cannot modify answers.", variant: "destructive" });
      return;
    }

    setResponses(prev => {
      const current = prev[qId] || {
        status: 'unseen',
        selectedOptions: [],
        answerText: '',
        fileUrl: '',
        timeSpent: 0,
        answerChanges: 0,
        stateTransitions: []
      };
      
      let answerChanges = current.answerChanges || 0;
      if (updates.selectedOptions !== undefined || updates.answerText !== undefined || updates.fileUrl !== undefined) {
        answerChanges += 1;
      }
      
      const newResponse = { ...current, ...updates, answerChanges };

      // Log transition
      const transitions = newResponse.stateTransitions || [];
      const lastAction = transitions[transitions.length - 1]?.action;
      let newTransitions = transitions;
      if (lastAction !== newResponse.status) {
        newTransitions = [...transitions, { action: newResponse.status, timestamp: new Date().toISOString() }];
        newResponse.stateTransitions = newTransitions;
      }

      // Trigger background auto-save if we have an attempt ID
      if (attemptId) {
        syncResponseToDb(attemptId, qId);
      }

      // Determine new status if they interacted
      if (newResponse.selectedOptions.length > 0 || newResponse.answerText.trim() !== '' || newResponse.fileUrl !== '') {
        if (newResponse.status !== 'marked') {
          newResponse.status = 'answered';
        }
      } else {
        if (newResponse.status === 'answered') {
          newResponse.status = 'visited';
        }
      }

      return { ...prev, [qId]: newResponse };
    });
  };

  // Pause & Resume Handlers (Allowed maximum 2 resumes)
  const handlePauseExam = async () => {
    if (resumesUsed >= 2) {
      toast({
        title: "Pause Limit Reached",
        description: "You have used both of your allowed 2 resumes for this examination.",
        variant: "destructive"
      });
      return;
    }

    const now = Date.now();
    setIsPaused(true);
    setPausedAt(now);

    if (attemptId) {
      sessionStorage.setItem(`df_is_paused_${attemptId}`, 'true');
      sessionStorage.setItem(`df_paused_at_${attemptId}`, String(now));
      sessionStorage.setItem(`df_resumes_used_${attemptId}`, String(resumesUsed));
      sessionStorage.setItem(`df_total_paused_${attemptId}`, String(totalPausedSecs));

      try {
        await supabase.from('exam_attempts').update({
          paused_at: new Date(now).toISOString(),
          pause_count: resumesUsed,
          total_paused_seconds: totalPausedSecs
        }).eq('id', attemptId);
      } catch (e) {
        // Defensive fallback
      }
    }

    toast({
      title: "Exam Paused ⏸️",
      description: `Timer frozen. You have ${2 - resumesUsed} resume${2 - resumesUsed === 1 ? '' : 's'} remaining.`,
      duration: 4000
    });
  };

  const handleResumeExam = async () => {
    if (!isPaused) return;

    if (isSystemRecovery) {
      // Deployment & Reload Recovery: Does NOT consume student's 2 manual pause credits!
      setIsSystemRecovery(false);
      setIsPaused(false);
      setPausedAt(null);
      if (testEndTimeRef.current) {
        testEndTimeRef.current = Date.now() + (timeLeft * 1000);
        sessionStorage.setItem(`df_test_end_${id}`, String(testEndTimeRef.current));
      }
      setTimerRunning(true);
      toast({
        title: "Exam Resumed ▶",
        description: `Welcome back! Timer resumed at ${formatTime(timeLeft)}.`,
        duration: 4000
      });
      return;
    }

    const now = Date.now();
    const pauseStart = pausedAt || now;
    const pausedDurationMs = Math.max(0, now - pauseStart);
    const addedSecs = Math.round(pausedDurationMs / 1000);
    const newTotalPaused = totalPausedSecs + addedSecs;
    const newResumesUsed = resumesUsed + 1;

    // Adjust test end time by the paused duration so no time is lost
    if (testEndTimeRef.current) {
      testEndTimeRef.current += pausedDurationMs;
      sessionStorage.setItem(`df_test_end_${id}`, String(testEndTimeRef.current));
    }

    setIsPaused(false);
    setPausedAt(null);
    setTotalPausedSecs(newTotalPaused);
    setResumesUsed(newResumesUsed);

    if (attemptId) {
      sessionStorage.removeItem(`df_is_paused_${attemptId}`);
      sessionStorage.removeItem(`df_paused_at_${attemptId}`);
      sessionStorage.setItem(`df_resumes_used_${attemptId}`, String(newResumesUsed));
      sessionStorage.setItem(`df_total_paused_${attemptId}`, String(newTotalPaused));

      try {
        await supabase.from('exam_attempts').update({
          paused_at: null,
          pause_count: newResumesUsed,
          total_paused_seconds: newTotalPaused
        }).eq('id', attemptId);
      } catch (e) {
        // Defensive fallback
      }
    }

    toast({
      title: "Exam Resumed ▶",
      description: `Timer resumed. You have ${2 - newResumesUsed} resume${2 - newResumesUsed === 1 ? '' : 's'} remaining.`,
      duration: 4000
    });
  };

  const handleMarkForReview = () => {
    if (!engineData?.questions?.[activeQuestionIndex]) return;
    const qId = engineData.questions[activeQuestionIndex].id;
    let isNowMarked = false;

    setResponses(prev => {
      const current = prev[qId] || {
        status: 'unseen',
        selectedOptions: [],
        answerText: '',
        fileUrl: '',
        timeSpent: 0,
        answerChanges: 0,
        stateTransitions: []
      };

      const hasAnswer = (current.selectedOptions?.length || 0) > 0 || (current.answerText?.trim() || '') !== '' || (current.fileUrl || '') !== '';
      const isCurrentlyMarked = current.status === 'marked';
      isNowMarked = !isCurrentlyMarked;
      const nextStatus: QuestionStatus = isCurrentlyMarked
        ? (hasAnswer ? 'answered' : 'visited')
        : 'marked';

      const updated: ResponseData = {
        ...current,
        status: nextStatus,
        stateTransitions: [
          ...(current.stateTransitions || []),
          { action: nextStatus, timestamp: new Date().toISOString() }
        ]
      };

      latestResponsesRef.current[qId] = updated;

      if (attemptId) {
        try {
          const stored = { ...prev, [qId]: updated };
          localStorage.setItem(`df_attempt_${attemptId}`, JSON.stringify(stored));
        } catch (e) {}

        supabase.from('exam_responses').upsert({
          attempt_id: attemptId,
          question_id: qId,
          status: nextStatus,
          selected_options: updated.selectedOptions,
          answer_text: updated.answerText || null,
          file_url: updated.fileUrl || null,
          time_spent: latestResponsesRef.current[qId]?.timeSpent ?? updated.timeSpent ?? 0,
          answer_changes: updated.answerChanges || 0,
          state_transitions: updated.stateTransitions || []
        }, { onConflict: 'attempt_id,question_id' }).then(({ error }) => {
          if (error) console.warn("Mark save warning:", error);
        });
      }

      return {
        ...prev,
        [qId]: updated
      };
    });

    toast({
      title: isNowMarked ? 'Question Marked for Review 🔖' : 'Question Unmarked',
      description: isNowMarked
        ? 'Question highlighted in purple on the palette for review before submission.'
        : 'Question returned to standard status.',
      duration: 2500
    });

    // Auto-advance
    if (activeQuestionIndex < engineData.questions.length - 1) {
      handleNavigateQuestion(activeQuestionIndex + 1);
    }
  };

  const handleSaveAndNext = () => {
    if (!engineData?.questions?.[activeQuestionIndex]) return;
    const qId = engineData.questions[activeQuestionIndex].id;

    setResponses(prev => {
      const r = prev[qId];
      const hasAnswer = (r?.selectedOptions?.length || 0) > 0 || (r?.answerText?.trim() || '') !== '' || (r?.fileUrl || '') !== '';
      const nextStatus: QuestionStatus = r?.status === 'marked' ? 'marked' : (hasAnswer ? 'answered' : 'visited');
      const updated: ResponseData = {
        ...(r || {
          status: 'unseen',
          selectedOptions: [],
          answerText: '',
          fileUrl: '',
          timeSpent: 0,
          answerChanges: 0,
          stateTransitions: []
        }),
        status: nextStatus
      };
      latestResponsesRef.current[qId] = updated;

      if (attemptId) {
        supabase.from('exam_responses').upsert({
          attempt_id: attemptId,
          question_id: qId,
          status: nextStatus,
          selected_options: updated.selectedOptions,
          answer_text: updated.answerText || null,
          file_url: updated.fileUrl || null,
          time_spent: latestResponsesRef.current[qId]?.timeSpent ?? updated.timeSpent ?? 0,
          answer_changes: updated.answerChanges || 0,
          state_transitions: updated.stateTransitions || []
        }, { onConflict: 'attempt_id,question_id' }).then(({ error }) => {
          if (error) console.warn("Save response warning:", error);
        });
      }

      return {
        ...prev,
        [qId]: updated
      };
    });

    if (activeQuestionIndex < engineData.questions.length - 1) {
      handleNavigateQuestion(activeQuestionIndex + 1);
    }
  };

  // ---------- TASK 3: Real Supabase Storage Upload (Multi-File Support & Zero-Drop Image Compression) ----------
  const processSubmissionImage = (file: File): Promise<{ blob: Blob; dataUrl: string; ext: string }> => {
    return new Promise((resolve) => {
      // If not an image, resolve directly with raw file
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve({ blob: file, dataUrl: (reader.result as string) || '', ext: file.name.split('.').pop() || 'dat' });
        reader.onerror = () => resolve({ blob: file, dataUrl: '', ext: file.name.split('.').pop() || 'dat' });
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1400;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const fallbackDataUrl = (e.target?.result as string) || '';
            resolve({ blob: file, dataUrl: fallbackDataUrl, ext: 'jpg' });
            return;
          }

          // Solid white background to cleanly handle transparent PNGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Fast mobile canvas compression: 1400px @ 0.75 quality produces 150-250KB sketches
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          canvas.toBlob((blob) => {
            resolve({ blob: blob || file, dataUrl, ext: 'jpg' });
          }, 'image/jpeg', 0.75);
        };
        img.onerror = () => {
          resolve({ blob: file, dataUrl: (e.target?.result as string) || '', ext: file.name.split('.').pop() || 'jpg' });
        };
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => {
        resolve({ blob: file, dataUrl: '', ext: file.name.split('.').pop() || 'jpg' });
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadFiles = async (files: FileList | File[], qId: string) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const maxSizeMB = 15;
    const currentUrls = parseFileUrls(responses[qId]?.fileUrl);
    const newUrls = [...currentUrls];

    setIsUploadingFile(true);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast({ title: "File too large", description: `${file.name} exceeds ${maxSizeMB}MB limit.`, variant: "destructive" });
          continue;
        }

        setUploadProgressText(`Uploading ${i + 1} of ${fileArray.length}: ${file.name}...`);
        toast({ title: "Optimizing & Uploading...", description: `Preparing ${file.name}...` });

        try {
          const { blob, dataUrl, ext } = await processSubmissionImage(file);
          const uniqueId = crypto.randomUUID().slice(0, 8);
          const filePath = `submissions/${attemptId || 'draft'}/${qId}_${uniqueId}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('candidate-submissions')
            .upload(filePath, blob, { 
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: true 
            });

          if (uploadError) {
            console.warn('Storage upload error, using instant data URL fail-safe:', uploadError);
            if (dataUrl) {
              newUrls.push(dataUrl);
              toast({ title: "✅ Saved securely", description: `${file.name} attached.` });
            } else {
              throw uploadError;
            }
          } else {
            const { data: urlData } = supabase.storage
              .from('candidate-submissions')
              .getPublicUrl(filePath);

            newUrls.push(urlData.publicUrl);
            toast({ title: "✅ Uploaded successfully", description: `${file.name} saved.` });
          }
        } catch (err: any) {
          console.error('Upload processing failed:', err);
          try {
            const reader = new FileReader();
            const rawDataUrl = await new Promise<string>((res, rej) => {
              reader.onload = () => res(reader.result as string);
              reader.onerror = rej;
              reader.readAsDataURL(file);
            });
            newUrls.push(rawDataUrl);
            toast({ title: "✅ Saved locally", description: `${file.name} attached.` });
          } catch {
            toast({ title: "Upload failed", description: `Could not process ${file.name}. Please try again.`, variant: "destructive" });
          }
        }
      }

      updateResponse(qId, { fileUrl: JSON.stringify(newUrls) });
    } finally {
      setIsUploadingFile(false);
      setUploadProgressText('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files, qId);
      e.target.value = '';
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraModalOpen(true);
      setIsCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log('Video play error:', e));
      }
      setIsCameraReady(true);
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log('Video play error:', e));
        }
        setIsCameraReady(true);
      } catch (fallbackErr) {
        toast({
          title: "Camera Access Required",
          description: "Please enable camera access in your browser or select an image file instead.",
          variant: "destructive"
        });
        setIsCameraModalOpen(false);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraModalOpen(false);
    setIsCameraReady(false);
  };

  const captureSnapshot = async (qId: string) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Scale live camera snapshot down to max 1400px dimension
    const MAX_DIM = 1400;
    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;
    if (width > height && width > MAX_DIM) {
      height = Math.round((height * MAX_DIM) / width);
      width = MAX_DIM;
    } else if (height > MAX_DIM) {
      width = Math.round((width * MAX_DIM) / height);
      height = MAX_DIM;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopCamera();

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const snapshotFile = new File([blob], `sketch_camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await uploadFiles([snapshotFile], qId);
    }, 'image/jpeg', 0.75);
  };

  const handleClipboardButton = async (qId: string) => {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        const imageFiles: File[] = [];
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            imageFiles.push(new File([blob], `clipboard_${Date.now()}.${imageType.split('/')[1] || 'jpg'}`, { type: imageType }));
          }
        }
        if (imageFiles.length > 0) {
          toast({ title: "Pasting image...", description: "Uploading sketch from clipboard." });
          await uploadFiles(imageFiles, qId);
          return;
        }
      }
      toast({ title: "Clipboard Ready", description: "Press Ctrl+V (or Cmd+V on Mac) anywhere on this page to paste your copied image." });
    } catch (e) {
      toast({ title: "Clipboard Ready", description: "Press Ctrl+V (or Cmd+V on Mac) anywhere on this page to paste your copied image." });
    }
  };

  // Keyboard shortcut listener: paste images anytime on Part B questions
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (testStep !== 'test' || !engineData?.questions) return;
      const curQ = engineData.questions[activeQuestionIndex];
      if (!curQ || (curQ.type !== 'SUBJECTIVE' && curQ.question_type !== 'drawing_upload')) return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        toast({ title: "Pasting image...", description: "Uploading sketch from clipboard." });
        uploadFiles(imageFiles, curQ.id);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [testStep, activeQuestionIndex, engineData, attemptId]);

  const handleRemoveFile = (qId: string, indexToRemove: number) => {
    const currentUrls = parseFileUrls(responses[qId]?.fileUrl);
    const updatedUrls = currentUrls.filter((_, idx) => idx !== indexToRemove);
    updateResponse(qId, { fileUrl: updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : '' });
    toast({ title: "File Removed", description: "Attachment removed successfully." });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Build palette groups
  const renderPaletteGroups = () => {
    if (!engineData) return null;

    const groups: { [key: string]: { q: any, idx: number }[] } = {};
    engineData.questions.forEach((q, idx) => {
      let groupKey = engineData.isNid || !engineData.hasPartA
        ? `Questions - ${q.type}`
        : `Part ${q.part} - ${q.type}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push({ q, idx });
    });

    return Object.keys(groups).map(groupName => (
      <div key={groupName} className="mb-4 border-b border-black/5 pb-4 last:border-0">
        <div className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-3 bg-black/5 inline-block px-2 py-0.5 rounded-sm">{groupName}</div>
        <div className="grid grid-cols-5 gap-1.5">
          {groups[groupName].map(({ q, idx }) => {
            const status = responses[q.id]?.status || 'unseen';
            const isPartALocked = engineData.hasTimedPartALock && q.part === 'A' && checkIsPartBActive(timeLeft) && testStep !== 'review';
            const isMarked = status === 'marked';
            const hasAnswer = (responses[q.id]?.selectedOptions?.length || 0) > 0 || 
                              (responses[q.id]?.answerText?.trim() || '') !== '' || 
                              (responses[q.id]?.fileUrl || '') !== '';
            let bgClass = "bg-white border-black/20 text-foreground/70 hover:bg-black/5"; // unseen default

            if (isPartALocked) {
              bgClass = "bg-gray-100 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed";
            } else if (testStep === 'review') {
              if (q.part === 'B') {
                const awarded = responses[q.id]?.marksAwarded;
                if (awarded !== undefined && awarded !== null) {
                  bgClass = "bg-emerald-100 border-emerald-400 text-emerald-800 font-bold";
                } else if (hasAnswer) {
                  bgClass = "bg-amber-100 border-amber-300 text-amber-800 font-medium";
                } else {
                  bgClass = "bg-gray-100 border-gray-300 text-gray-500";
                }
              } else {
                const qState = questionCorrectness[q.id];
                if (qState === 'correct') {
                  bgClass = "bg-green-100 border-green-300 text-green-700 font-bold";
                } else if (qState === 'incorrect') {
                  bgClass = "bg-red-100 border-red-300 text-red-700 font-bold";
                } else {
                  bgClass = "bg-gray-100 border-gray-300 text-gray-500";
                }
              }
            } else {
              if (status === 'visited') bgClass = "bg-red-50 border-red-200 text-red-600";
              if (status === 'answered') bgClass = "bg-green-100 border-green-300 text-green-800 font-bold";
              if (isMarked) {
                if (hasAnswer) {
                  bgClass = "bg-purple-100 border-purple-400 text-purple-800 font-extrabold";
                } else {
                  bgClass = "bg-purple-50 border-purple-300 text-purple-700 font-bold";
                }
              }
            }

            const isActive = idx === activeQuestionIndex;

            return (
              <button
                key={q.id}
                onClick={() => handleNavigateQuestion(idx)}
                title={
                  isPartALocked 
                    ? "Part A is locked" 
                    : testStep === 'review'
                    ? q.part === 'B'
                      ? responses[q.id]?.marksAwarded !== undefined && responses[q.id]?.marksAwarded !== null
                        ? `Question ${idx + 1} (Part B): Allotted ${formatScore(responses[q.id].marksAwarded)}/${resolvePartBMaxMarks(q, engineData?.test)} Marks`
                        : hasAnswer
                        ? `Question ${idx + 1} (Part B): Submitted (Evaluation in Progress)`
                        : `Question ${idx + 1} (Part B): Unattempted (0 Marks)`
                      : `Question ${idx + 1}: ${questionCorrectness[q.id] === 'correct' ? 'Correct (+' + (questionScores[q.id] || 0) + ' Marks)' : questionCorrectness[q.id] === 'incorrect' ? 'Incorrect (' + (questionScores[q.id] || 0) + ' Marks)' : 'Unattempted (0 Marks)'}`
                    : isMarked && hasAnswer
                    ? `Question ${idx + 1}: Answered & Marked for Review`
                    : isMarked
                    ? `Question ${idx + 1}: Marked for Review`
                    : `Question ${idx + 1}`
                }
                className={`relative h-8 rounded-lg border flex flex-col items-center justify-center text-xs font-bold transition-all ${bgClass} ${isActive ? 'ring-2 ring-primary ring-offset-1 scale-105 shadow-sm' : ''}`}
              >
                {isPartALocked ? (
                  <Lock className="w-3 h-3 text-gray-400" />
                ) : (
                  <>
                    <span>{idx + 1}</span>
                    {testStep === 'review' && q.part === 'B' && responses[q.id]?.marksAwarded !== undefined && responses[q.id]?.marksAwarded !== null && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs" title={`Allotted: ${responses[q.id].marksAwarded} Marks`} />
                    )}
                    {testStep !== 'review' && isMarked && hasAnswer && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs" title="Answered & Marked for Review" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ));
  };


  if (loading || !engineData) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-6" />
        <h2 className="text-xl font-semibold text-[#262626] animate-pulse">Initializing Test Environment...</h2>
      </div>
    );
  }

  // -------------------------------------------------------------
  // INSTRUCTIONS SCREEN
  // -------------------------------------------------------------
  if (testStep === 'instructions') {
    return (
      <div className="h-screen overflow-hidden bg-[#F8F9FA] flex flex-col">
        <div className="h-16 bg-white border-b border-black/5 flex items-center px-6 shadow-sm shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/portal/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 w-px bg-black/10 mx-4" />
          <h1 className="font-bold text-[#262626] text-lg">{engineData.test.title} - Instructions</h1>
        </div>

        <div className="flex-1 overflow-y-auto flex justify-center items-start p-8 custom-scrollbar">
          <div className="bg-white max-w-4xl w-full rounded-2xl border border-black/5 shadow-sm p-10 mb-8">
            <h2 className="text-2xl font-bold mb-6">Please read carefully before starting</h2>

            <div className="prose max-w-none text-foreground/80 space-y-4 mb-10">
              <p>1. Total duration of this examination is <strong>{engineData.totalMins === 180 ? '3 hours (180 Minutes)' : engineData.totalMins === 90 ? '1.5 hours (90 Minutes)' : `${engineData.totalMins} Minutes`}</strong>.</p>
              <p>2. The clock will be set at the server. The countdown timer at the top right of screen will display the remaining time available for you to complete the examination.</p>
              <p>3. {engineData.hasTimedPartALock 
                ? "Do not switch tabs, minimize the browser, or open any other applications during Part A. Repeated tab switches (3) will automatically submit your exam. In Part B, tab switching is enabled for uploading your sketch files."
                : "You may switch windows or tabs to transfer and upload your sketches and answer sheets. Ensure all your work is uploaded and saved before the final countdown ends."}
              </p>
              <p>4. The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</p>

              <div className="grid grid-cols-2 gap-3 mt-4 max-w-lg bg-black/5 p-4 rounded-xl border border-black/10">
                <div className="flex items-center gap-3 text-sm font-semibold text-foreground/80"><div className="w-6 h-6 rounded flex items-center justify-center bg-green-100 border border-green-200 text-green-700">3</div> Answered</div>
                <div className="flex items-center gap-3 text-sm font-semibold text-foreground/80"><div className="w-6 h-6 rounded flex items-center justify-center bg-red-50 border border-red-200 text-red-600">2</div> Not Answered</div>
                <div className="flex items-center gap-3 text-sm font-semibold text-foreground/80"><div className="w-6 h-6 rounded flex items-center justify-center bg-purple-100 border border-purple-200 text-purple-700">4</div> Marked</div>
                <div className="flex items-center gap-3 text-sm font-semibold text-foreground/80"><div className="w-6 h-6 rounded flex items-center justify-center border border-black/20 bg-white">1</div> Not Visited</div>
              </div>
            </div>

            {/* Structure & Marking Scheme Card */}
            {(() => {
              const titleUp = (engineData.test.title || '').toUpperCase();
              const codeUp = (engineData.test.test_code || '').toUpperCase();
              const progUp = (engineData.test.exam_programs?.name || '').toUpperCase();
              const isNid = engineData.isNid || titleUp.includes('NID') || codeUp.includes('NID') || progUp.includes('NID');
              const isUceed = !isNid && (titleUp.includes('UCEED') || progUp.includes('UCEED') || titleUp.includes('B.DES') || titleUp.includes('BDES'));
              const isCeed = !isNid && !isUceed && (titleUp.includes('CEED') || progUp.includes('CEED') || titleUp.includes('M.DES') || titleUp.includes('MDES'));
              
              if (isNid) {
                return (
                  <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-black/10 mb-8">
                    <h3 className="font-bold text-sm text-[#262626] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" /> NID DAT Prelims Practice Format
                    </h3>
                    <div className="bg-white p-5 rounded-xl border border-black/10 shadow-sm space-y-3 text-xs text-foreground/80 leading-relaxed">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5">
                        <span className="font-bold text-[#262626]">Paper Structure:</span>
                        <span className="font-semibold text-primary">Pen-and-paper Practice Simulation</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-black/5">
                        <span className="font-bold text-[#262626]">Section Locking:</span>
                        <span className="font-semibold text-green-700">None (All questions accessible throughout the test)</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-black/5">
                        <span className="font-bold text-[#262626]">Answering Method:</span>
                        <span className="font-medium text-foreground/70">Solve and sketch on plain paper, take clear photos, and attach them using the upload / camera tool</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#262626]">Evaluation:</span>
                        <span className="font-medium text-foreground/70">Rubric-based manual evaluation by mentors with comprehensive feedback</span>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-black/10 mb-8">
                  <h3 className="font-bold text-sm text-[#262626] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" /> Official Exam Structure & Marking Scheme ({isUceed ? 'UCEED 2026' : isCeed ? 'CEED' : 'Standard Exam'})
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse bg-white rounded-xl overflow-hidden border border-black/10 shadow-sm">
                      <thead>
                        <tr className="bg-primary/5 text-[#262626]">
                          <th className="p-3 border-b border-black/10 font-bold">Section</th>
                          <th className="p-3 border-b border-black/10 font-bold">Question Type</th>
                          <th className="p-3 border-b border-black/10 font-bold text-center">Questions</th>
                          <th className="p-3 border-b border-black/10 font-bold">Correct Answer</th>
                          <th className="p-3 border-b border-black/10 font-bold">Wrong Answer</th>
                          <th className="p-3 border-b border-black/10 font-bold text-center">Section Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 text-foreground/80 font-medium">
                        <tr>
                          <td className="p-3 font-bold text-[#262626]">Section 1</td>
                          <td className="p-3">NAT (Numerical Answer Type)</td>
                          <td className="p-3 text-center font-bold">{isUceed ? '14' : isCeed ? '8' : '-'}</td>
                          <td className="p-3 font-bold text-green-700">+4</td>
                          <td className="p-3 font-bold text-gray-500">0 <span className="text-[10px] font-normal text-foreground/50">(No negative)</span></td>
                          <td className="p-3 text-center font-bold text-primary">{isUceed ? '56' : isCeed ? '32' : '-'}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#262626]">Section 2</td>
                          <td className="p-3">MSQ (Multiple Select Question)</td>
                          <td className="p-3 text-center font-bold">{isUceed ? '15' : isCeed ? '10' : '-'}</td>
                          <td className="p-3 font-bold text-green-700">+4 <span className="text-[10px] font-normal text-foreground/60">(Partial: +3, +2, +1)</span></td>
                          <td className="p-3 font-bold text-red-600">-1</td>
                          <td className="p-3 text-center font-bold text-primary">{isUceed ? '60' : isCeed ? '40' : '-'}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#262626]">Section 3</td>
                          <td className="p-3">MCQ (Multiple Choice Question)</td>
                          <td className="p-3 text-center font-bold">{isUceed ? '28' : isCeed ? '26' : '-'}</td>
                          <td className="p-3 font-bold text-green-700">+3</td>
                          <td className="p-3 font-bold text-red-600">{isCeed ? '-0.5' : '-0.71'}</td>
                          <td className="p-3 text-center font-bold text-primary">{isUceed ? '84' : isCeed ? '78' : '-'}</td>
                        </tr>
                        <tr className="bg-primary/5 font-bold text-[#262626]">
                          <td className="p-3" colSpan={2}>Part-A Total</td>
                          <td className="p-3 text-center text-primary">{isUceed ? '57' : isCeed ? '44' : '-'}</td>
                          <td className="p-3" colSpan={2}></td>
                          <td className="p-3 text-center text-primary text-sm font-black">{isUceed ? '200 Marks' : isCeed ? '150 Marks' : '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-4 mb-8">
              <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-1" />
              <p className="text-sm font-medium text-primary">I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test.</p>
            </div>

            <div className="flex justify-center border-t border-black/10 pt-8">
              <Button onClick={startTest} className="bg-primary text-white hover:bg-primary/90 px-12 py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-1">
                I am ready to begin
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PART B INSTRUCTIONS SCREEN
  // -------------------------------------------------------------
  if (testStep === 'part-b-instructions') {
    return (
      <div className="h-screen overflow-hidden bg-[#F8F9FA] flex flex-col">
        {/* Top Bar - timer keeps running */}
        <div className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm shrink-0">
          <h1 className="font-bold text-[#262626]">{engineData.test.title} - Part B Subjective</h1>
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-xs text-foreground/50 font-medium">Remaining Time</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold font-mono border transition-colors ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex justify-center items-start p-8 custom-scrollbar">
          <div className="bg-white max-w-3xl w-full rounded-2xl border border-orange-200 shadow-sm p-10 mb-8 mt-10">
            <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mb-6 mx-auto">
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-center text-[#262626]">Time's Up for Part A!</h2>

            <div className="prose max-w-none text-foreground/80 space-y-4 mb-10 text-center">
              <p className="text-lg">The mandatory duration for Part A has concluded. All your answers and marked questions for Part A have been securely auto-saved. <strong>You will no longer be able to modify any Part A responses.</strong></p>
              <p className="text-lg">The timer is still running. You must now proceed to Part B (Subjective section) and upload your sketches or media files.</p>
            </div>

            <div className="flex justify-center border-t border-black/10 pt-8">
              <Button onClick={startPartB} className="bg-orange-600 text-white hover:bg-orange-700 px-12 py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-orange-600/20 transition-all hover:-translate-y-1">
                Start Part B Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 10-MINUTE POST-EXAM SOLUTION UPLOAD BUFFER SCREEN
  // -------------------------------------------------------------
  if (testStep === 'upload_buffer') {
    const partBQuestions = (engineData?.questions || []).filter(q => q.part === 'B');

    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        {/* Sticky Header with 10-minute Countdown Banner */}
        <div className="bg-white border-b border-black/10 px-6 py-4 sticky top-0 z-20 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Buffer Window
                </span>
                <span className="text-xs text-foreground/50">
                  {engineData?.isNid ? '• Solution Upload Window' : '• Part A Locked'}
                </span>
              </div>
              <h1 className="text-lg font-bold text-[#262626]">Upload Sketches & Solutions</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm ${
              uploadBufferTimeLeft < 120 
                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(uploadBufferTimeLeft)} remaining</span>
            </div>

            <Button
              onClick={() => confirmSubmit()}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-sm h-10 px-5 rounded-xl shadow-xs gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
              <span>Finalize & Submit All</span>
            </Button>
          </div>
        </div>

        {/* Informational Guidance Notice */}
        <div className="max-w-5xl w-full mx-auto px-6 pt-6">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong>Main exam duration has concluded.</strong> {engineData?.isNid 
                ? "Use this 10-minute window to take photos or upload your design sketches and written concepts question-wise below. Photos are automatically compressed for high-speed transmission."
                : "All objective answers (Part A) are saved and locked. Use this 10-minute window to take photos or upload your design sketches and written concepts question-wise below. Photos are automatically compressed for high-speed transmission."}
            </div>
          </div>
        </div>

        {/* Question-Wise Upload Cards */}
        <div className="max-w-5xl w-full mx-auto px-6 py-6 space-y-6 flex-1">
          {partBQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/10 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#262626]">No subjective questions to upload</h3>
              <p className="text-xs text-foreground/50 mt-1 max-w-md mx-auto mb-6">
                All questions in this test were objective and have been submitted. You can finalize your attempt.
              </p>
              <Button onClick={() => confirmSubmit()} className="bg-primary text-white font-bold px-6">
                Complete Attempt
              </Button>
            </div>
          ) : (
            partBQuestions.map((q, qIndex) => {
              const currentResp = responses[q.id];
              const fileList = parseFileUrls(currentResp?.fileUrl);

              return (
                <div key={q.id} className="bg-white rounded-2xl border border-black/10 p-6 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                        {engineData?.isNid ? `Task ${qIndex + 1}` : `Part B • Question ${qIndex + 1}`}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#262626] mt-2">
                        {q.title || `Subjective Task ${qIndex + 1}`}
                      </h3>
                    </div>
                    <span className="text-xs font-black text-foreground/50 shrink-0">
                      {q.marks || 15} Marks
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div 
                    className="prose prose-sm max-w-none text-[#262626]/80 text-xs sm:text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.content_text || '') }}
                  />

                  {/* Upload Controls */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                      Attach Sketches / Solution Sheets ({fileList.length} attached)
                    </label>

                    {/* Previews Grid */}
                    {fileList.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {fileList.map((url, imgIdx) => (
                          <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden border border-black/10 bg-black/5 group">
                            <img src={url} alt={`Sketch ${imgIdx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = fileList.filter((_, i) => i !== imgIdx);
                                updateResponse(q.id, { fileUrl: JSON.stringify(updated) });
                              }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs"
                              title="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={isUploadingFile}
                          onChange={(e) => handleFileUpload(e, q.id)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingFile}
                          asChild
                          className="h-9 text-xs font-semibold gap-1.5 border-black/15 hover:bg-black/5"
                        >
                          <span>
                            {isUploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-primary" />}
                            <span>Select Images</span>
                          </span>
                        </Button>
                      </label>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingFile}
                        onClick={() => {
                          setActiveQuestionIndex(engineData!.questions.findIndex(item => item.id === q.id));
                          startCamera();
                        }}
                        className="h-9 text-xs font-semibold gap-1.5 border-black/15 hover:bg-black/5"
                      >
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        <span>Take Photo</span>
                      </Button>

                      {isUploadingFile && uploadProgressText && (
                        <span className="text-xs text-foreground/50 animate-pulse">
                          {uploadProgressText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Written Explanation / Notes */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1.5">
                      Design Notes & Concept Explanation (Optional)
                    </label>
                    <textarea
                      value={currentResp?.answerText || ''}
                      onChange={(e) => updateResponse(q.id, { answerText: e.target.value })}
                      placeholder="Explain your design thinking, user persona, problem breakdown, or material choices..."
                      rows={3}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background/50 resize-y"
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Bottom Complete Bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-black/10 p-5 shadow-xs">
            <div>
              <p className="text-xs font-bold text-[#262626]">Finished uploading your solutions?</p>
              <p className="text-[11px] text-foreground/50">You can submit early or let the timer finalize automatically.</p>
            </div>
            <Button
              onClick={() => confirmSubmit()}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-sm h-10 px-6 rounded-xl shadow-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit All Solutions"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUBMITTED SCREEN
  // -------------------------------------------------------------
  if (testStep === 'submitted') {
    return (
      <div className="min-h-screen w-full bg-[#F8F9FA] flex flex-col items-center justify-center p-6 py-12">
        <div className="bg-white max-w-3xl w-full rounded-2xl border border-black/5 shadow-sm p-10 text-center">
          <FileCheck2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[#262626] mb-2">Test Submitted!</h2>
          <p className="text-foreground/60 mb-8 font-medium">
            {engineData.isNid || !engineData.hasPartA
              ? "Your attempt has been recorded. Your sketches and solutions have been securely submitted."
              : "Your attempt has been recorded. Here is your preliminary Part A breakdown."}
          </p>

          {engineData.hasPartA && scoreBreakdown && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col items-center justify-center relative">
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1">NAT Marks</span>
                <span className="text-2xl font-bold text-primary">{scoreBreakdown.NAT}</span>
                <span className="text-[10px] font-bold text-foreground/40 mt-1">Attempted: {scoreBreakdown.NAT_A} | Unattempted: {scoreBreakdown.NAT_T - scoreBreakdown.NAT_A}</span>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col items-center justify-center relative">
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1">MSQ Marks</span>
                <span className="text-2xl font-bold text-primary">{scoreBreakdown.MSQ}</span>
                <span className="text-[10px] font-bold text-foreground/40 mt-1">Attempted: {scoreBreakdown.MSQ_A} | Unattempted: {scoreBreakdown.MSQ_T - scoreBreakdown.MSQ_A}</span>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col items-center justify-center relative">
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1">MCQ Marks</span>
                <span className="text-2xl font-bold text-primary">{scoreBreakdown.MCQ}</span>
                <span className="text-[10px] font-bold text-foreground/40 mt-1">Attempted: {scoreBreakdown.MCQ_A} | Unattempted: {scoreBreakdown.MCQ_T - scoreBreakdown.MCQ_A}</span>
              </div>
              <div className="bg-black border border-black/20 p-4 rounded-xl flex flex-col items-center justify-center relative">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Total Part A</span>
                <span className="text-2xl font-bold text-white">{(scoreBreakdown.NAT + scoreBreakdown.MSQ + scoreBreakdown.MCQ).toFixed(2)}</span>
                <span className="text-[10px] font-bold text-white/40 mt-1">Attempted: {scoreBreakdown.NAT_A + scoreBreakdown.MSQ_A + scoreBreakdown.MCQ_A} | Unattempted: {(scoreBreakdown.NAT_T + scoreBreakdown.MSQ_T + scoreBreakdown.MCQ_T) - (scoreBreakdown.NAT_A + scoreBreakdown.MSQ_A + scoreBreakdown.MCQ_A)}</span>
              </div>
            </div>
          )}

          {(attemptDetails?.part_b_evaluation_status === 'completed' || (attemptDetails?.score_part_b !== null && attemptDetails?.score_part_b !== undefined)) ? (
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl mb-8 flex flex-col items-center justify-center gap-3">
               <h3 className="text-xl font-bold text-green-800">
                 {engineData.isNid ? "Subjective Evaluation Complete" : "Part B Evaluation Complete"}
               </h3>
               <div className="flex items-center gap-6 mt-2">
                 <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-green-700/60 block mb-1">
                      {engineData.isNid ? "Subjective Score" : "Part B Score"}
                    </span>
                    <span className="text-3xl font-black text-green-700">{attemptDetails.score_part_b}</span>
                 </div>
                 <div className="h-10 w-px bg-green-200"></div>
                 <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-green-700/60 block mb-1">Total Grand Score</span>
                    <span className="text-3xl font-black text-green-700">{attemptDetails.total_score}</span>
                 </div>
               </div>
            </div>
          ) : engineData.hasPartB ? (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-8 flex items-center justify-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
              <p className="text-sm font-bold text-orange-800">
                {engineData.isNid 
                  ? "Your submission will be evaluated manually by our mentors and your scorecard with feedback will be shared soon." 
                  : "Part B will be evaluated manually and the combined scorecard will be shared later."}
              </p>
            </div>
          ) : null}

          <div className="flex gap-4 max-w-lg mx-auto">
            <Button variant="outline" onClick={() => { setActiveQuestionIndex(0); setTestStep('review'); }} className="w-full font-bold border-primary text-primary hover:bg-primary/5 h-12 shadow-sm">
              Review Questions & Allotted Marks
            </Button>
            <Button onClick={() => setLocation('/portal/dashboard')} className="w-full h-12 font-bold shadow-sm">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN TEST ENGINE
  // -------------------------------------------------------------
  const currentQ = engineData.questions[activeQuestionIndex];
  const currentOptions = currentQ ? engineData.options[currentQ.id] || [] : [];
  const currentResponse = currentQ ? responses[currentQ.id] : null;
  const totalQuestions = engineData.questions.length;

  return (
    <div className="h-screen overflow-hidden bg-[#F8F9FA] flex flex-col select-none relative">
      {!isOnline && (
        <div className="absolute top-0 left-0 w-full z-50 bg-red-500 text-white p-2 flex justify-center items-center gap-2 font-bold shadow-md animate-in slide-in-from-top-full">
          <WifiOff className="w-5 h-5" />
          You are offline. Auto-save paused. Do not refresh or exit.
        </div>
      )}
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => testStep === 'review' ? setTestStep('submitted') : openSubmitModal('exit')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 w-px bg-black/10 mx-2" />
          <h1 className="font-bold text-[#262626] flex items-center gap-2">
            {engineData.test.test_code && (
              <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wide">
                {engineData.test.test_code}
              </span>
            )}
            <span>{engineData.test.title}</span>
            {testStep === 'review' && <span className="text-primary ml-2 border border-primary/20 bg-primary/5 px-2 py-1 rounded text-sm">Review Mode</span>}
          </h1>
        </div>
        {testStep !== 'review' ? (
          <div className="flex items-center gap-4 md:gap-6">
            {engineData?.hasTimedPartALock ? (
              checkIsPartBActive(timeLeft) ? (
                <div className="hidden sm:flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                  <UploadCloud className="w-3.5 h-3.5" /> Part B: Tab switching enabled for upload
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" /> Part A: Tab switching monitored
                </div>
              )
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                <UploadCloud className="w-3.5 h-3.5" /> Sketch upload enabled
              </div>
            )}
            {warningsCount > 0 && engineData?.hasTimedPartALock && timeLeft > engineData.partA_TimeThreshold && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-md text-xs font-bold border border-red-200 animate-pulse">
                <AlertTriangle className="w-4 h-4" /> Warnings: {warningsCount}/{MAX_WARNINGS}
              </div>
            )}
            <div className="flex flex-col text-right">
              <span className="text-xs text-foreground/50 font-medium">Remaining Time</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold font-mono border transition-colors ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseExam}
              disabled={resumesUsed >= 2 || isPaused}
              className="rounded-full px-4 h-9 font-bold border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title={resumesUsed >= 2 ? "All 2 resumes used" : `Pause examination (${2 - resumesUsed} resume${2 - resumesUsed === 1 ? '' : 's'} remaining)`}
            >
              <PauseCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Pause</span>
              <span className="text-[10px] bg-amber-200/80 px-1.5 py-0.2 rounded-full font-mono">{2 - resumesUsed}</span>
            </Button>
            <Button variant="destructive" onClick={() => openSubmitModal('submit')} className="rounded-full px-6 font-bold shadow-sm">
              Submit Test
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setTestStep('submitted')} className="rounded-full px-6 font-bold shadow-sm border-black/20">
            Exit Review
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex p-6 gap-6 max-w-[1600px] mx-auto w-full min-h-0">
        {/* Left Side: Question Area */}
        {currentQ && currentResponse ? (
          <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm px-8 pt-6 pb-4 flex flex-col min-h-0 relative">
            {/* Pause Screen Overlay */}
            {isPaused && (
              <div className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-black/10 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className={`w-20 h-20 rounded-full ${isSystemRecovery ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} border flex items-center justify-center mb-6 shadow-sm`}>
                  {isSystemRecovery ? (
                    <ShieldCheck className="w-10 h-10 text-emerald-600" />
                  ) : (
                    <PauseCircle className="w-10 h-10 text-amber-600" />
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isSystemRecovery ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'} border mb-3`}>
                  {isSystemRecovery ? "Exam Session Restored 🛡️" : "Examination Temporarily Paused"}
                </span>
                <h2 className="text-2xl font-black text-[#262626] mb-2">
                  {isSystemRecovery ? "Timer Protected & Questions Ready" : "Timer Frozen & Questions Hidden"}
                </h2>
                <p className="text-sm text-foreground/60 max-w-md mb-6 leading-relaxed">
                  {isSystemRecovery
                    ? `Your examination was safely protected during page reload or server updates. All your answers are intact, and your timer was frozen at ${formatTime(timeLeft)} with zero seconds lost.`
                    : `Your countdown timer is paused at ${formatTime(timeLeft)}. Anti-malpractice monitoring is suspended while paused.`}
                </p>

                {isSystemRecovery ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 max-w-sm w-full mb-6 text-left space-y-1">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero-Loss Auto-Recovery Active</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-normal">
                      This recovery pause does not deduct from your 2 allowed manual resumes ({2 - resumesUsed} manual resumes still available).
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#f8fafc] border border-black/10 rounded-xl p-4 max-w-sm w-full mb-6 text-left space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-foreground/60">Resumes Allowed:</span>
                      <span className="text-[#262626]">Maximum 2</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-foreground/60">Resumes Used:</span>
                      <span className="text-amber-700">{resumesUsed} of 2</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-extrabold border-t border-black/5 pt-2">
                      <span className="text-foreground/70">Remaining Resumes:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${2 - resumesUsed > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {2 - resumesUsed} Remaining
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleResumeExam}
                  className="bg-primary hover:bg-primary/90 text-white font-extrabold px-10 py-6 text-base rounded-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Resume Examination
                </Button>
              </div>
            )}
            <div className="flex justify-between items-center mb-4 border-b border-black/5 pb-4 shrink-0">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-bold">
                  {engineData.isNid ? "Design Aptitude" : `Part ${currentQ.part}`}
                </span>
                <span className="bg-black/5 text-foreground/70 px-3 py-1 rounded text-sm font-bold">{currentQ.type}</span>
                {currentQ.pyq_tag && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm font-bold">{currentQ.pyq_tag}</span>}
                {currentQ.marks && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded text-sm font-bold">
                    {currentQ.marks} {Number(currentQ.marks) === 1 ? 'Mark' : 'Marks'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {testStep === 'review' && currentQ.part === 'A' && questionScores[currentQ.id] !== undefined && (
                  <div className={`text-xs font-bold border px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-2 ${
                    questionCorrectness[currentQ.id] === 'correct' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : questionCorrectness[currentQ.id] === 'incorrect' 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-black/5 text-foreground/70 border-black/10'
                  }`}>
                    <span>
                      {questionCorrectness[currentQ.id] === 'correct' ? '✓ Correct' : questionCorrectness[currentQ.id] === 'incorrect' ? '✗ Incorrect' : '⚪ Unattempted'}
                    </span>
                    <span className="font-extrabold">
                      ({questionScores[currentQ.id] > 0 ? '+' : ''}{questionScores[currentQ.id]} Marks)
                    </span>
                  </div>
                )}
                {testStep === 'review' && currentQ.part === 'B' && (
                  <div className={`text-xs font-bold border px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-2 ${
                    currentResponse?.marksAwarded !== undefined && currentResponse?.marksAwarded !== null
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : (currentResponse?.fileUrl || currentResponse?.answerText?.trim())
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-black/5 text-foreground/70 border-black/10'
                  }`}>
                    {currentResponse?.marksAwarded !== undefined && currentResponse?.marksAwarded !== null ? (
                      <>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Allotted Marks:</span>
                        </span>
                        <span className="font-extrabold text-sm text-emerald-700 bg-white/90 px-2 py-0.5 rounded border border-emerald-200">
                          {formatScore(currentResponse.marksAwarded)} / {resolvePartBMaxMarks(currentQ, engineData?.test)}
                        </span>
                      </>
                    ) : (currentResponse?.fileUrl || currentResponse?.answerText?.trim()) ? (
                      <>
                        <span>⏳ Evaluation Pending</span>
                        <span className="font-medium opacity-75">(Max: {resolvePartBMaxMarks(currentQ, engineData?.test)} Marks)</span>
                      </>
                    ) : (
                      <>
                        <span>⚪ Unattempted</span>
                        <span className="font-medium opacity-75">(0 / {resolvePartBMaxMarks(currentQ, engineData?.test)} Marks)</span>
                      </>
                    )}
                  </div>
                )}
                <div className="text-sm font-bold text-foreground/50">
                  Question {activeQuestionIndex + 1} of {totalQuestions}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-2">
              <div className="text-lg text-[#262626] font-medium leading-relaxed mb-4 flex items-start w-full overflow-hidden">
                <span className="font-bold mr-2 shrink-0">Q{activeQuestionIndex + 1}.</span>
                <div className="break-words whitespace-normal w-full min-w-0 [&_p]:mb-4 last:[&_p]:mb-0 [&_p:empty]:h-6 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml((currentQ.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>')) }}></div>
              </div>

              {currentQ.media_url && (
                <div className="mb-6 rounded-lg overflow-hidden border border-black/10 inline-block max-w-full">
                  <img src={currentQ.media_url} alt="Question Media" className="max-h-[300px] object-contain bg-background/50" />
                </div>
              )}

              {/* Dynamic Inputs */}
              <div className="space-y-3 mt-2 mb-2">
                {currentQ.type === 'NAT' ? (
                  <div className="w-full max-w-md">
                    <input
                      type="number"
                      placeholder="Enter numerical answer..."
                      className="w-full h-12 border border-black/20 rounded-md px-4 text-lg bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm font-bold disabled:bg-gray-50 disabled:text-black"
                      value={currentResponse.answerText}
                      disabled={testStep === 'review'}
                      onChange={(e) => updateResponse(currentQ.id, { answerText: e.target.value })}
                    />
                    {testStep === 'review' && correctAnswersMap[currentQ.id] && (
                      <div className={`mt-3 text-sm font-bold p-3.5 rounded-xl border flex flex-col gap-1 ${
                        questionCorrectness[currentQ.id] === 'correct'
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : questionCorrectness[currentQ.id] === 'incorrect'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span>Your Answer: <strong className="underline">{currentResponse.answerText?.trim() || '(No answer entered)'}</strong></span>
                          <span className={`text-xs px-2 py-0.5 rounded font-extrabold uppercase ${
                            questionCorrectness[currentQ.id] === 'correct' ? 'bg-green-200 text-green-900' : questionCorrectness[currentQ.id] === 'incorrect' ? 'bg-red-200 text-red-900' : 'bg-gray-200 text-gray-800'
                          }`}>
                            {questionCorrectness[currentQ.id] === 'correct' ? '✓ Correct' : questionCorrectness[currentQ.id] === 'incorrect' ? '✗ Incorrect' : '⚪ Unattempted'}
                          </span>
                        </div>
                        <div className="text-green-700 font-extrabold mt-0.5">
                          Correct Answer: {cleanPlainText(correctAnswersMap[currentQ.id][0]?.content_text)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : currentQ.type === 'SUBJECTIVE' ? (
                  <div className="w-full max-w-3xl space-y-4">
                    {/* Header banner showing Part B status */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-green-800">
                        <UploadCloud className="w-4 h-4 text-green-600" />
                        <span>{engineData.isNid ? "Answer / Sketch Upload Zone (Tab switching permitted for photo uploads)" : "Part B Answer Upload Zone (Tab switching is permitted for photo uploads)"}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-green-200/60 text-green-900 px-2 py-0.5 rounded">
                        Multi-page enabled
                      </span>
                    </div>

                    {/* Uploaded files gallery */}
                    {parseFileUrls(currentResponse.fileUrl).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {parseFileUrls(currentResponse.fileUrl).map((url, imgIdx) => {
                          const isImg = url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.startsWith('http') || url.startsWith('data:image/');
                          const displayName = url.startsWith('data:image/') ? `Page ${imgIdx + 1} (Direct)` : (url.split('/').pop()?.split('?')[0] || `Page ${imgIdx + 1}`);

                          return (
                            <div key={imgIdx} className="border border-primary/30 rounded-xl bg-white p-3 relative group flex flex-col items-center justify-between min-h-[160px] overflow-hidden shadow-sm hover:border-primary/60 transition-all">
                              <div className="w-full flex items-center justify-between z-10">
                                <span className="bg-primary/10 text-primary font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-primary" />
                                  Page {imgIdx + 1}
                                </span>
                                {testStep !== 'review' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(currentQ.id, imgIdx)}
                                    className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-colors"
                                    title="Delete page"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              <div className="my-auto py-2 flex items-center justify-center w-full max-h-[100px] overflow-hidden">
                                {isImg ? (
                                  <img 
                                    src={url} 
                                    alt={`Submission Page ${imgIdx + 1}`} 
                                    className="max-h-24 max-w-full object-contain rounded cursor-pointer hover:scale-105 transition-transform" 
                                    onClick={() => window.open(url, '_blank')} 
                                  />
                                ) : (
                                  <FileCheck2 className="w-10 h-10 text-primary" />
                                )}
                              </div>
                              <div className="w-full flex items-center justify-between border-t border-black/5 pt-1.5 mt-1 text-[11px]">
                                <p className="font-medium text-foreground/70 truncate max-w-[120px]">{displayName}</p>
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-primary hover:underline font-semibold"
                                >
                                  View Full ↗
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* File Upload Dropzone / Quick Actions */}
                    {testStep !== 'review' && (
                      <div className="space-y-3">
                        {isUploadingFile ? (
                          <div className="border-2 border-primary/40 rounded-xl bg-primary/5 p-8 flex flex-col items-center justify-center text-center animate-pulse">
                            <Loader2 className="w-9 h-9 animate-spin text-primary mb-3" />
                            <p className="font-bold text-sm text-[#262626]">{uploadProgressText || 'Compressing & uploading drawing...'}</p>
                            <p className="text-xs text-foreground/60 mt-1">Zero-loss optimization in progress. Your work will appear momentarily.</p>
                          </div>
                        ) : (
                          <>
                            {/* Action Buttons Suite */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {/* 1. Browse Files / Gallery */}
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, currentQ.id)}
                                />
                                <div className="h-11 px-4 rounded-xl border border-primary/20 bg-white hover:bg-primary/5 hover:border-primary/40 text-primary font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all">
                                  <UploadCloud className="w-4 h-4" />
                                  <span>📁 Browse Files / Gallery</span>
                                </div>
                              </label>

                              {/* 2. Take Photo / Live Camera */}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={startCamera}
                                className="h-11 rounded-xl border-primary/20 bg-white hover:bg-primary/5 hover:border-primary/40 text-primary font-bold text-xs gap-2 shadow-xs"
                              >
                                <Camera className="w-4 h-4" />
                                <span>📸 Snap with Camera</span>
                              </Button>

                              {/* 3. Paste from Clipboard */}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleClipboardButton(currentQ.id)}
                                className="h-11 rounded-xl border-primary/20 bg-white hover:bg-primary/5 hover:border-primary/40 text-primary font-bold text-xs gap-2 shadow-xs"
                              >
                                <Clipboard className="w-4 h-4" />
                                <span>📋 Paste (Ctrl+V)</span>
                              </Button>
                            </div>

                            {/* Dropzone Box */}
                            <div
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFile(true); }}
                              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFile(false); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDraggingFile(false);
                                if (e.dataTransfer.files?.length) {
                                  uploadFiles(e.dataTransfer.files, currentQ.id);
                                }
                              }}
                              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                                isDraggingFile 
                                  ? 'border-primary bg-primary/10 scale-[1.01]' 
                                  : 'border-primary/30 bg-background/50 hover:bg-primary/5'
                              }`}
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*,.pdf';
                                input.multiple = true;
                                input.onchange = (e) => {
                                  const target = e.target as HTMLInputElement;
                                  if (target.files) uploadFiles(target.files, currentQ.id);
                                };
                                input.click();
                              }}
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                <UploadCloud className="w-5 h-5" />
                              </div>
                              <p className="font-bold text-sm text-[#262626]">
                                {parseFileUrls(currentResponse.fileUrl).length > 0 ? '+ Add Another Page / Sketch Photo' : 'Drag & Drop Sketches Here or Click to Upload'}
                              </p>
                              <p className="text-xs text-foreground/60 mt-1 max-w-sm">
                                You can upload JPG, PNG, PDF sketches, hold your drawing to the camera, or copy & paste directly with <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-black/10 text-[10px] text-foreground font-semibold">Ctrl+V</kbd> / <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-black/10 text-[10px] text-foreground font-semibold">Cmd+V</kbd>.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {testStep === 'review' && currentQ.part === 'B' && (
                      <div className="mt-6 p-6 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50 border border-emerald-200/90 rounded-2xl shadow-sm space-y-5">
                        {/* Header with Allotted Marks */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-emerald-600" />
                              <h4 className="font-bold text-[#262626] text-base">
                                Part B Subjective Evaluation
                              </h4>
                            </div>
                            <p className="text-xs text-foreground/60 mt-0.5">
                              Scored against official NID design rubrics and mentor review criteria.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={`px-4 py-1.5 rounded-xl font-black text-sm shadow-xs flex items-center gap-2 ${
                              currentResponse?.marksAwarded !== undefined && currentResponse?.marksAwarded !== null
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}>
                              <span>Allotted Marks:</span>
                              <span className="text-base font-extrabold">
                                {currentResponse?.marksAwarded !== undefined && currentResponse?.marksAwarded !== null
                                  ? `${formatScore(currentResponse.marksAwarded)} / ${resolvePartBMaxMarks(currentQ, engineData?.test)}`
                                  : `Pending / ${resolvePartBMaxMarks(currentQ, engineData?.test)}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rubric Criteria Breakdown */}
                        {currentResponse?.rubricMarks && typeof currentResponse.rubricMarks === 'object' && Object.keys(currentResponse.rubricMarks).length > 0 && (
                          <div>
                            <span className="font-bold uppercase tracking-wider text-[11px] text-foreground/60 block mb-2.5">
                              5-Axis Rubric Breakdown
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                              {[
                                { key: 'critical_thinking', label: 'Critical Thinking' },
                                { key: 'ideation', label: 'Ideation' },
                                { key: 'storytelling', label: 'Storytelling' },
                                { key: 'conceptualisation', label: 'Conceptualisation' },
                                { key: 'representation', label: 'Representation' },
                              ].map(criterion => {
                                const score = currentResponse.rubricMarks?.[criterion.key];
                                const partBMax = resolvePartBMaxMarks(currentQ, engineData?.test);
                                const maxPerCrit = (partBMax / 5).toFixed(1).replace(/\.0$/, '');
                                return (
                                  <div key={criterion.key} className="bg-white border border-emerald-200/80 p-3 rounded-xl text-center shadow-2xs">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-1 truncate" title={criterion.label}>
                                      {criterion.label}
                                    </p>
                                    <p className="text-base font-black text-emerald-700">
                                      {score !== undefined && score !== null && score !== '' ? score : '-'}
                                      {maxPerCrit && <span className="text-[10px] font-normal text-foreground/50 ml-0.5">/{maxPerCrit}</span>}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Mentor Feedback & Qualitative Comments */}
                        {currentResponse?.mentorComments && (
                          <div className="bg-white border border-emerald-200/80 p-4 rounded-xl shadow-2xs">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-900/80 block mb-1">
                              Mentor Feedback & Critique
                            </span>
                            <p className="text-sm text-[#262626] leading-relaxed">
                              {currentResponse.mentorComments}
                            </p>
                          </div>
                        )}

                        {/* Practical Studio Improvement Drills */}
                        {currentResponse?.mentorImprovements && (
                          <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-xl shadow-2xs">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900/80 block mb-1">
                              Recommended Studio Drill & Improvements
                            </span>
                            <p className="text-sm text-amber-950 leading-relaxed">
                              {currentResponse.mentorImprovements}
                            </p>
                          </div>
                        )}

                        {/* Video Review Link */}
                        {currentResponse?.mentorLoomLink && (
                          <div className="bg-white border border-emerald-200/80 p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
                            <div>
                              <span className="font-bold text-[11px] uppercase tracking-wider text-foreground/60 block">Video Review</span>
                              <p className="text-xs text-foreground/70">Watch mentor walkthrough and sketch breakdown.</p>
                            </div>
                            <a
                              href={currentResponse.mentorLoomLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-bold text-xs inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg"
                            >
                              Watch Recording ↗
                            </a>
                          </div>
                        )}

                        {/* Pending notice if not evaluated yet */}
                        {(currentResponse?.marksAwarded === undefined || currentResponse?.marksAwarded === null) && !currentResponse?.mentorComments && (
                          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                            <p className="text-xs font-bold text-amber-900">
                              Your sketch submission for this question is currently under review by our design mentors. Allotted marks and qualitative feedback will appear here as soon as evaluation is completed!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // MCQ and MSQ
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentOptions.map((opt, idx) => {
                      const isSelected = currentResponse.selectedOptions.includes(opt.id);
                      const isCorrectAnswer = testStep === 'review' && correctAnswersMap[currentQ.id]?.some(c => c.id === opt.id);
                      const isSelectedButWrong = testStep === 'review' && isSelected && !isCorrectAnswer;

                      let containerClass = isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-black/10 hover:bg-black/5';
                      let letterClass = isSelected ? 'border-primary bg-primary text-white' : 'border-black/20 text-foreground/50';

                      if (testStep === 'review') {
                        if (isCorrectAnswer) {
                          containerClass = 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500';
                          letterClass = 'border-green-500 bg-green-500 text-white';
                        } else if (isSelectedButWrong) {
                          containerClass = 'border-red-500 bg-red-50';
                          letterClass = 'border-red-500 bg-red-500 text-white';
                        } else {
                          containerClass = 'border-black/10 opacity-50';
                        }
                      }

                      const hasMedia = Boolean(opt.media_url);

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (testStep === 'review') return;
                            if (currentQ.type === 'MCQ') {
                              updateResponse(currentQ.id, { selectedOptions: [opt.id] });
                            } else {
                              // MSQ logic
                              const newOpts = isSelected
                                ? currentResponse.selectedOptions.filter(id => id !== opt.id)
                                : [...currentResponse.selectedOptions, opt.id];
                              updateResponse(currentQ.id, { selectedOptions: newOpts });
                            }
                          }}
                          className={`p-3.5 border rounded-xl cursor-pointer transition-all ${containerClass} ${hasMedia ? 'flex flex-col gap-2.5' : 'flex items-center gap-4'}`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${letterClass}`}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            {opt.content_text && (
                              <span className={`text-sm font-semibold flex-1 ${testStep === 'review' && (isCorrectAnswer || isSelectedButWrong) ? 'text-[#262626]' : (isSelected ? 'font-bold text-primary' : 'text-[#262626]')}`}>
                                {cleanPlainText(opt.content_text)}
                              </span>
                            )}
                            {testStep === 'review' && (
                              <>
                                {isCorrectAnswer && isSelected && (
                                  <span className="ml-auto text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded shrink-0">
                                    ✓ Your Choice (Correct)
                                  </span>
                                )}
                                {isCorrectAnswer && !isSelected && (
                                  <span className="ml-auto text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded shrink-0">
                                    ✓ Correct Option
                                  </span>
                                )}
                                {isSelectedButWrong && (
                                  <span className="ml-auto text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded shrink-0">
                                    ✗ Your Choice (Incorrect)
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {opt.media_url && (
                            <div className="w-full flex items-center justify-center p-2.5 bg-neutral-50/70 rounded-xl border border-black/5 overflow-hidden">
                              <img
                                src={opt.media_url}
                                alt={`Option ${String.fromCharCode(65 + idx)}`}
                                className="max-h-[380px] max-w-[420px] w-auto h-auto object-contain rounded-lg shadow-2xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="pt-4 border-t border-black/5 flex justify-between items-center shrink-0 mt-auto">
              <Button variant="outline" onClick={() => handleNavigateQuestion(Math.max(0, activeQuestionIndex - 1))} disabled={activeQuestionIndex === 0} className="shadow-sm font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <div className="flex gap-3">
                {testStep !== 'review' && (
                  <Button
                    variant="outline"
                    onClick={handleMarkForReview}
                    className={`font-bold shadow-sm transition-all ${
                      currentResponse?.status === 'marked'
                        ? 'border-purple-400 text-purple-800 bg-purple-100 hover:bg-purple-200'
                        : 'border-purple-200 text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 mr-1.5 ${currentResponse?.status === 'marked' ? 'fill-purple-700' : ''}`} />
                    {currentResponse?.status === 'marked' ? 'Unmark Question' : 'Mark for Review & Next'}
                  </Button>
                )}
                <Button onClick={testStep === 'review' ? () => handleNavigateQuestion(Math.min(totalQuestions - 1, activeQuestionIndex + 1)) : handleSaveAndNext} disabled={activeQuestionIndex === totalQuestions - 1} className="bg-primary text-white hover:bg-primary/90 px-8 shadow-md font-bold">
                  {testStep === 'review' ? 'Next' : 'Save Response & Next'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm p-10 flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-foreground/30 mb-4" />
            <p className="text-foreground/50 font-bold">Loading question...</p>
          </div>
        )}

        {/* Right Side: Navigation Palette */}
        <div className="w-[340px] bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col shrink-0">
          <h3 className="font-bold text-[#262626] mb-4 text-center">Question Palette</h3>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {renderPaletteGroups()}
          </div>

          <div className="mt-auto pt-4 border-t border-black/5 shrink-0">
            {testStep === 'review' ? (
              <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-green-100 border border-green-300 text-green-700">✓</div> Correct (+Marks)</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-red-100 border border-red-300 text-red-700">✕</div> Incorrect</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70"><div className="relative w-4 h-4 rounded flex items-center justify-center bg-emerald-100 border border-emerald-400 text-emerald-800 font-bold">B<span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" /></div> Part B Evaluated</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-amber-100 border border-amber-300 text-amber-800">⏳</div> Part B Pending</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 col-span-2"><div className="w-4 h-4 rounded flex items-center justify-center bg-gray-100 border border-gray-300 text-gray-500">○</div> Unattempted</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-green-100 border border-green-300 text-green-700">✓</div> Answered</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-red-50 border border-red-200 text-red-600">✕</div> Not Answered</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-purple-50 border border-purple-200 text-purple-700">★</div> Marked</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70"><div className="relative w-4 h-4 rounded flex items-center justify-center bg-purple-100 border border-purple-400 text-purple-800 font-bold">★<span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" /></div> Ans & Marked</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 col-span-2"><div className="w-4 h-4 rounded flex items-center justify-center border border-black/20 bg-white">○</div> Not Visited</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit/Exit Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#262626]">
              {modalType === 'submit' ? 'Submit Test?' : 'Leave Test?'}
            </DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium pt-2">
              {modalType === 'submit'
                ? "Are you sure you want to submit your test? You will not be able to change your answers after submission."
                : "You are attempting to leave the test engine. You can submit now, or pause and resume later."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-3 my-4">
            <AlertCircle className="w-5 h-5 text-primary shrink-0" />
            <div className="text-sm font-bold text-primary">
              Answered: {Object.values(responses).filter(r => r.status === 'answered' || (r.status === 'marked' && (r.selectedOptions?.length || r.answerText || r.fileUrl))).length} / {totalQuestions}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 sm:space-x-0 mt-2">
            <Button variant="outline" onClick={() => setShowSubmitModal(false)} className="w-full font-bold">
              Cancel
            </Button>
            {modalType === 'exit' && (
              <Button
                variant="outline"
                onClick={async () => {
                  if (resumesUsed < 2) {
                    await handlePauseExam();
                  }
                  setLocation('/portal/dashboard');
                }}
                className="w-full font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                {resumesUsed < 2 ? `Pause & Resume Later (${2 - resumesUsed} left)` : 'Exit to Dashboard'}
              </Button>
            )}
            <Button onClick={confirmSubmit} className="w-full font-bold bg-primary text-white hover:bg-primary/90">
              {modalType === 'submit' ? 'Yes, Submit' : 'Submit & Exit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Camera Snapshot Modal */}
      <Dialog open={isCameraModalOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-xl max-w-[95vw] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Camera className="w-5 h-5 text-primary" />
              Snap Drawing with Camera
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/60">
              Hold your physical drawing sheet up to the camera. Make sure lighting is clear and your sheet is framed nicely inside the box.
            </DialogDescription>
          </DialogHeader>

          <div className="relative bg-black rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center my-2 shadow-inner border border-black/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isCameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <span className="text-xs font-semibold">Starting camera...</span>
              </div>
            )}
            <div className="absolute inset-4 border-2 border-dashed border-white/40 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="text-white/80 text-[11px] bg-black/50 px-2.5 py-1 rounded backdrop-blur-xs">
                Align Drawing Inside Frame
              </span>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={stopCamera}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!isCameraReady}
              onClick={() => currentQ && captureSnapshot(currentQ.id)}
              className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold px-5"
            >
              <Camera className="w-4 h-4" />
              Capture & Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Part B Locked Modal */}
      <Dialog open={showPartBLockedModal} onOpenChange={setShowPartBLockedModal}>
        <DialogContent className="sm:max-w-md border-orange-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#262626] flex items-center gap-2">
              <span className="text-2xl">🔒</span> Section Locked
            </DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium pt-2 text-base">
              You cannot access Part B (Subjective) questions until the mandatory time for Part A has elapsed.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 my-2">
            <Clock className="w-6 h-6 text-orange-600 shrink-0" />
            <div className="text-sm font-bold text-orange-800">
              Please wait {partBWaitMins} more minutes before this section unlocks.
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button onClick={() => setShowPartBLockedModal(false)} className="w-full font-bold bg-orange-600 text-white hover:bg-orange-700">
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
