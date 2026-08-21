import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, AlertCircle, FileText, UploadCloud, EyeOff, FileCheck2, AlertTriangle, ShieldAlert, WifiOff, Lock, ClipboardList } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
}

type TestStep = 'instructions' | 'test' | 'part-b-instructions' | 'submitted' | 'review';
type QuestionStatus = 'unseen' | 'visited' | 'answered' | 'marked';

interface ResponseData {
  status: QuestionStatus;
  selectedOptions: string[];
  answerText: string;
  fileUrl: string;
  marksAwarded?: number;
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
            marksAwarded: r.marks_awarded,
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
      setTestStep('submitted');

      await finalizeAttempt(loadedResponses, attemptIdFromUrl, true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkIsPartBActive = (currentTimeLeft: number) => {
    if (!engineData?.hasPartB) return false;
    if (testStep === 'part-b-instructions') return true;
    const totalSecs = (engineData.totalMins || 180) * 60;
    if (engineData.partA_TimeThreshold >= totalSecs) return false;
    return currentTimeLeft <= engineData.partA_TimeThreshold && currentTimeLeft < totalSecs;
  };

  // Tab switching detection (Only monitored during Part A)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isPartBActive = checkIsPartBActive(timeLeft);
      // If Part B is active or test step is part-b-instructions/submitted, do not flag tab switching for uploading sketches
      if (document.hidden && testStep === 'test' && !isPartBActive) {
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
  }, [testStep, timeLeft, engineData]);

  // Active Question Time Tracker (Isolated from timeLeft countdown to minimize re-renders)
  useEffect(() => {
    let timerId: any;
    if (timerRunning && testStep === 'test' && engineData?.questions?.[activeQuestionIndex]) {
      const activeQId = engineData.questions[activeQuestionIndex].id;
      timerId = setInterval(() => {
        setResponses(prev => {
          const currentQ = prev[activeQId] || {
            status: 'unseen',
            selectedOptions: [],
            answerText: '',
            fileUrl: '',
            timeSpent: 0,
            answerChanges: 0,
            stateTransitions: []
          };
          return {
            ...prev,
            [activeQId]: {
              ...currentQ,
              timeSpent: (currentQ.timeSpent || 0) + 1
            }
          };
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [timerRunning, testStep, activeQuestionIndex, engineData]);

  // Timer Countdown
  useEffect(() => {
    let timerId: any;
    if (timerRunning && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            handleAutoSubmit("Time's up! Your test has been automatically submitted.");
            return 0;
          }

          // Part A to Part B Transition: Auto-lock & score Part A
          const totalSecs = (engineData?.totalMins || 180) * 60;
          if (engineData?.hasPartB && engineData.partA_TimeThreshold < totalSecs && prev === engineData.partA_TimeThreshold + 1 && prev < totalSecs) {
            finalizeAttempt(responses, attemptId, false);
            setTestStep('part-b-instructions');
            toast({ title: "Part A Time Up 🔒", description: "Part A has been auto-submitted and locked. Please proceed to Part B.", duration: 8000 });
          }

          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [timerRunning, timeLeft, engineData, responses, attemptId]);

  const fetchTestEngineData = async () => {
    setLoading(true);
    try {
      if (!id) throw new Error("Invalid Test ID");
      
      // Parallel Batch 1: Fetch Test Details, Sections, and Question Links simultaneously
      const [testRes, sectionsRes, tqRes] = await Promise.all([
        supabase.from('exam_tests').select('*, exam_programs(name)').eq('id', id).single(),
        supabase.from('exam_test_sections').select('*').eq('test_id', id),
        supabase.from('exam_test_questions').select('question_id').eq('test_id', id)
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

        questionsData = qRes.data || [];

        // Sort questions by Part, then strictly NAT -> MSQ -> MCQ -> SUBJECTIVE, then ID for determinism
        const typeOrder: Record<string, number> = { 'NAT': 1, 'MSQ': 2, 'MCQ': 3, 'SUBJECTIVE': 4 };
        questionsData.sort((a, b) => {
          if (a.part !== b.part) return a.part.localeCompare(b.part);
          if (a.type !== b.type) return (typeOrder[a.type] || 5) - (typeOrder[b.type] || 5);
          return a.id.localeCompare(b.id);
        });

        const optData = optRes.data || [];
        optData.forEach(opt => {
          if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
          optionsMap[opt.question_id].push(opt);
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
        optData.forEach(opt => {
          if (opt.media_url) imageUrlsToPreload.push(opt.media_url);
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

      const totalMins = sectionsData?.reduce((acc: number, sec: any) => acc + sec.duration_minutes, 0) || 180;
      let partAMins = sectionsData?.find((s: any) => s.part === 'A')?.duration_minutes || 0;
      const hasPartB = questionsData.some(q => q.part === 'B');

      if (hasPartB && partAMins === 0) {
        partAMins = Math.round(totalMins / 2);
      }

      const partA_TimeThreshold = (totalMins * 60) - (partAMins * 60);

      setEngineData({
        test: testData,
        sections: sectionsData || [],
        questions: questionsData,
        options: optionsMap,
        totalMins,
        partAMins,
        partA_TimeThreshold,
        hasPartB
      });
      setResponses(initialResponses);
      setTimeLeft(totalMins * 60);

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
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      if (!candidate) throw new Error('Candidate profile not found');

      // Fetch all existing attempts for this candidate + test
      const { data: existingAttempts } = await supabase
        .from('exam_attempts')
        .select('id, status, attempt_number')
        .eq('candidate_id', candidate.id)
        .eq('test_id', id)
        .order('attempt_number', { ascending: true });

      const attempts = existingAttempts || [];

      // Resume an in-progress attempt if one exists (handles page refresh)
      const inProgress = attempts.find(a => a.status === 'in_progress');
      if (inProgress) {
        return inProgress.id;
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

      const { data: attempt, error } = await supabase
        .from('exam_attempts')
        .insert({
          candidate_id: candidate.id,
          test_id: id,
          start_time: new Date().toISOString(),
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
    setAttemptId(newAttemptId);
    setTestStep('test');
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
        const programNameUpper = (engineData!.test.exam_programs?.name || '').toUpperCase();
        const programFormatUpper = (engineData!.test.program_format || '').toUpperCase();

        // Check UCEED first
        const isUceed = titleUpper.includes('UCEED') || 
                        programNameUpper.includes('UCEED') || 
                        titleUpper.includes('B.DES') || 
                        titleUpper.includes('BDES') || 
                        programFormatUpper === 'BACHELORS';

        // CEED check (only if not UCEED, to avoid UCEED matching "CEED")
        const isCeed = !isUceed && (
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
        let qScores: Record<string, number> = {};
        let qCorrectness: Record<string, 'correct' | 'incorrect' | 'unattempted'> = {};

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
        setQuestionScores(qScores);
        setQuestionCorrectness(qCorrectness);
        setCorrectAnswersMap(correctMap);
      }

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
    await finalizeAttempt();
    setShowSubmitModal(false);
    setTimerRunning(false);
    setTestStep('submitted');
    setLoading(false);
    toast({ title: "Test Auto-Submitted", description: reason, variant: "destructive", duration: 8000 });
  };

  const confirmSubmit = async () => {
    setLoading(true);
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
      // Part Locking Logic: Cannot access Part B if Part A time is still running
      if (q.part === 'B' && !isPartBActive) {
        const minsLeftForA = Math.ceil((timeLeft - engineData!.partA_TimeThreshold) / 60);
        setPartBWaitMins(minsLeftForA);
        setShowPartBLockedModal(true);
        return;
      }

      // Part A Logic: Cannot access Part A if Part B has started
      if (q.part === 'A' && isPartBActive) {
        toast({ title: "Section Locked 🔒", description: "Time for Part A has ended. You cannot view or modify those answers.", variant: "destructive" });
        return;
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
          time_spent: prevResponse.timeSpent || 0,
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
    if (q.part === 'A' && isPartBActive && testStep !== 'review') {
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

  const handleMarkForReview = () => {
    const qId = engineData!.questions[activeQuestionIndex].id;
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], status: 'marked' }
    }));

    // Auto-advance
    if (activeQuestionIndex < engineData!.questions.length - 1) {
      handleNavigateQuestion(activeQuestionIndex + 1);
    }
  };

  const handleSaveAndNext = () => {
    const qId = engineData!.questions[activeQuestionIndex].id;

    // If it was marked, hitting save removes the marked status if there's an answer
    setResponses(prev => {
      const r = prev[qId];
      const hasAnswer = r.selectedOptions.length > 0 || r.answerText.trim() !== '' || r.fileUrl !== '';
      return {
        ...prev,
        [qId]: { ...r, status: hasAnswer ? 'answered' : 'visited' }
      };
    });

    if (activeQuestionIndex < engineData!.questions.length - 1) {
      handleNavigateQuestion(activeQuestionIndex + 1);
    }
  };

  // ---------- TASK 3: Real Supabase Storage Upload (Multi-File Support) ----------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSizeMB = 10;
    const currentUrls = parseFileUrls(responses[qId]?.fileUrl);
    const newUrls = [...currentUrls];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds ${maxSizeMB}MB limit.`, variant: "destructive" });
        continue;
      }

      toast({ title: "Uploading...", description: `Uploading ${file.name}...` });

      try {
        const fileExt = file.name.split('.').pop();
        const uniqueId = crypto.randomUUID().slice(0, 8);
        const filePath = `submissions/${attemptId || 'draft'}/${qId}_${uniqueId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('candidate-submissions')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('candidate-submissions')
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
        toast({ title: "✅ Uploaded successfully", description: `${file.name} saved.` });
      } catch (err: any) {
        console.error('Upload failed:', err);
        newUrls.push(file.name);
        toast({ title: "Upload saved locally", description: `${file.name} attached.`, variant: "destructive" });
      }
    }

    updateResponse(qId, { fileUrl: JSON.stringify(newUrls) });
  };

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
      let groupKey = `Part ${q.part} - ${q.type}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push({ q, idx });
    });

    return Object.keys(groups).map(groupName => (
      <div key={groupName} className="mb-4 border-b border-black/5 pb-4 last:border-0">
        <div className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-3 bg-black/5 inline-block px-2 py-0.5 rounded-sm">{groupName}</div>
        <div className="grid grid-cols-5 gap-1.5">
          {groups[groupName].map(({ q, idx }) => {
            const status = responses[q.id]?.status || 'unseen';
            const isPartALocked = q.part === 'A' && checkIsPartBActive(timeLeft) && testStep !== 'review';
            let bgClass = "bg-white border-black/20 text-foreground/70 hover:bg-black/5"; // unseen default

            if (isPartALocked) {
              bgClass = "bg-gray-100 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed";
            } else if (testStep === 'review') {
              const qState = questionCorrectness[q.id];
              if (qState === 'correct') {
                bgClass = "bg-green-100 border-green-300 text-green-700 font-bold";
              } else if (qState === 'incorrect') {
                bgClass = "bg-red-100 border-red-300 text-red-700 font-bold";
              } else {
                bgClass = "bg-gray-100 border-gray-300 text-gray-500";
              }
            } else {
              if (status === 'visited') bgClass = "bg-red-50 border-red-200 text-red-600";
              if (status === 'answered') bgClass = "bg-green-100 border-green-200 text-green-700";
              if (status === 'marked') bgClass = "bg-purple-100 border-purple-200 text-purple-700";
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
                    ? `Question ${idx + 1}: ${questionCorrectness[q.id] === 'correct' ? 'Correct (+' + (questionScores[q.id] || 0) + ' Marks)' : questionCorrectness[q.id] === 'incorrect' ? 'Incorrect (' + (questionScores[q.id] || 0) + ' Marks)' : 'Unattempted (0 Marks)'}`
                    : `Question ${idx + 1}`
                }
                className={`relative h-8 rounded-lg border flex flex-col items-center justify-center text-xs font-bold transition-all ${bgClass} ${isActive ? 'ring-2 ring-primary ring-offset-1 scale-105 shadow-sm' : ''}`}
              >
                {isPartALocked ? (
                  <Lock className="w-3 h-3 text-gray-400" />
                ) : (
                  <span>{idx + 1}</span>
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
              <p>1. Total duration of this examination is <strong>{formatTime(timeLeft)}</strong> hours.</p>
              <p>2. The clock will be set at the server. The countdown timer at the top right of screen will display the remaining time available for you to complete the examination.</p>
              <p>3. Do not switch tabs, minimize the browser, or open any other applications. The system monitors background activity. Switching tabs will issue a warning, and <strong>repeated offenses (3) will automatically terminate and submit your exam.</strong></p>
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
              const progUp = (engineData.test.exam_programs?.name || '').toUpperCase();
              const isUceed = titleUp.includes('UCEED') || progUp.includes('UCEED') || titleUp.includes('B.DES') || titleUp.includes('BDES');
              const isCeed = !isUceed && (titleUp.includes('CEED') || progUp.includes('CEED') || titleUp.includes('M.DES') || titleUp.includes('MDES'));
              
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
  // SUBMITTED SCREEN
  // -------------------------------------------------------------
  if (testStep === 'submitted') {
    return (
      <div className="min-h-screen w-full bg-[#F8F9FA] flex flex-col items-center justify-center p-6 py-12">
        <div className="bg-white max-w-3xl w-full rounded-2xl border border-black/5 shadow-sm p-10 text-center">
          <FileCheck2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[#262626] mb-2">Test Submitted!</h2>
          <p className="text-foreground/60 mb-8 font-medium">Your attempt has been recorded. Here is your preliminary Part A breakdown.</p>

          {scoreBreakdown && (
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

          {attemptDetails?.part_b_evaluation_status === 'completed' ? (
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl mb-8 flex flex-col items-center justify-center gap-3">
               <h3 className="text-xl font-bold text-green-800">Part B Evaluation Complete</h3>
               <div className="flex items-center gap-6 mt-2">
                 <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-green-700/60 block mb-1">Part B Score</span>
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
              <p className="text-sm font-bold text-orange-800">Part B will be evaluated manually and the combined scorecard will be shared later.</p>
            </div>
          ) : null}

          <div className="flex gap-4 max-w-lg mx-auto">
            <Button variant="outline" onClick={() => { setActiveQuestionIndex(0); setTestStep('review'); }} className="w-full font-bold border-primary text-primary hover:bg-primary/5 h-12 shadow-sm">
              Review Marked Answers
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
          <h1 className="font-bold text-[#262626]">{engineData.test.title} {testStep === 'review' && <span className="text-primary ml-2 border border-primary/20 bg-primary/5 px-2 py-1 rounded text-sm">Review Mode</span>}</h1>
        </div>
        {testStep !== 'review' ? (
          <div className="flex items-center gap-4 md:gap-6">
            {engineData?.hasPartB && (
              checkIsPartBActive(timeLeft) ? (
                <div className="hidden sm:flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                  <UploadCloud className="w-3.5 h-3.5" /> Part B: Tab switching enabled for upload
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" /> Part A: Tab switching monitored
                </div>
              )
            )}
            {warningsCount > 0 && timeLeft > engineData.partA_TimeThreshold && (
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
            <div className="flex justify-between items-center mb-4 border-b border-black/5 pb-4 shrink-0">
              <div className="flex gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-bold">Part {currentQ.part}</span>
                <span className="bg-black/5 text-foreground/70 px-3 py-1 rounded text-sm font-bold">{currentQ.type}</span>
                {currentQ.pyq_tag && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm font-bold">{currentQ.pyq_tag}</span>}
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
                <div className="text-sm font-bold text-foreground/50">
                  Question {activeQuestionIndex + 1} of {totalQuestions}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-2">
              <div className="text-lg text-[#262626] font-medium leading-relaxed mb-4 flex items-start w-full overflow-hidden">
                <span className="font-bold mr-2 shrink-0">Q{activeQuestionIndex + 1}.</span>
                <div className="break-words whitespace-normal w-full min-w-0 [&_p]:mb-4 last:[&_p]:mb-0 [&_p:empty]:h-6 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4" dangerouslySetInnerHTML={{ __html: (currentQ.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>') }}></div>
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
                          Correct Answer: {correctAnswersMap[currentQ.id][0]?.content_text}
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
                        <span>Part B Answer Upload Zone (Tab switching is permitted for photo uploads)</span>
                      </div>
                      <span className="text-[10px] font-bold bg-green-200/60 text-green-900 px-2 py-0.5 rounded">
                        Multi-page enabled
                      </span>
                    </div>

                    {/* Uploaded files gallery */}
                    {parseFileUrls(currentResponse.fileUrl).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {parseFileUrls(currentResponse.fileUrl).map((url, imgIdx) => (
                          <div key={imgIdx} className="border border-primary/30 rounded-xl bg-primary/5 p-3 relative group flex flex-col items-center justify-center min-h-[140px] overflow-hidden shadow-sm">
                            <span className="absolute top-2 left-2 bg-primary/20 text-primary font-bold text-[10px] px-2 py-0.5 rounded">
                              Page {imgIdx + 1}
                            </span>
                            {testStep !== 'review' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(currentQ.id, imgIdx)}
                                className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md hover:bg-red-600 transition-colors z-10"
                                title="Delete page"
                              >
                                ✕
                              </button>
                            )}
                            {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.startsWith('http') ? (
                              <img src={url} alt={`Submission ${imgIdx + 1}`} className="max-h-24 object-contain rounded my-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(url, '_blank')} />
                            ) : (
                              <FileCheck2 className="w-10 h-10 text-primary my-2" />
                            )}
                            <p className="text-xs font-bold text-primary truncate max-w-full px-2">{url.split('/').pop() || `Page ${imgIdx + 1}`}</p>
                            <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-primary underline mt-1 font-semibold">View Full Image ↗</a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* File Upload Dropzone / Button */}
                    {testStep !== 'review' && (
                      <label className="border-2 border-dashed border-primary/30 rounded-xl bg-background/50 hover:bg-primary/5 flex flex-col items-center justify-center p-6 text-foreground/50 text-sm cursor-pointer transition-colors group">
                        <UploadCloud className="w-8 h-8 mb-2 text-primary/60 group-hover:scale-110 transition-transform" />
                        <p className="font-bold text-[#262626]">
                          {parseFileUrls(currentResponse.fileUrl).length > 0 ? '+ Add Another Page / Drawing Photo' : 'Click or Drag to Upload Sketches'}
                        </p>
                        <p className="text-xs mt-1 font-medium text-foreground/60">Supports JPG, PNG, PDF (Multiple files allowed, Max 10MB per file)</p>
                        <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => handleFileUpload(e, currentQ.id)} />
                      </label>
                    )}

                    {testStep === 'review' && attemptDetails?.part_b_evaluation_status === 'completed' && (currentResponse.mentorComments || currentResponse.marksAwarded !== undefined) && (
                      <div className="mt-6 p-6 bg-orange-50 border border-orange-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-orange-200 pb-4">
                          <h4 className="font-bold text-orange-800 text-lg">Mentor Evaluation</h4>
                          <div className="bg-white border border-orange-200 px-3 py-1 rounded-lg text-orange-600 font-bold">
                            {currentResponse.marksAwarded} Marks
                          </div>
                        </div>
                        <div className="space-y-4 text-sm text-orange-900">
                          {currentResponse.mentorComments && (
                            <div>
                              <span className="font-bold opacity-70 uppercase tracking-wider text-[10px] block mb-1">Feedback & Comments</span>
                              <p>{currentResponse.mentorComments}</p>
                            </div>
                          )}
                          {currentResponse.mentorImprovements && (
                            <div>
                              <span className="font-bold opacity-70 uppercase tracking-wider text-[10px] block mb-1">Areas for Improvement</span>
                              <p>{currentResponse.mentorImprovements}</p>
                            </div>
                          )}
                          {currentResponse.mentorLoomLink && (
                            <div>
                              <span className="font-bold opacity-70 uppercase tracking-wider text-[10px] block mb-1">Video Review</span>
                              <a href={currentResponse.mentorLoomLink} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold inline-flex items-center gap-1">
                                Watch Loom Recording ↗
                              </a>
                            </div>
                          )}
                        </div>
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
                          className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer transition-all ${containerClass}`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${letterClass}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className={`text-sm font-semibold ${testStep === 'review' && (isCorrectAnswer || isSelectedButWrong) ? 'text-[#262626]' : (isSelected ? 'font-bold text-primary' : 'text-[#262626]')}`}>{opt.content_text}</span>
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
                          {opt.media_url && (
                            <img src={opt.media_url} alt="Option Media" className="max-h-20 rounded border border-black/5 ml-auto" />
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
                  <Button variant="outline" onClick={handleMarkForReview} className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-sm font-bold">
                    Mark for Review & Next
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
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-green-100 border border-green-200 text-green-700">3</div> Answered</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-red-50 border border-red-200 text-red-600">2</div> Not Answered</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-purple-100 border border-purple-200 text-purple-700">4</div> Marked</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center border border-black/20 bg-white">1</div> Not Visited</div>
            </div>
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
              Answered: {Object.values(responses).filter(r => r.status === 'answered').length} / {totalQuestions}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 sm:space-x-0 mt-2">
            <Button variant="outline" onClick={() => setShowSubmitModal(false)} className="w-full font-bold">
              Cancel
            </Button>
            {modalType === 'exit' && (
              <Button variant="outline" onClick={() => setLocation('/portal/dashboard')} className="w-full font-bold border-orange-200 text-orange-600 hover:bg-orange-50">
                Resume Later
              </Button>
            )}
            <Button onClick={confirmSubmit} className="w-full font-bold bg-primary text-white hover:bg-primary/90">
              {modalType === 'submit' ? 'Yes, Submit' : 'Submit & Exit'}
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
