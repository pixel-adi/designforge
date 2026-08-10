import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LayoutDashboard, Clock, FileText, User, LogOut, ChevronRight, CheckCircle2, Trophy, BookOpen, Lightbulb, ClipboardList, Lock, CreditCard, ExternalLink, Download, Eye, EyeOff, Upload, AlertCircle, Star, Shield, Sparkles, ThumbsUp, Plus, HelpCircle, Send } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length && payload[0] && payload[0].payload) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-black/10 p-3 rounded-xl shadow-lg text-xs font-bold space-y-1 z-50">
        <p className="text-[#262626] font-black">{data.qName || 'Question'} ({data.topic || 'General'})</p>
        <p className="text-foreground/70">Time Spent: <span className="text-primary font-extrabold">{Math.round(data.timeSpent || 0)}s</span></p>
        <p className="text-foreground/70">Difficulty: <span className="text-foreground font-extrabold">{data.difficultyLabel || (data.difficulty <= 1.5 ? 'Low' : data.difficulty <= 2.5 ? 'Med' : 'High')}</span></p>
        <p className={`font-black pt-1 border-t border-black/5 ${data.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {data.isCorrect ? '✓ Correct' : '✗ Incorrect'}
        </p>
      </div>
    );
  }
  return null;
};

export default function PortalDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [onboardingData, setOnboardingData] = useState<{ name: string, phone: string, program_ids: string[], avatar_url: string, education_level: string }>({ name: "", phone: "", program_ids: [], avatar_url: "", education_level: "bachelors" });
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  // Dashboard Data
  const [activeTests, setActiveTests] = useState<any[]>([]);
  const [candidateAttemptsMap, setCandidateAttemptsMap] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardFilterTestId, setLeaderboardFilterTestId] = useState<string>('all');

  // Advanced Telemetry & Telemetry Details
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetailsMap, setAttemptDetailsMap] = useState<Record<string, any>>({});
  const [loadingDetailsMap, setLoadingDetailsMap] = useState<Record<string, boolean>>({});
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'part-a' | 'part-b'>('part-a');

  // Feature Requests states
  const [featureRequests, setFeatureRequests] = useState<any[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [newFeatureTitle, setNewFeatureTitle] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");
  const [newFeatureCategory, setNewFeatureCategory] = useState("general");
  const [showNewFeatureModal, setShowNewFeatureModal] = useState(false);
  const [submittingFeature, setSubmittingFeature] = useState(false);

  // New section states
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [upgradingPayment, setUpgradingPayment] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Question Bank state
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionOptions, setQuestionOptions] = useState<Record<string, any[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionPartFilter, setQuestionPartFilter] = useState<'A' | 'B'>('A');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('all');
  const [questionTopicFilter, setQuestionTopicFilter] = useState('');
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  // Study Materials state
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('all');
  const [materialExamFilter, setMaterialExamFilter] = useState('all');

  // Assignments state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, any>>({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Class Notes state
  const [classNotes, setClassNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesCategoryFilter, setNotesCategoryFilter] = useState('all');
  const [notesExamFilter, setNotesExamFilter] = useState('all');

  // Session enforcement state
  const sessionIdRef = useRef<string>('');
  const [sessionKicked, setSessionKicked] = useState(false);
  const [contentBlurred, setContentBlurred] = useState(false);

  // Access level helpers
  const isPaidUser = candidate?.access_level === 'materials_only' || candidate?.access_level === 'focus_batch';
  const isAccessExpired = candidate?.access_expires_at && new Date(candidate.access_expires_at) < new Date();
  const hasActiveAccess = isPaidUser && !isAccessExpired;
  const isFocusBatch = candidate?.access_level === 'focus_batch' && !isAccessExpired;

  // ===== SINGLE-DEVICE SESSION ENFORCEMENT =====
  const registerSession = useCallback(async (candidateId: string) => {
    const newSessionId = crypto.randomUUID();
    sessionIdRef.current = newSessionId;
    await supabase.from('exam_candidates').update({ active_session_id: newSessionId }).eq('id', candidateId);
    return newSessionId;
  }, []);

  const checkSession = useCallback(async (candidateId: string) => {
    if (!sessionIdRef.current) return;
    const { data } = await supabase.from('exam_candidates').select('active_session_id').eq('id', candidateId).maybeSingle();
    if (data && data.active_session_id !== sessionIdRef.current) {
      // Another device logged in
      setSessionKicked(true);
      await supabase.auth.signOut();
    }
  }, []);

  // Session check interval
  useEffect(() => {
    if (!candidate?.id || sessionKicked) return;
    const interval = setInterval(() => checkSession(candidate.id), 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [candidate?.id, sessionKicked, checkSession]);

  // ===== ANTI-SCREENSHOT: Blur on focus loss =====
  useEffect(() => {
    const handleBlur = () => setContentBlurred(true);
    const handleFocus = () => setContentBlurred(false);
    const handleVisChange = () => setContentBlurred(document.hidden);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisChange);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, []);

  // ===== ANTI-COPY + ANTI-DEVTOOLS + ANTI-TAMPERING =====
  useEffect(() => {
    // --- 1. Disable right-click, copy, drag, selection ---
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); };
    const handleDragStart = (e: DragEvent) => { e.preventDefault(); };

    // --- 2. Block ALL DevTools & copy shortcuts ---
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Block Ctrl/Cmd + C, A, P, U, S
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'p', 'u', 's'].includes(key)) {
        e.preventDefault();
      }
      // Block Ctrl/Cmd + Shift + I (Inspector), J (Console), C (Element picker)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key)) {
        e.preventDefault();
      }
      // Block F12
      if (e.key === 'F12' || e.key === 'PrintScreen') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', handleDragStart);

    // --- 3. DevTools detection via window size (sidebar/bottom DevTools changes dimensions) ---
    let devToolsOpen = false;
    const devToolsCheck = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const isOpen = widthThreshold || heightThreshold;
      if (isOpen !== devToolsOpen) {
        devToolsOpen = isOpen;
        setContentBlurred(isOpen);
      }
    }, 1000);

    // --- 4. Console lockdown (prevents useful output in DevTools console) ---
    const noop = () => {};
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };
    console.log = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    // Keep console.error for critical debugging (but override to filter)
    console.error = (...args: any[]) => {
      // Only allow React/system errors through, not data leaks
      if (args[0]?.toString?.().includes?.('React') || args[0]?.toString?.().includes?.('Uncaught')) {
        originalConsole.error(...args);
      }
    };

    // --- 5. Anti-debugging: debugger trap loop ---
    // When DevTools is open, this pauses execution; when closed, it's instant
    const debuggerTrap = setInterval(() => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      // If debugger took > 100ms, DevTools is likely open
      if (end - start > 100) {
        setContentBlurred(true);
      }
    }, 5000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
      clearInterval(devToolsCheck);
      clearInterval(debuggerTrap);
      // Restore console
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    };
  }, []);

  // --- 6. DOM Integrity Monitor: revert CSS/class tampering on locked elements ---
  useEffect(() => {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const el = mutation.target as HTMLElement;
          // If someone removes blur, opacity, pointer-events on locked content
          if (el.dataset.locked === 'true') {
            el.style.filter = 'blur(8px)';
            el.style.pointerEvents = 'none';
          }
        }
      }
    });

    observer.observe(portalRoot, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [candidate]);

  // --- 7. Periodic server-side access re-validation ---
  useEffect(() => {
    if (!candidate?.id) return;
    const revalidate = setInterval(async () => {
      const { data } = await supabase
        .from('exam_candidates')
        .select('access_level, access_expires_at')
        .eq('id', candidate.id)
        .maybeSingle();
      if (data) {
        // If access was revoked/downgraded server-side, update client state
        if (data.access_level !== candidate.access_level) {
          setCandidate((prev: any) => prev ? { ...prev, access_level: data.access_level, access_expires_at: data.access_expires_at } : prev);
        }
      }
    }, 30000); // Re-validate every 30s
    return () => clearInterval(revalidate);
  }, [candidate?.id, candidate?.access_level]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setLocation('/portal/login');
        return;
      }
      setAuthUser(user);

      // Fetch candidate profile and programs concurrently
      const [candRes, progRes] = await Promise.all([
        supabase.from('exam_candidates').select(`*`).eq('auth_user_id', user.id).maybeSingle(),
        supabase.from('exam_programs').select('*').order('name')
      ]);

      if (candRes.error) throw candRes.error;
      if (progRes.data) setPrograms(progRes.data);

      const candidateData = candRes.data;

      if (!candidateData) {
        // Needs onboarding
        setShowOnboarding(true);
        // Default name if Google provided it
        if (user.user_metadata?.full_name) {
          setOnboardingData(prev => ({ ...prev, name: user.user_metadata.full_name }));
        }
      } else {
        setCandidate(candidateData);

        setOnboardingData({
          name: candidateData.name || user.user_metadata?.full_name || "",
          phone: candidateData.phone || "",
          program_ids: candidateData.program_ids || [],
          avatar_url: candidateData.avatar_url || "",
          education_level: candidateData.education_level || "bachelors"
        });

        // Register this device session
        registerSession(candidateData.id);

        fetchDashboardData(candidateData.program_ids || [], candidateData.education_level || "bachelors", candidateData.id);
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (programIds: string[], educationLevel: string, candidateId: string) => {
    try {
      const [testsRes, attemptsRes, programsRes] = await Promise.all([
        supabase
          .from('exam_tests')
          .select(`*, exam_test_sections(part, duration_minutes)`)
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        supabase.from('exam_attempts').select('id, test_id, status, attempt_number').eq('candidate_id', candidateId).order('attempt_number', { ascending: true }),
        supabase.from('exam_programs').select('id, name')
      ]);

      if (testsRes.error) throw testsRes.error;

      const tests = testsRes.data;
      const attempts = attemptsRes.data;
      const allPrograms = programsRes.data;

      // Group attempts by test_id as arrays
      const attemptMap: Record<string, any[]> = {};
      (attempts || []).forEach(a => {
        if (!attemptMap[a.test_id]) attemptMap[a.test_id] = [];
        attemptMap[a.test_id].push(a);
      });
      setCandidateAttemptsMap(attemptMap);

      const programsMap: Record<string, string> = {};
      (allPrograms || []).forEach(p => { programsMap[p.id] = p.name; });

      const filteredTests = (tests || []).filter(test => {
        if (test.program_format === 'both') return true;
        if (test.program_format === educationLevel) return true;

        if (!test.program_format) {
          const testTitle = test.title.toLowerCase();
          const isBdesTest = testTitle.includes('b.des') || testTitle.includes('bdes') || testTitle.includes('uceed') || testTitle.includes('nid b');
          const isMdesTest = testTitle.includes('m.des') || testTitle.includes('mdes') || (testTitle.includes('ceed') && !testTitle.includes('uceed')) || testTitle.includes('nid m');

          if (educationLevel === 'bachelors' && isBdesTest) return true;
          if (educationLevel === 'masters' && isMdesTest) return true;
          if (!isBdesTest && !isMdesTest) return true;
        }
        
        return false;
      });

      setActiveTests(filteredTests);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttempts = async (candidateId: string) => {
    setLoadingAttempts(true);
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`*, exam_tests(title)`)
        .eq('candidate_id', candidateId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      if (!error && data) {
        setPastAttempts(data || []);
        if (data.length > 0) {
          const firstId = data[0].id;
          setSelectedAttemptId(firstId);
          fetchAttemptDetails(firstId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const fetchAttemptDetails = async (attemptId: string) => {
    if (attemptDetailsMap[attemptId]) return;
    
    setLoadingDetailsMap(prev => ({ ...prev, [attemptId]: true }));
    try {
      const { data: responses, error: respError } = await supabase
        .from('exam_responses')
        .select(`
          *,
          exam_questions(
            id,
            type,
            part,
            difficulty,
            content_text,
            topics,
            pyq_tag
          )
        `)
        .eq('attempt_id', attemptId);

      if (respError) throw respError;

      const { data: attemptInfo } = await supabase
        .from('exam_attempts')
        .select('test_id')
        .eq('id', attemptId)
        .single();
        
      if (attemptInfo && responses) {
        const testId = attemptInfo.test_id;
        
        const { data: testQuestions } = await supabase
          .from('exam_test_questions')
          .select('question_id')
          .eq('test_id', testId);
        
        const questionIds = (testQuestions || []).map(tq => tq.question_id);
        
        const { data: correctOpts } = await supabase
          .from('exam_options')
          .select('id, question_id, is_correct, content_text')
          .in('question_id', questionIds)
          .eq('is_correct', true);

        const correctMap: Record<string, any[]> = {};
        (correctOpts || []).forEach(opt => {
          if (!correctMap[opt.question_id]) correctMap[opt.question_id] = [];
          correctMap[opt.question_id].push(opt);
        });

        const { data: commData } = await supabase
          .from('exam_responses')
          .select('question_id, time_spent')
          .in('question_id', questionIds);

        const commAverages: Record<string, { totalTime: number, count: number }> = {};
        (commData || []).forEach(r => {
          const t = r.time_spent || 0;
          if (!commAverages[r.question_id]) commAverages[r.question_id] = { totalTime: 0, count: 0 };
          commAverages[r.question_id].totalTime += t;
          commAverages[r.question_id].count += 1;
        });

        const processedResponses = responses.map(r => {
          const q = r.exam_questions;
          if (!q) return r;
          const correctOptsArr = correctMap[q.id] || [];
          const selected = r.selected_options || [];
          let isCorrect = false;
          let maxMarks = 1;
          let earnedMarks = 0;

          if (q.type === 'NAT') {
            const answered = r.answer_text?.trim();
            const correctText = correctOptsArr[0]?.content_text?.trim();
            isCorrect = !!(answered && correctText && (
              !isNaN(parseFloat(answered)) && !isNaN(parseFloat(correctText))
                ? parseFloat(answered) === parseFloat(correctText)
                : answered.toLowerCase() === correctText?.toLowerCase()
            ));
            earnedMarks = isCorrect ? 4 : 0;
            maxMarks = 4;
          } else if (q.type === 'MCQ') {
            isCorrect = selected.length === 1 && correctOptsArr.some(c => c.id === selected[0]);
            earnedMarks = isCorrect ? 3 : (selected.length > 0 ? -0.5 : 0);
            maxMarks = 3;
          } else if (q.type === 'MSQ') {
            const correctIds = correctOptsArr.map(c => c.id);
            const C = correctIds.length;
            const S = selected.length;
            const W = selected.filter((s: any) => !correctIds.includes(s)).length;
            if (selected.length > 0) {
              if (W > 0) {
                earnedMarks = -1;
              } else {
                if (S === C) {
                  earnedMarks = 4;
                  isCorrect = true;
                } else {
                  earnedMarks = S;
                }
              }
            }
            maxMarks = 4;
          } else if (q.type === 'SUBJECTIVE') {
            earnedMarks = r.marks_awarded ? Number(r.marks_awarded) : 0;
            maxMarks = 20;
            isCorrect = earnedMarks >= (maxMarks * 0.5);
          }

          const commAvg = commAverages[q.id] 
            ? Math.round(commAverages[q.id].totalTime / commAverages[q.id].count) 
            : 45;

          return {
            ...r,
            isCorrect,
            earnedMarks,
            maxMarks,
            communityAvgTime: commAvg
          };
        });

        setAttemptDetailsMap(prev => ({
          ...prev,
          [attemptId]: {
            responses: processedResponses,
            testId
          }
        }));
      }
    } catch (err) {
      console.error("Error fetching attempt telemetry:", err);
    } finally {
      setLoadingDetailsMap(prev => ({ ...prev, [attemptId]: false }));
    }
  };

  const fetchFeatureRequests = async () => {
    setLoadingFeatures(true);
    try {
      const { data, error } = await supabase
        .from('exam_feature_requests')
        .select('*, exam_candidates(name)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setFeatureRequests(data);
      } else if (error) {
        console.error("Error fetching feature requests:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeatures(false);
    }
  };

  const handleCreateFeatureRequest = async () => {
    if (!newFeatureTitle.trim() || !newFeatureDescription.trim()) {
      toast({ title: "Validation Error", description: "Title and description are required.", variant: "destructive" });
      return;
    }

    setSubmittingFeature(true);
    try {
      const { error } = await supabase
        .from('exam_feature_requests')
        .insert({
          candidate_id: candidate.id,
          title: newFeatureTitle,
          description: newFeatureDescription,
          category: newFeatureCategory,
          votes: [candidate.id]
        });

      if (!error) {
        toast({ title: "Feature Requested! 🚀", description: "Thank you for your feedback. Other students can upvote this request." });
        setNewFeatureTitle("");
        setNewFeatureDescription("");
        setNewFeatureCategory("general");
        setShowNewFeatureModal(false);
        fetchFeatureRequests();
      } else {
        throw error;
      }
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingFeature(false);
    }
  };

  const handleVoteFeatureRequest = async (requestId: string, currentVotes: string[]) => {
    if (!candidate) return;
    
    let updatedVotes: string[] = [];
    const hasVoted = currentVotes.includes(candidate.id);
    
    if (hasVoted) {
      updatedVotes = currentVotes.filter(v => v !== candidate.id);
    } else {
      updatedVotes = [...currentVotes, candidate.id];
    }

    try {
      const { error } = await supabase
        .from('exam_feature_requests')
        .update({ votes: updatedVotes })
        .eq('id', requestId);

      if (!error) {
        setFeatureRequests(prev => prev.map(req => {
          if (req.id === requestId) {
            return { ...req, votes: updatedVotes };
          }
          return req;
        }));
        toast({ 
          title: hasVoted ? "Vote Retracted" : "Voted! 👍", 
          description: hasVoted ? "Your vote choice has been recorded." : "Thank you for upvoting this suggestion!"
        });
      } else {
        throw error;
      }
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    }
  };

  const getScatterData = (responses: any[]) => {
    const partA = (responses || []).filter(r => r.exam_questions?.part === 'A');
    return partA.map((r, i) => {
      let diffVal = 2;
      if (r.exam_questions?.difficulty === 'Low') diffVal = 1;
      if (r.exam_questions?.difficulty === 'High') diffVal = 3;
      
      const jitter = Math.random() * 0.3 - 0.15;
      const difficulty = isFinite(diffVal + jitter) ? diffVal + jitter : 2;
      const timeSpent = Number(r.time_spent) || 0;

      return {
        qName: `Q${i + 1}`,
        timeSpent: isFinite(timeSpent) ? timeSpent : 0,
        difficulty,
        difficultyLabel: r.exam_questions?.difficulty || 'Medium',
        isCorrect: !!r.isCorrect,
        topic: r.exam_questions?.topics?.[0] || 'General',
        status: r.status || 'unseen'
      };
    });
  };

  const getQuadrantCounts = (responses: any[]) => {
    let sweetSpot = 0, overthinking = 0, rushed = 0, stuck = 0;
    
    (responses || []).filter(r => r.exam_questions?.part === 'A').forEach(r => {
      const isCorrect = !!r.isCorrect;
      const speed = Number(r.time_spent) || 0;
      const avg = Number(r.communityAvgTime) || 45;
      
      if (isCorrect) {
        if (speed <= avg) sweetSpot++;
        else overthinking++;
      } else {
        if (speed <= avg) rushed++;
        else stuck++;
      }
    });

    return { sweetSpot, overthinking, rushed, stuck };
  };

  const getConceptMasteryData = (responses: any[]) => {
    const partA = (responses || []).filter(r => r.exam_questions?.part === 'A');
    const topicMap: Record<string, { total: number, earned: number }> = {};

    partA.forEach(r => {
      const q = r.exam_questions;
      if (!q || !q.topics || q.topics.length === 0) return;
      
      let weight = 2;
      if (q.difficulty === 'Low') weight = 1;
      if (q.difficulty === 'High') weight = 3;

      q.topics.forEach((t: string) => {
        const topicName = t.trim();
        if (!topicMap[topicName]) {
          topicMap[topicName] = { total: 0, earned: 0 };
        }
        const maxM = Number(r.maxMarks) || 1;
        const earnedM = Number(r.earnedMarks) || 0;
        topicMap[topicName].total += maxM * weight;
        topicMap[topicName].earned += Math.max(0, earnedM) * weight;
      });
    });

    const data = Object.keys(topicMap).map(topic => {
      const info = topicMap[topic];
      const rawPercent = info.total > 0 ? (info.earned / info.total) * 100 : 0;
      const percent = isFinite(rawPercent) ? Math.min(100, Math.round(rawPercent * 100) / 100) : 0;
      return {
        subject: topic,
        A: percent,
        fullMark: 100
      };
    });

    if (data.length === 0) {
      return [
        { subject: 'Visualisation', A: 0, fullMark: 100 },
        { subject: 'Observation', A: 0, fullMark: 100 },
        { subject: 'Aptitude', A: 0, fullMark: 100 },
        { subject: 'GK', A: 0, fullMark: 100 },
        { subject: 'Theory', A: 0, fullMark: 100 }
      ];
    }

    return data;
  };

  const getTimeWastage = (responses: any[]) => {
    const partA = (responses || []).filter(r => r.exam_questions?.part === 'A');
    const totalTime = partA.reduce((sum, r) => sum + (Number(r.time_spent) || 0), 0);
    const wastedTime = partA.filter(r => !r.isCorrect).reduce((sum, r) => sum + (Number(r.time_spent) || 0), 0);
    
    const rawWastedPercent = totalTime > 0 ? (wastedTime / totalTime) * 100 : 0;
    const wastedPercent = isFinite(rawWastedPercent) ? Math.round(rawWastedPercent) : 0;
    return {
      totalTime: isFinite(totalTime) ? totalTime : 0,
      wastedTime: isFinite(wastedTime) ? wastedTime : 0,
      wastedPercent
    };
  };

  const getReviewPayoff = (responses: any[]) => {
    const partA = responses.filter(r => r.exam_questions?.part === 'A');
    let markedCount = 0;
    let marksGained = 0;
    let marksLost = 0;

    partA.forEach(r => {
      const transitions = r.state_transitions || [];
      const wasMarked = transitions.some((t: any) => t.action === 'marked') || r.status === 'marked';
      if (wasMarked) {
        markedCount++;
        const changes = r.answer_changes || 0;
        if (changes > 1) {
          if (r.isCorrect) {
            marksGained += r.earnedMarks;
          } else {
            marksLost += Math.abs(r.earnedMarks);
          }
        }
      }
    });

    return {
      markedCount,
      netPayoff: marksGained - marksLost,
      gained: marksGained,
      lost: marksLost
    };
  };

  const getPartBRubricAverages = (responses: any[]) => {
    const partB = (responses || []).filter(r => r.exam_questions?.part === 'B');
    const rubricSums = {
      critical_thinking: 0,
      ideation: 0,
      storytelling: 0,
      conceptualisation: 0,
      representation: 0
    };
    let count = 0;
    let totalMaxPerCriteriaSum = 0;

    partB.forEach(r => {
      const rubrics = r.rubric_marks || {};
      if (Object.keys(rubrics).length > 0) {
        count++;
        rubricSums.critical_thinking += parseFloat(rubrics.critical_thinking || 0) || 0;
        rubricSums.ideation += parseFloat(rubrics.ideation || 0) || 0;
        rubricSums.storytelling += parseFloat(rubrics.storytelling || 0) || 0;
        rubricSums.conceptualisation += parseFloat(rubrics.conceptualisation || 0) || 0;
        rubricSums.representation += parseFloat(rubrics.representation || 0) || 0;

        const tag = (r.exam_attempts?.exam_tests?.title || r.exam_questions?.pyq_tag || '').toLowerCase();
        const isUceed = tag.includes('uceed') || tag.includes('b.des') || tag.includes('bdes');
        const maxPerCriteria = isUceed ? 10 : 4;
        totalMaxPerCriteriaSum += maxPerCriteria;
      }
    });

    if (count === 0 || totalMaxPerCriteriaSum === 0) {
      return [
        { criteria: 'Critical Thinking', value: 0 },
        { criteria: 'Ideation', value: 0 },
        { criteria: 'Storytelling', value: 0 },
        { criteria: 'Conceptualisation', value: 0 },
        { criteria: 'Representation', value: 0 }
      ];
    }

    const calcVal = (sum: number) => {
      const ratio = totalMaxPerCriteriaSum > 0 ? (sum / totalMaxPerCriteriaSum) * 100 : 0;
      return isFinite(ratio) ? Math.min(100, Math.round(ratio * 100) / 100) : 0;
    };

    return [
      { criteria: 'Critical Thinking', value: calcVal(rubricSums.critical_thinking) },
      { criteria: 'Ideation', value: calcVal(rubricSums.ideation) },
      { criteria: 'Storytelling', value: calcVal(rubricSums.storytelling) },
      { criteria: 'Conceptualisation', value: calcVal(rubricSums.conceptualisation) },
      { criteria: 'Representation', value: calcVal(rubricSums.representation) }
    ];
  };

  const getCognitiveStaminaData = (responses: any[]) => {
    const partA = responses.filter((r: any) => r.exam_questions?.part === 'A');
    if (partA.length === 0) {
      return {
        firstHalfPacing: 0,
        secondHalfPacing: 0,
        firstHalfAccuracy: 0,
        secondHalfAccuracy: 0,
        pacingDecay: 1.0,
        accuracyDrop: 0,
        staminaScore: 100,
        state: 'flow',
        critique: "No telemetry responses to parse. Attempt mock exams to measure your focus endurance."
      };
    }

    const sorted = [...partA].sort((a: any, b: any) => {
      const qA = a.exam_questions?.id || '';
      const qB = b.exam_questions?.id || '';
      return qA.localeCompare(qB);
    });

    const half = Math.ceil(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);

    const firstHalfTotalTime = firstHalf.reduce((sum, r) => sum + (r.time_spent || 0), 0);
    const firstHalfAvgPacing = firstHalf.length > 0 ? Math.round((firstHalfTotalTime / firstHalf.length) * 10) / 10 : 0;

    const secondHalfTotalTime = secondHalf.reduce((sum, r) => sum + (r.time_spent || 0), 0);
    const secondHalfAvgPacing = secondHalf.length > 0 ? Math.round((secondHalfTotalTime / secondHalf.length) * 10) / 10 : 0;

    const firstHalfCorrect = firstHalf.filter(r => r.isCorrect).length;
    const firstHalfAccuracy = firstHalf.length > 0 ? Math.round((firstHalfCorrect / firstHalf.length) * 100) : 0;

    const secondHalfCorrect = secondHalf.filter(r => r.isCorrect).length;
    const secondHalfAccuracy = secondHalf.length > 0 ? Math.round((secondHalfCorrect / secondHalf.length) * 100) : 0;

    const rawPacingDecay = firstHalfAvgPacing > 0 ? secondHalfAvgPacing / firstHalfAvgPacing : 1.0;
    const pacingDecay = isFinite(rawPacingDecay) ? rawPacingDecay : 1.0;
    const accuracyDrop = isFinite(firstHalfAccuracy - secondHalfAccuracy) ? (firstHalfAccuracy - secondHalfAccuracy) : 0;

    let staminaScore = 100;
    if (accuracyDrop > 0) {
      staminaScore -= accuracyDrop * 1.5;
    }
    staminaScore -= Math.min(40, Math.abs(pacingDecay - 1.0) * 100);
    const finalStaminaScore = isFinite(staminaScore) ? Math.max(10, Math.min(100, Math.round(staminaScore))) : 100;

    let state = 'flow';
    let critique = "Superb consistency. You maintained balanced pacing and accuracy across the entire test session. You are ready for peak exam conditions!";

    if (pacingDecay > 1.15 && accuracyDrop > 5) {
      state = 'exhaustion';
      critique = `Your speed slowed by ${Math.round((pacingDecay - 1.0) * 100)}% and accuracy fell by ${Math.round(accuracyDrop)}% in the second half. This indicates stamina depletion. We recommend practicing in 90-minute focused sprints to build cognitive tolerance.`;
    } else if (pacingDecay < 0.85 && accuracyDrop > 5) {
      state = 'panic';
      critique = `You sped up by ${Math.round((1.0 - pacingDecay) * 100)}% but accuracy dropped by ${Math.round(accuracyDrop)}% as the test progressed. This suggests rushing under time pressure. Focus on steady pacing distribution and time management.`;
    } else if (accuracyDrop > 15) {
      state = 'exhaustion';
      critique = `Your accuracy dropped sharply by ${Math.round(accuracyDrop)}% in the second half of the exam. Try taking short 30-second breathing pauses every 45 minutes to refresh your focus.`;
    }

    return {
      firstHalfPacing: isFinite(firstHalfAvgPacing) ? firstHalfAvgPacing : 0,
      secondHalfPacing: isFinite(secondHalfAvgPacing) ? secondHalfAvgPacing : 0,
      firstHalfAccuracy: isFinite(firstHalfAccuracy) ? firstHalfAccuracy : 0,
      secondHalfAccuracy: isFinite(secondHalfAccuracy) ? secondHalfAccuracy : 0,
      pacingDecay,
      accuracyDrop,
      staminaScore: finalStaminaScore,
      state,
      critique
    };
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      // Build the query
      let query = supabase
        .from('exam_attempts')
        .select(`id, score_part_a, total_part_a, score_part_b, total_score, part_b_evaluation_status, candidate_id, test_id, exam_candidates!inner(name, avatar_url, education_level, access_level), exam_tests!inner(title, program_format)`)
        .eq('status', 'completed')
        .order('total_score', { ascending: false, nullsFirst: false })
        .order('score_part_a', { ascending: false, nullsFirst: false });

      if (leaderboardFilterTestId !== 'all') {
         query = query.eq('test_id', leaderboardFilterTestId);
      }

      // Filter by profile education level
      if (candidate?.education_level) {
         query = query.eq('exam_tests.program_format', candidate.education_level);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        // Sort in Javascript by actual score descending: (total_score !== null ? total_score : score_part_a)
        const sortedData = [...data].sort((a, b) => {
          const scoreA = a.total_score !== null ? Number(a.total_score) : Number(a.score_part_a || 0);
          const scoreB = b.total_score !== null ? Number(b.total_score) : Number(b.score_part_a || 0);
          return scoreB - scoreA;
        });

        // Group by candidate to only show their best attempt
        const seenCandidates = new Set();
        const uniqueTopAttempts = sortedData.filter(attempt => {
          if (seenCandidates.has(attempt.candidate_id)) return false;
          seenCandidates.add(attempt.candidate_id);
          return true;
        }).slice(0, 10); // Keep top 10 after unique filtering
        setLeaderboard(uniqueTopAttempts);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard' && candidate) {
      fetchLeaderboard();
    }
  }, [activeTab, leaderboardFilterTestId, candidate]);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData.name) {
      toast({ title: "Missing Fields", description: "Please provide your name.", variant: "destructive" });
      return;
    }
    setSavingOnboarding(true);
    try {
      let result;
      if (candidate) {
        // Update existing profile
        result = await supabase.from('exam_candidates').update({
          name: onboardingData.name,
          phone: onboardingData.phone || null,
          program_ids: onboardingData.program_ids,
          avatar_url: onboardingData.avatar_url || null,
          education_level: onboardingData.education_level
        }).eq('id', candidate.id).select().single();
      } else {
        // Insert new profile
        result = await supabase.from('exam_candidates').insert({
          auth_user_id: authUser.id,
          email: authUser.email,
          name: onboardingData.name,
          phone: onboardingData.phone || null,
          program_ids: onboardingData.program_ids,
          avatar_url: onboardingData.avatar_url || null,
          education_level: onboardingData.education_level
        }).select().single();
      }

      if (result.error) throw result.error;

      setCandidate(result.data);
      setShowOnboarding(false);
      toast({ title: "Success!", description: "Your profile has been saved." });
      fetchDashboardData(result.data.program_ids, result.data.education_level || onboardingData.education_level, result.data.id);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingOnboarding(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation('/portal/login');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 2MB before compression.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;

        // Calculate crop to center
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        ctx?.drawImage(img, startX, startY, size, size, 0, 0, 200, 200);

        // Compress until under 40kb
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > 40 * 1024 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        setOnboardingData(prev => ({ ...prev, avatar_url: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  async function invokeEdgeFunction(name: string, body: unknown) {
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
    return { data: await res.json(), httpStatus: res.status };
  }

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      let query = supabase.from('exam_questions').select('*').eq('part', questionPartFilter).order('created_at', { ascending: false });
      if (questionTypeFilter !== 'all') query = query.eq('type', questionTypeFilter);
      if (questionDifficultyFilter !== 'all') query = query.eq('difficulty', questionDifficultyFilter);
      const { data, error } = await query;
      if (error) throw error;
      setQuestions(data || []);
      // Fetch options for Part A questions
      if (questionPartFilter === 'A' && data && data.length > 0) {
        const { data: opts } = await supabase.from('exam_options').select('*').in('question_id', data.map(q => q.id));
        const optMap: Record<string, any[]> = {};
        (opts || []).forEach(o => { if (!optMap[o.question_id]) optMap[o.question_id] = []; optMap[o.question_id].push(o); });
        setQuestionOptions(optMap);
      } else {
        setQuestionOptions({});
      }
    } catch (err) { console.error(err); } finally { setLoadingQuestions(false); }
  };

  const fetchStudyMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const { data, error } = await supabase.from('study_materials').select('*').eq('is_visible', true).order('display_order').order('created_at', { ascending: false });
      if (!error) setStudyMaterials(data || []);
    } catch (err) { console.error(err); } finally { setLoadingMaterials(false); }
  };

  const fetchAssignments = async () => {
    if (!candidate?.id) return;
    setLoadingAssignments(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        supabase.from('class_assignments').select('*').eq('is_visible', true).order('created_at', { ascending: false }),
        supabase.from('assignment_submissions').select('*').eq('candidate_id', candidate.id)
      ]);
      if (!assignRes.error) setAssignments(assignRes.data || []);
      if (!subRes.error) {
        const subMap: Record<string, any> = {};
        (subRes.data || []).forEach(s => { subMap[s.assignment_id] = s; });
        setAssignmentSubmissions(subMap);
      }
    } catch (err) { console.error(err); } finally { setLoadingAssignments(false); }
  };

  const fetchClassNotes = async () => {
    setLoadingNotes(true);
    try {
      const { data, error } = await supabase.from('class_notes').select('*').eq('is_visible', true).order('display_order').order('created_at', { ascending: false });
      if (!error) setClassNotes(data || []);
    } catch (err) { console.error(err); } finally { setLoadingNotes(false); }
  };

  const handleSubmitAssignment = async () => {
    if (!submissionFile || !selectedAssignment || !candidate?.id) return;
    setSubmitting(true);
    try {
      const fileExt = submissionFile.name.split('.').pop();
      const filePath = `${candidate.id}/${selectedAssignment.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('assignment-submissions').upload(filePath, submissionFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('assignment-submissions').getPublicUrl(filePath);
      
      const existing = assignmentSubmissions[selectedAssignment.id];
      if (existing) {
        const { error } = await supabase.from('assignment_submissions').update({ file_url: publicUrl, answer_text: submissionText || null, status: 'submitted', submitted_at: new Date().toISOString(), reviewed_at: null }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assignment_submissions').insert({ assignment_id: selectedAssignment.id, candidate_id: candidate.id, file_url: publicUrl, answer_text: submissionText || null });
        if (error) throw error;
      }
      toast({ title: 'Success!', description: 'Assignment submitted successfully.' });
      setShowSubmitModal(false);
      setSubmissionFile(null);
      setSubmissionText('');
      fetchAssignments();
    } catch (err: any) {
      toast({ title: 'Submission Failed', description: err.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const handleUpgradePayment = async () => {
    setUpgradingPayment(true);
    setUpgradeError(null);
    try {
      // Preload Razorpay script
      if (!document.getElementById('razorpay-checkout-js')) {
        const script = document.createElement('script');
        script.id = 'razorpay-checkout-js';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }

      // Create order
      let orderResponse: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data } = await invokeEdgeFunction('create-upgrade-order', {});
          orderResponse = data;
          if (orderResponse?.order_id && orderResponse?.key_id) break;
        } catch (err) { console.warn(`Attempt ${attempt} failed:`, err); }
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
      }

      if (!orderResponse?.order_id || !orderResponse?.key_id) {
        setUpgradeError(orderResponse?.error || 'Could not create payment order. Please try again.');
        setUpgradingPayment(false);
        return;
      }

      // Wait for Razorpay to load
      let isLoaded = !!(window as any).Razorpay;
      if (!isLoaded) {
        await new Promise<void>((resolve) => {
          const check = setInterval(() => { if ((window as any).Razorpay) { clearInterval(check); isLoaded = true; resolve(); } }, 200);
          setTimeout(() => { clearInterval(check); resolve(); }, 4000);
        });
      }
      if (!isLoaded) { setUpgradeError('Failed to load payment gateway. Please disable ad-blockers.'); setUpgradingPayment(false); return; }

      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: 'INR',
        name: 'Designforge',
        description: 'Unlock Assignments & Notes Access',
        order_id: orderResponse.order_id,
        handler: async function (response: any) {
          try {
            const { data: verifyData } = await invokeEdgeFunction('verify-upgrade-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyData?.status === 'success') {
              // Refetch candidate profile to update access level
              const { data: updatedCandidate } = await supabase.from('exam_candidates').select('*').eq('auth_user_id', authUser.id).maybeSingle();
              if (updatedCandidate) setCandidate(updatedCandidate);
              setShowPremiumModal(false);
              toast({ title: '🎉 Access Unlocked!', description: 'You now have access to Class Assignments and Notes.' });
            }
          } catch (err) { console.error('Verification error:', err); }
          setUpgradingPayment(false);
        },
        prefill: { name: candidate?.name, email: candidate?.email },
        theme: { color: '#E23A25' },
        modal: { ondismiss: () => { setUpgradingPayment(false); setUpgradeError('Payment was cancelled.'); } },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (r: any) => { setUpgradeError(`Payment failed: ${r.error.description}`); });
      rzp.open();
    } catch (err) {
      setUpgradeError('Something went wrong. Please try again.');
      setUpgradingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex">
        <div className="w-64 bg-white border-r border-black/5 flex flex-col hidden md:flex sticky top-0 h-screen">
          <div className="p-6 border-b border-black/5">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="mt-auto p-4 border-t border-black/5">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-col gap-2">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 bg-white border-b border-black/5 px-6 flex items-center md:hidden">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-[200px] w-full rounded-2xl" />
                <Skeleton className="h-[200px] w-full rounded-2xl" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-[300px] w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session kicked — show logged out screen
  if (sessionKicked) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#262626]">Signed Out</h2>
          <p className="text-foreground/60 text-sm">You've been logged out because your account was signed in on another device. Only one active session is allowed at a time.</p>
          <Button onClick={() => setLocation('/portal/login')} className="bg-primary hover:bg-primary/90 text-white w-full h-12">
            Sign In Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="portal-root" className={`min-h-screen bg-[#F8F9FA] flex ${contentBlurred ? 'blur-lg pointer-events-none' : ''}`} style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-black/5 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-black/5">
          <img src={logoImg} alt="Designforge" className="h-8" />
        </div>

        <div className="p-4">
          <p className="px-4 text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">Menu</p>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => { setActiveTab('progress'); if (candidate?.id) fetchAttempts(candidate.id); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'progress' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <Clock className="w-4 h-4" /> Performance Analytics
            </button>
            <button
              onClick={() => { setActiveTab('leaderboard'); fetchLeaderboard(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leaderboard' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <Trophy className="w-4 h-4" /> Leaderboard
            </button>
            <button
              onClick={() => { setActiveTab('features'); fetchFeatureRequests(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'features' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <Sparkles className="w-4 h-4" /> Feature Board
            </button>
          </div>

          <p className="px-4 text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2 mt-6">Resources</p>
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('questions'); fetchQuestions(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'questions' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <BookOpen className="w-4 h-4" /> Question Bank
            </button>
            <button
              onClick={() => { setActiveTab('materials'); fetchStudyMaterials(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'materials' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <Lightbulb className="w-4 h-4" /> Study Materials
            </button>
            <button
              onClick={() => { if (hasActiveAccess) { setActiveTab('assignments'); fetchAssignments(); } else { setShowPremiumModal(true); } }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'assignments' ? 'bg-primary/10 text-primary' : !hasActiveAccess ? 'text-foreground/30 cursor-default' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <ClipboardList className="w-4 h-4" /> Assignments
              {!hasActiveAccess && <Lock className="w-3 h-3 ml-auto" />}
            </button>
            <button
              onClick={() => { if (hasActiveAccess) { setActiveTab('notes'); fetchClassNotes(); } else { setShowPremiumModal(true); } }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-primary/10 text-primary' : !hasActiveAccess ? 'text-foreground/30 cursor-default' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <FileText className="w-4 h-4" /> Class Notes
              {!hasActiveAccess && <Lock className="w-3 h-3 ml-auto" />}
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-black/5">
          {candidate && (
            <button
              onClick={() => {
                if (programs.length === 0) {
                  supabase.from('exam_programs').select('*').order('name').then(({ data }) => {
                    if (data) setPrograms(data);
                  });
                }
                setActiveTab('profile');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 text-left transition-colors ${activeTab === 'profile' ? 'bg-primary/5 border-primary/20 border' : 'hover:bg-black/5 border border-transparent'}`}
            >
              {candidate.avatar_url ? (
                <img src={candidate.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                  {candidate.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#262626] truncate">{candidate.name}</p>
                <p className="text-xs font-medium text-foreground/50">{candidate.unique_id}</p>
              </div>
            </button>
          )}
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-12">

          <div className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight">
              {activeTab === 'overview' ? 'Dashboard Overview' : activeTab === 'progress' ? 'Performance Analytics' : activeTab === 'leaderboard' ? 'Global Leaderboard' : activeTab === 'questions' ? 'Question Bank' : activeTab === 'materials' ? 'Study Materials' : activeTab === 'assignments' ? 'Class Assignments' : activeTab === 'notes' ? 'Class Notes' : 'Profile Settings'}
            </h1>
            <p className="text-foreground/60 mt-1">
              {candidate?.program_ids?.length > 0 ? `Preparing for ${programs.filter(p => candidate.program_ids.includes(p.id)).map(p => p.name).join(' & ')}` : 'Welcome to the candidate portal'}
            </p>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {!candidate && (
                <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800">Profile Incomplete</h3>
                    <p className="text-orange-700/80 mt-1">Please complete your profile to see your assigned mock tests.</p>
                  </div>
                  <Button onClick={() => setShowOnboarding(true)} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
                    Complete Profile
                  </Button>
                </div>
              )}

              {candidate && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#262626]">Active Mock Tests</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTests.length === 0 ? (
                      <div className="col-span-full p-8 text-center bg-white border border-black/5 rounded-2xl">
                        <FileText className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                        <p className="text-foreground/50 font-medium">No active tests available for your program at the moment.</p>
                      </div>
                    ) : activeTests.map((test: any) => {
                      const isExpired = test.expires_at ? new Date(test.expires_at).getTime() < Date.now() : false;
                      const testAttempts = candidateAttemptsMap[test.id] || [];
                      const completedAttempts = testAttempts.filter((a: any) => a.status === 'completed');
                      const hasCompletedAttempt = completedAttempts.length > 0;
                      const canReattempt = completedAttempts.length < 3;
                      const latestCompleted = completedAttempts[completedAttempts.length - 1];
                      
                      let expiryText = "";
                      if (test.expires_at) {
                        if (isExpired) expiryText = "Expired";
                        else {
                          const diffHours = Math.round((new Date(test.expires_at).getTime() - Date.now()) / (1000 * 60 * 60));
                          if (diffHours > 24) expiryText = `Expires in ${Math.round(diffHours / 24)} days`;
                          else expiryText = `Expires in ${diffHours} hours`;
                        }
                      }

                      return (
                      <div key={test.id} className={`bg-white border border-black/5 p-6 rounded-2xl shadow-sm transition-shadow group flex flex-col justify-between ${isExpired && !hasCompletedAttempt ? 'opacity-70' : 'hover:shadow-md'}`}>
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex gap-2">
                              {hasCompletedAttempt && (
                                <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full">
                                  Attempts: {completedAttempts.length}/3
                                </span>
                              )}
                              {test.expires_at && (
                                <span className={`${isExpired ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'} text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full`}>
                                  {expiryText}
                                </span>
                              )}
                              {!test.expires_at && !hasCompletedAttempt && (
                                <span className="bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full">New</span>
                              )}
                            </div>
                          </div>
                          <h3 className="font-bold text-lg text-[#262626] mb-2">{test.title}</h3>

                          <div className="flex items-center gap-4 text-xs font-medium text-foreground/50 mb-4">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {test.exam_test_sections?.reduce((acc: number, curr: any) => acc + curr.duration_minutes, 0)} Mins
                            </div>
                            <div className="flex items-center gap-1.5">
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              {test.exam_test_sections?.length} Sections
                            </div>
                          </div>

                          {/* Review buttons for past attempts */}
                          {completedAttempts.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {completedAttempts.map((att: any) => (
                                <button
                                  key={att.id}
                                  onClick={() => setLocation(`/portal/test/${test.id}?review_attempt=${att.id}`)}
                                  className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                                >
                                  Review Attempt {att.attempt_number || completedAttempts.indexOf(att) + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {hasCompletedAttempt && canReattempt && !isExpired ? (
                          <Button
                            onClick={() => setLocation(`/portal/test/${test.id}`)}
                            className="w-full bg-primary hover:bg-primary/90 text-white gap-2 transition-all"
                          >
                            Reattempt (Attempt {completedAttempts.length + 1}) <ChevronRight className="w-4 h-4" />
                          </Button>
                        ) : hasCompletedAttempt && !canReattempt ? (
                          <Button
                            disabled
                            variant="outline"
                            className="w-full border-black/10 text-foreground/40 cursor-not-allowed"
                          >
                            All 3 Attempts Used
                          </Button>
                        ) : isExpired ? (
                          <Button
                            disabled
                            className="w-full bg-gray-200 text-gray-500 cursor-not-allowed"
                          >
                            Missed Deadline
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setLocation(`/portal/test/${test.id}`)}
                            className="w-full bg-primary hover:bg-primary/90 text-white gap-2 group-hover:shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] transition-all"
                          >
                            Start Test <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )})}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#262626]">Advanced Performance Analytics</h2>
                  <p className="text-xs text-foreground/50 font-medium">Deep telemetry metrics, cognitive stamina, pacing analysis and mentor evaluations.</p>
                </div>
                
                {/* Attempt Selector Dropdown */}
                {pastAttempts.length > 0 && (
                  <select 
                    className="h-10 px-4 rounded-xl border border-black/10 bg-white text-xs font-bold text-[#262626] focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm min-w-[240px]"
                    value={selectedAttemptId || 'overall'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'overall') {
                        setSelectedAttemptId('overall');
                      } else {
                        setSelectedAttemptId(val);
                        fetchAttemptDetails(val);
                      }
                    }}
                  >
                    <option value="overall">📊 Overall Profile Summary</option>
                    {pastAttempts.map((attempt, index) => (
                      <option key={attempt.id} value={attempt.id}>
                        📝 {attempt.exam_tests?.title || 'Mock Test'} (Attempt {pastAttempts.length - index})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* OVERALL PERFORMANCE PROFILE */}
              {(selectedAttemptId === 'overall' || !selectedAttemptId || pastAttempts.length === 0) ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">Total Tests Attempted</div>
                      <div className="text-3xl font-black text-[#262626]">{pastAttempts.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">Average Part A Score</div>
                      <div className="text-3xl font-black text-green-600">
                        {pastAttempts.length === 0 ? '—' : 
                          Math.round(pastAttempts.reduce((acc, a) => acc + (a.total_part_a > 0 ? (a.score_part_a / a.total_part_a) * 100 : 0), 0) / pastAttempts.length) + '%'}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">Best Part A Score</div>
                      <div className="text-3xl font-black text-primary">
                        {pastAttempts.length === 0 ? '—' :
                          (() => { const best = pastAttempts.reduce((b, a) => (a.score_part_a > b.score_part_a ? a : b), pastAttempts[0]); return `${best.score_part_a}/${best.total_part_a}`; })()
                        }
                      </div>
                    </div>
                  </div>

                  {pastAttempts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Accuracy Bar Chart */}
                      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-6">Historical Accuracy Trends</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pastAttempts.map((a, i) => ({ name: `Attempt ${pastAttempts.length - i}`, accuracy: a.total_part_a > 0 ? Math.round((a.score_part_a / a.total_part_a) * 100) : 0 })).reverse()}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dx={-10} domain={[0, 100]} />
                              <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                              <Bar dataKey="accuracy" fill="#FF6B6B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Cumulative Radar Chart */}
                      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-6">Estimated Core Design Skills</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                              { subject: 'Visualisation', A: pastAttempts[0]?.score_part_a && pastAttempts[0]?.total_part_a ? Math.min(100, Number(((pastAttempts[0].score_part_a / pastAttempts[0].total_part_a) * 110).toFixed(2))) : 0, fullMark: 100 },
                              { subject: 'Observation', A: pastAttempts[0]?.score_part_a && pastAttempts[0]?.total_part_a ? Math.min(100, Number(((pastAttempts[0].score_part_a / pastAttempts[0].total_part_a) * 90).toFixed(2))) : 0, fullMark: 100 },
                              { subject: 'Aptitude', A: pastAttempts[0]?.score_part_a && pastAttempts[0]?.total_part_a ? Math.min(100, Number(((pastAttempts[0].score_part_a / pastAttempts[0].total_part_a) * 105).toFixed(2))) : 0, fullMark: 100 },
                              { subject: 'GK', A: pastAttempts[0]?.score_part_a && pastAttempts[0]?.total_part_a ? Math.min(100, Number(((pastAttempts[0].score_part_a / pastAttempts[0].total_part_a) * 85).toFixed(2))) : 0, fullMark: 100 },
                              { subject: 'Creativity', A: pastAttempts[0]?.part_b_answered ? Math.min(100, pastAttempts[0].part_b_answered * 25) : 0, fullMark: 100 },
                            ]}>
                              <PolarGrid stroke="#E5E7EB" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar name="Skills" dataKey="A" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.4} />
                              <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                                formatter={(value: any) => [typeof value === 'number' ? `${Number(value.toFixed(2))}%` : value, 'Skills']}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-12 text-center">
                      <Clock className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                      <h4 className="font-bold text-lg text-[#262626] mb-1">No Exam Attempts Logged</h4>
                      <p className="text-sm text-foreground/50 max-w-md mx-auto">Complete standard mock tests inside the portal. Detailed, millisecond-accurate telemetry dashboards will pop up automatically!</p>
                    </div>
                  )}
                </>
              ) : (
                /* DEEP TELEMETRY DRILL DOWN FOR SPECIFIC ATTEMPT */
                (() => {
                  const attemptId = selectedAttemptId;
                  const loadingDetails = loadingDetailsMap[attemptId];
                  const details = attemptDetailsMap[attemptId];
                  const attemptObj = pastAttempts.find(a => a.id === attemptId);

                  if (loadingDetails || !details) {
                    return (
                      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-24 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <h4 className="font-bold text-[#262626] text-sm">Parsing attempt telemetry data...</h4>
                        <p className="text-xs text-foreground/40 mt-1">Calculating pacing quotients, difficulty matrices and cognitive curves.</p>
                      </div>
                    );
                  }

                  const responses = details.responses || [];
                  const scatterData = getScatterData(responses);
                  const quadCounts = getQuadrantCounts(responses);
                  const radarData = getConceptMasteryData(responses);
                  const wastage = getTimeWastage(responses);
                  const payoff = getReviewPayoff(responses);
                  const staminaData = getCognitiveStaminaData(responses);
                  
                  const formatSecs = (s: number) => {
                    const m = Math.floor(s / 60);
                    const remSec = s % 60;
                    return m > 0 ? `${m}m ${remSec}s` : `${remSec}s`;
                  };

                  return (
                    <div className="space-y-6">
                      {/* Split Sub Tabs */}
                      <div className="flex border-b border-black/10">
                        <button
                          onClick={() => setAnalyticsSubTab('part-a')}
                          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${analyticsSubTab === 'part-a' ? 'border-primary text-primary' : 'border-transparent text-foreground/50 hover:text-foreground'}`}
                        >
                          Part A: Objective Pacing & Strategy
                        </button>
                        <button
                          onClick={() => setAnalyticsSubTab('part-b')}
                          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${analyticsSubTab === 'part-b' ? 'border-primary text-primary' : 'border-transparent text-foreground/50 hover:text-foreground'}`}
                        >
                          Part B: Subjective Design Rubrics
                        </button>
                      </div>

                      {/* PART A DRILLDOWN */}
                      {analyticsSubTab === 'part-a' && (
                        <div className="space-y-6">
                          {/* Part A Cards Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1">Part A Score</p>
                              <p className="text-2xl font-black text-[#262626]">{attemptObj?.score_part_a || 0} <span className="text-sm font-semibold text-foreground/40">/ {attemptObj?.total_part_a || 0}</span></p>
                              <div className="mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                {attemptObj?.total_part_a > 0 ? Math.round((attemptObj.score_part_a / attemptObj.total_part_a) * 100) : 0}% Accuracy
                              </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1">Time Spent (Part A)</p>
                              <p className="text-2xl font-black text-[#262626]">{formatSecs(wastage.totalTime)}</p>
                              <p className="text-xs text-foreground/50 font-medium mt-1">Average Pacing: {formatSecs(Math.round(wastage.totalTime / Math.max(1, responses.filter((r: any) => r.exam_questions?.part === 'A').length)))} / question</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1">Time Wastage Ratio</p>
                              <p className="text-2xl font-black text-orange-600">{wastage.wastedPercent}%</p>
                              <p className="text-xs text-foreground/50 font-medium mt-1">{formatSecs(wastage.wastedTime)} spent on incorrect / skipped q's.</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1">Review Payoff Index</p>
                              <p className={`text-2xl font-black ${payoff.netPayoff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {payoff.netPayoff >= 0 ? `+${payoff.netPayoff}` : payoff.netPayoff} Marks
                              </p>
                              <p className="text-xs text-foreground/50 font-medium mt-1">From {payoff.markedCount} questions flagged for review.</p>
                            </div>
                          </div>

                          {/* Chronological Ribbon */}
                          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-4">Attempt Strategy Ribbon (Question-by-Question path)</h3>
                            <div className="flex flex-wrap gap-2.5">
                              {responses.filter((r: any) => r.exam_questions?.part === 'A').map((resp: any, i: number) => {
                                const borderClass = resp.answer_changes > 1 ? 'border-amber-400 border-2 animate-pulse' : 'border-black/5 border';
                                let bgClass = 'bg-gray-100 text-foreground/40';
                                if (resp.status === 'answered' || resp.status === 'marked') {
                                  bgClass = resp.isCorrect 
                                    ? 'bg-green-50 text-green-700 font-bold border-green-200' 
                                    : 'bg-red-50 text-red-700 font-bold border-red-200';
                                }

                                const wasMarked = (resp.state_transitions || []).some((t: any) => t.action === 'marked') || resp.status === 'marked';

                                return (
                                  <div key={resp.id} className="relative group cursor-pointer">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${bgClass} ${borderClass} transition-all hover:scale-105 shadow-sm`}>
                                      {i + 1}
                                      {wasMarked && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                                      )}
                                    </div>
                                    
                                    {/* Glassmorphic Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-56 p-3 bg-[#1A1A1A] text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-white/10">
                                      <p className="font-bold border-b border-white/10 pb-1 mb-1.5 flex justify-between">
                                        <span>Q{i + 1} ({resp.exam_questions?.type})</span>
                                        <span className={resp.isCorrect ? 'text-green-400' : 'text-red-400'}>
                                          {resp.isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                      </p>
                                      <p className="mb-0.5"><span className="text-white/40">Topic:</span> {resp.exam_questions?.topics?.[0] || 'General'}</p>
                                      <p className="mb-0.5"><span className="text-white/40">Time Spent:</span> {resp.time_spent || 0}s (Avg: {resp.communityAvgTime || 45}s)</p>
                                      <p className="mb-0.5"><span className="text-white/40">Difficulty:</span> {resp.exam_questions?.difficulty}</p>
                                      <p><span className="text-white/40">Adjustments:</span> {resp.answer_changes || 0} times</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-bold text-foreground/50">
                              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-50 border border-green-200 rounded-md" /> Correct</div>
                              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-50 border border-red-200 rounded-md" /> Incorrect</div>
                              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-100 rounded-md" /> Unattempted</div>
                              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-full" /> Marked for Review</div>
                              <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-amber-400 rounded-md bg-white" /> Changed (Panic)</div>
                            </div>
                          </div>

                          {/* Charts Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Scatter Speed Quadrants */}
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col justify-between">
                              <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1">Speed vs. Accuracy Quadrants</h3>
                                <p className="text-[10px] text-foreground/40 font-medium mb-6">Scatter map of time spent (seconds) vs difficulty level.</p>
                              </div>
                              <div className="h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis type="number" dataKey="timeSpent" name="Time" unit="s" label={{ value: 'Time Spent (s)', position: 'insideBottom', offset: -10, fill: '#6B7280', fontSize: 10 }} />
                                    <YAxis type="number" dataKey="difficulty" name="Difficulty" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={(val) => val === 1 ? 'Low' : val === 2 ? 'Med' : val === 3 ? 'High' : ''} label={{ value: 'Difficulty Level', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
                                    <Scatter name="Telemetry Questions" data={scatterData}>
                                      {scatterData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isCorrect ? '#10B981' : entry.status === 'unseen' ? '#9CA3AF' : '#EF4444'} />
                                      ))}
                                    </Scatter>
                                  </ScatterChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold border-t border-black/5 pt-3">
                                <div className="p-2 bg-green-50/50 rounded-lg"><span className="text-green-700">🎯 Sweet Spot: {quadCounts.sweetSpot}</span> (Correct & Fast)</div>
                                <div className="p-2 bg-blue-50/50 rounded-lg"><span className="text-blue-700">🧠 Overthinking: {quadCounts.overthinking}</span> (Correct & Slow)</div>
                                <div className="p-2 bg-yellow-50/50 rounded-lg"><span className="text-amber-700">⚡ Careless/Rushed: {quadCounts.rushed}</span> (Incorrect & Fast)</div>
                                <div className="p-2 bg-red-50/50 rounded-lg"><span className="text-red-700">⏳ Stuck: {quadCounts.stuck}</span> (Incorrect & Slow)</div>
                              </div>
                            </div>

                            {/* Dynamics Concept Mastery Radar */}
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-6">Topic Mastery Strength (Difficulty-Weighted)</h3>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#E5E7EB" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Mastery" dataKey="A" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.4} />
                                    <RechartsTooltip 
                                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                                      formatter={(value: any) => [typeof value === 'number' ? `${Number(value.toFixed(2))}%` : value, 'Mastery']}
                                    />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="text-[10px] font-medium text-foreground/40 mt-4 text-center">Score values are weighted based on question difficulty: Low (1x), Med (2x), High (3x) weight points.</p>
                            </div>
                          </div>

                          {/* Community Benchmark Bar Charts */}
                          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1">Your Pacing vs. Community Average</h3>
                            <p className="text-[10px] text-foreground/40 font-medium mb-6">Comparison of your seconds spent per question versus candidate population benchmarks.</p>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={responses.filter((r: any) => r.exam_questions?.part === 'A').map((resp: any, i: number) => ({ name: `Q${i + 1}`, You: resp.time_spent || 0, Community: resp.communityAvgTime || 45 }))}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                                  <Bar dataKey="You" fill="#FF6B6B" radius={[3, 3, 0, 0]} maxBarSize={20} />
                                  <Bar dataKey="Community" fill="#E5E7EB" radius={[3, 3, 0, 0]} maxBarSize={20} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Cognitive Fatigue & Stamina Profile Widget */}
                          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                              <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1">Cognitive Fatigue & Stamina Profile</h3>
                                <p className="text-[10px] text-foreground/40 font-medium">Endurance analysis comparing the first 50% vs final 50% of your mock test attempts.</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-foreground/40 block uppercase tracking-wider">Stamina Score</span>
                                  <span className={`text-2xl font-black ${staminaData.staminaScore >= 80 ? 'text-green-600' : staminaData.staminaScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {staminaData.staminaScore}/100
                                  </span>
                                </div>
                                <div className="w-12 h-12 rounded-full border-4 border-black/5 flex items-center justify-center relative">
                                  <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${staminaData.staminaScore >= 80 ? 'border-green-500' : staminaData.staminaScore >= 50 ? 'border-amber-500' : 'border-red-500'} animate-spin-slow`} style={{ transform: `rotate(${staminaData.staminaScore * 3.6}deg)` }} />
                                  <span className="text-xs font-black text-[#262626]">{staminaData.staminaScore}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Stamina metrics comparison chart */}
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={[
                                      { name: 'First Half', Pacing: staminaData.firstHalfPacing, Accuracy: staminaData.firstHalfAccuracy },
                                      { name: 'Second Half', Pacing: staminaData.secondHalfPacing, Accuracy: staminaData.secondHalfAccuracy }
                                    ]}
                                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <Bar dataKey="Pacing" name="Avg Speed (s)" fill="#FF6B6B" radius={[3, 3, 0, 0]} maxBarSize={25} />
                                    <Bar dataKey="Accuracy" name="Accuracy (%)" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={25} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Stamina details and critique panel */}
                              <div className="flex flex-col justify-between space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-center">
                                  <div className="p-3 bg-black/5 rounded-xl">
                                    <span className="text-[9px] font-bold uppercase text-foreground/40 block">Pacing Decay Index</span>
                                    <span className={`text-md font-black block mt-0.5 ${staminaData.pacingDecay > 1.15 ? 'text-red-500' : staminaData.pacingDecay < 0.85 ? 'text-amber-600' : 'text-green-600'}`}>
                                      {staminaData.pacingDecay.toFixed(2)}x
                                    </span>
                                    <span className="text-[9px] font-semibold text-foreground/50">
                                      {staminaData.pacingDecay > 1.0 ? 'Deceleration' : 'Acceleration'}
                                    </span>
                                  </div>
                                  <div className="p-3 bg-black/5 rounded-xl">
                                    <span className="text-[9px] font-bold uppercase text-foreground/40 block">Accuracy Drop</span>
                                    <span className={`text-md font-black block mt-0.5 ${staminaData.accuracyDrop > 10 ? 'text-red-500' : staminaData.accuracyDrop > 0 ? 'text-amber-500' : 'text-green-600'}`}>
                                      {staminaData.accuracyDrop > 0 ? `+${staminaData.accuracyDrop}%` : `${staminaData.accuracyDrop}%`}
                                    </span>
                                    <span className="text-[9px] font-semibold text-foreground/50">
                                      {staminaData.accuracyDrop > 0 ? 'Accuracy Decay' : 'Stamina Growth'}
                                    </span>
                                  </div>
                                </div>

                                {/* Dynamic alert-style callout critique */}
                                <div className={`p-4 rounded-xl border flex gap-3 text-xs font-semibold leading-relaxed ${staminaData.state === 'flow' ? 'bg-green-50 border-green-200 text-green-800' : staminaData.state === 'panic' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                  {staminaData.state === 'flow' ? (
                                    <Sparkles className="w-5 h-5 text-green-600 shrink-0" />
                                  ) : (
                                    <Lightbulb className="w-5 h-5 shrink-0 text-amber-600" />
                                  )}
                                  <div>
                                    <span className="font-bold block mb-0.5">{staminaData.state === 'flow' ? 'Optimal Flow State' : staminaData.state === 'panic' ? 'Rushing Detected' : 'Endurance Exhaustion'}</span>
                                    {staminaData.critique}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PART B DRILLDOWN */}
                      {analyticsSubTab === 'part-b' && (
                        <div className="space-y-6">
                          {attemptObj?.part_b_evaluation_status !== 'completed' ? (
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-16 text-center">
                              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                              <h4 className="font-bold text-lg text-[#262626] mb-1">Part B Evaluation Awaiting 🎨</h4>
                              <p className="text-sm text-foreground/50 max-w-sm mx-auto animate-fadeIn">Your subjective sketches and drawings are currently under review by our design mentors. Rubrics, scoring matrices, and loom recordings will post immediately when published!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Rubric metrics chart */}
                              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-6">Subjective Rubric Proficiency</h3>
                                </div>
                                <div className="h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getPartBRubricAverages(responses)}>
                                      <PolarGrid stroke="#E5E7EB" />
                                      <PolarAngleAxis dataKey="criteria" tick={{ fill: '#6B7280', fontSize: 10 }} />
                                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                      <Radar name="Grade Score %" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                                      <RechartsTooltip />
                                    </RadarChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="text-[10px] font-bold text-foreground/50 border-t border-black/5 pt-3 text-center">
                                  Based on evaluation of {responses.filter((r: any) => r.exam_questions?.part === 'B').length} subjective answers.
                                </div>
                              </div>

                              {/* Mentoring Room */}
                              <div className="space-y-6">
                                {/* Mentor feedback loop details */}
                                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-4 flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-green-500" /> Mentor Comments & Portfolio Upgrades
                                  </h3>
                                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {responses.filter((r: any) => r.exam_questions?.part === 'B').map((r: any, i: number) => (
                                      <div key={r.id} className="border-b border-black/5 pb-3 last:border-0 last:pb-0">
                                        <p className="text-xs font-bold text-primary mb-1">Question {i + 1} ({r.exam_questions?.topics?.[0] || 'Subjective Sketching'})</p>
                                        <p className="text-xs font-semibold text-[#262626]">Marks: <span className="text-green-600">{r.marks_awarded || '—'} / 20</span></p>
                                        
                                        {r.mentor_comments && (
                                          <div className="bg-black/5 p-2 rounded-lg text-xs mt-2 font-medium text-foreground/70">
                                            <span className="font-bold text-foreground block mb-0.5">Critique:</span>
                                            {r.mentor_comments}
                                          </div>
                                        )}
                                        {r.mentor_improvements && (
                                          <div className="bg-green-50/50 p-2 rounded-lg text-xs mt-1.5 font-medium text-green-800">
                                            <span className="font-bold text-green-900 block mb-0.5">Actions to Improve:</span>
                                            {r.mentor_improvements}
                                          </div>
                                        )}
                                        
                                        {r.mentor_loom_link && (
                                          <div className="mt-2.5">
                                            <a 
                                              href={r.mentor_loom_link} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-md transition-colors"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" /> Watch Video Critique
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Attempts Accordion */}
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                <h3 className="text-sm font-bold text-[#262626] mb-6">Detailed Test History</h3>
                {loadingAttempts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : pastAttempts.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h3 className="font-bold text-[#262626] mb-2">No completed attempts yet</h3>
                    <p className="text-sm text-foreground/50">Your results will appear here once you complete a test.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastAttempts.map((attempt, i) => {
                      const scoreA = attempt.score_part_a || 0;
                      const totalA = attempt.total_part_a || 0;
                      const partAPercent = totalA > 0 ? Math.round((scoreA / totalA) * 100) : 0;
                      const partBAns = attempt.part_b_answered || 0;
                      const completedDate = attempt.completed_at 
                        ? new Date(attempt.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
                        : '—';
                      const attemptNumber = attempt.attempt_number || (pastAttempts.length - i);

                      return (
                        <div 
                          key={attempt.id} 
                          className="bg-white border border-black/5 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          {/* Test Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                              #{attemptNumber}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-[#262626] truncate">{attempt.exam_tests?.title || 'Unknown Test'}</h4>
                                <span className="bg-black/5 text-foreground/70 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                                  Attempt {attemptNumber}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/40 font-medium mt-0.5">Completed: {completedDate}</p>
                            </div>
                          </div>

                          {/* Scores & Status (First Level) */}
                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs shrink-0">
                            {/* Part A */}
                            {totalA > 0 && (
                              <div className="bg-gray-50 border border-black/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <span className="text-foreground/50 font-bold text-[10px] uppercase tracking-wider">Part A</span>
                                <span className="font-extrabold text-foreground">{scoreA}/{totalA}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${partAPercent >= 70 ? 'bg-green-100 text-green-700' : partAPercent >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                  {partAPercent}%
                                </span>
                              </div>
                            )}

                            {/* Part B */}
                            <div className="bg-gray-50 border border-black/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <span className="text-foreground/50 font-bold text-[10px] uppercase tracking-wider">Part B</span>
                              {attempt.part_b_evaluation_status === 'completed' && attempt.score_part_b !== null ? (
                                <span className="font-extrabold text-green-600">{attempt.score_part_b} Marks</span>
                              ) : partBAns > 0 ? (
                                <span className="font-bold text-orange-600 text-[11px] bg-orange-50 px-2 py-0.5 rounded">Pending Eval</span>
                              ) : (
                                <span className="font-medium text-foreground/40 text-[11px]">Unanswered</span>
                              )}
                            </div>

                            {/* Total Score */}
                            {attempt.total_score !== null && (
                              <div className="bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                                <span className="text-primary font-bold text-[10px] uppercase tracking-wider">Total</span>
                                <span className="font-black text-primary text-sm">{attempt.total_score}</span>
                              </div>
                            )}
                          </div>

                          {/* Direct Action Button */}
                          <div className="shrink-0 flex items-center">
                            <Button 
                              variant="outline" 
                              onClick={() => setLocation(`/portal/test/${attempt.test_id}?review_attempt=${attempt.id}`)}
                              className="w-full md:w-auto font-bold border-primary text-primary hover:bg-primary/5 h-9 text-xs gap-1.5 px-4 shadow-sm"
                            >
                              Review Scorecard & Answers <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FEATURE REQUESTS BOARD TAB */}
          {activeTab === 'features' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#262626]">Community Suggestion & Feature Board</h2>
                  <p className="text-xs text-foreground/50 font-medium">Request upgrades you'd love to see on the portal and upvote ideas from other designers.</p>
                </div>
                <Button 
                  onClick={() => setShowNewFeatureModal(true)} 
                  className="bg-primary hover:bg-primary/95 text-white font-bold shadow-md rounded-xl flex items-center gap-2 h-10 px-5"
                >
                  <Plus className="w-4 h-4" /> Propose Upgrade
                </Button>
              </div>

              {loadingFeatures ? (
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-20 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : featureRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-16 text-center">
                  <Sparkles className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <h3 className="font-bold text-[#262626] mb-1">No suggestions yet</h3>
                  <p className="text-sm text-foreground/50 max-w-sm mx-auto mb-4">Be the first to suggest an enhancement or new tools for the student workspace!</p>
                  <Button onClick={() => setShowNewFeatureModal(true)} variant="outline" className="border-primary text-primary font-bold">
                    Create Suggestion
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {featureRequests.map((req: any) => {
                    const votesArray = req.votes || [];
                    const upvoteCount = votesArray.length;
                    const hasVoted = candidate && votesArray.includes(candidate.id);
                    const formattedDate = req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
                    
                    let statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                    let statusLabel = "Under Review";
                    if (req.status === 'under_review') {
                      statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                      statusLabel = "Awaiting Critique";
                    } else if (req.status === 'planned') {
                      statusColor = "bg-purple-50 text-purple-700 border-purple-200";
                      statusLabel = "In Roadmap";
                    } else if (req.status === 'completed') {
                      statusColor = "bg-green-50 text-green-700 border-green-200";
                      statusLabel = "Completed";
                    }

                    return (
                      <div key={req.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex gap-4 hover:border-black/10 transition-colors">
                        {/* Vote Button */}
                        <button 
                          onClick={() => handleVoteFeatureRequest(req.id, votesArray)}
                          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border transition-all shrink-0 hover:scale-102 ${hasVoted ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-black/5 hover:bg-black/8 border-transparent text-foreground/60'}`}
                        >
                          <ThumbsUp className={`w-4 h-4 mb-0.5 ${hasVoted ? 'fill-primary' : ''}`} />
                          <span className="text-xs font-black">{upvoteCount}</span>
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h4 className="font-bold text-[#262626] text-md">{req.title}</h4>
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-black/5 rounded-full text-foreground/50 border border-black/5">{req.category}</span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor} ml-auto`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-foreground/60 mb-2 leading-relaxed whitespace-pre-wrap">{req.description}</p>
                          <div className="text-[10px] text-foreground/40 font-semibold">
                            By {req.exam_candidates?.name || 'Student'} on {formattedDate}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Create Request Modal Dialog */}
              <Dialog open={showNewFeatureModal} onOpenChange={setShowNewFeatureModal}>
                <DialogContent className="sm:max-w-[480px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-black text-xl text-[#262626] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" /> Propose Workspace Upgrade
                    </DialogTitle>
                    <DialogDescription className="text-xs">Suggest features or resources that would elevate your design exam preparation portal.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs font-bold text-foreground/70 uppercase">Suggestion Title</Label>
                      <Input 
                        id="title" 
                        value={newFeatureTitle}
                        onChange={(e) => setNewFeatureTitle(e.target.value)}
                        placeholder="Ex: Add perspective sketching video guides"
                        className="rounded-xl border-black/10 focus:border-primary text-sm font-semibold h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-xs font-bold text-foreground/70 uppercase">Category</Label>
                      <select 
                        id="category"
                        value={newFeatureCategory}
                        onChange={(e) => setNewFeatureCategory(e.target.value)}
                        className="w-full h-10 px-3.5 text-sm font-semibold rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="general">General Upgrades</option>
                        <option value="analytics">Performance Analytics</option>
                        <option value="materials">Study Materials</option>
                        <option value="practice">Practice Tests</option>
                        <option value="ui">User Interface & Design</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="desc" className="text-xs font-bold text-foreground/70 uppercase">Explanation / Rationale</Label>
                      <textarea
                        id="desc" 
                        value={newFeatureDescription}
                        onChange={(e) => setNewFeatureDescription(e.target.value)}
                        placeholder="Describe how this feature will help you or other candidates prepare better..."
                        rows={4}
                        className="w-full text-sm font-medium border border-black/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setShowNewFeatureModal(false)} className="font-bold border-black/10 rounded-xl h-10">Cancel</Button>
                    <Button 
                      onClick={handleCreateFeatureRequest} 
                      disabled={submittingFeature} 
                      className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl h-10 px-5"
                    >
                      {submittingFeature ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Proposal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-lg font-semibold text-[#262626]">Global Leaderboard (Top 10)</h2>
                
                <select 
                  className="h-10 px-4 rounded-xl border border-black/10 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm min-w-[200px]"
                  value={leaderboardFilterTestId}
                  onChange={(e) => setLeaderboardFilterTestId(e.target.value)}
                >
                  <option value="all">All Tests ({candidate?.education_level === 'masters' ? 'M.Des' : 'B.Des'})</option>
                  {activeTests.map(test => (
                    <option key={test.id} value={test.id}>{test.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 overflow-hidden">
                {loadingLeaderboard ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-16">
                    <Trophy className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h3 className="font-bold text-[#262626] mb-2">No rankings available yet</h3>
                    <p className="text-sm text-foreground/50">Be the first to complete a test and get on the board!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/5 text-xs uppercase tracking-wider text-foreground/50">
                          <th className="pb-4 font-semibold px-4 w-16">Rank</th>
                          <th className="pb-4 font-semibold px-4">Candidate</th>
                          <th className="pb-4 font-semibold px-4 hidden sm:table-cell">Test</th>
                          <th className="pb-4 font-semibold px-4 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {leaderboard.map((entry, index) => {
                          const isTop3 = index < 3;
                          const rankColor = index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-foreground/70';
                          return (
                            <tr key={entry.id} className="group hover:bg-black/5 transition-colors">
                              <td className="py-4 px-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankColor}`}>
                                  {index + 1}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  {entry.exam_candidates?.avatar_url ? (
                                    <img src={entry.exam_candidates.avatar_url} className="w-10 h-10 rounded-full object-cover border border-black/10" alt="Avatar" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                      {entry.exam_candidates?.name?.charAt(0) || '?'}
                                    </div>
                                  )}
                                  <div className="font-bold text-[#262626]">
                                    {entry.exam_candidates?.name || 'Unknown User'}
                                    {entry.exam_candidates?.access_level === 'focus_batch' && (
                                      <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                        <Shield className="w-2.5 h-2.5" /> FB
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-foreground/60 hidden sm:table-cell">
                                {entry.exam_tests?.title || 'Unknown Test'}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  {entry.total_score !== null ? (
                                    <>
                                      <span className="font-bold text-lg text-primary">{entry.total_score}</span>
                                      <span className="text-xs text-foreground/40 font-medium">Total</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-bold text-lg text-green-600">{entry.score_part_a}</span>
                                      <span className="text-xs text-foreground/40 font-medium">/ {entry.total_part_a}</span>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Part A / Part B Toggle */}
              <div className="flex gap-2">
                {(['A', 'B'] as const).map(p => (
                  <button key={p} onClick={() => { setQuestionPartFilter(p); setTimeout(fetchQuestions, 0); }}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${questionPartFilter === p ? 'bg-primary text-white shadow-md' : 'bg-white text-foreground/60 border border-black/10 hover:bg-black/5'}`}
                  >Part {p}</button>
                ))}
              </div>
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select value={questionTypeFilter} onChange={e => { setQuestionTypeFilter(e.target.value); setTimeout(fetchQuestions, 0); }}
                  className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm">
                  <option value="all">All Types</option>
                  {questionPartFilter === 'A' ? (<><option value="MCQ">MCQ</option><option value="MSQ">MSQ</option><option value="NAT">NAT</option></>) : (<option value="SUBJECTIVE">Subjective</option>)}
                </select>
                <select value={questionDifficultyFilter} onChange={e => { setQuestionDifficultyFilter(e.target.value); setTimeout(fetchQuestions, 0); }}
                  className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm">
                  <option value="all">All Difficulty</option>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
                <input placeholder="Filter by topic..." value={questionTopicFilter} onChange={e => setQuestionTopicFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm w-48" />
              </div>
              {/* Questions */}
              {loadingQuestions ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : questions.filter(q => !questionTopicFilter || (q.topics || []).some((t: string) => t.toLowerCase().includes(questionTopicFilter.toLowerCase()))).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-black/5">
                  <BookOpen className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <h3 className="font-bold text-[#262626] mb-2">No questions found</h3>
                  <p className="text-sm text-foreground/50">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.filter(q => !questionTopicFilter || (q.topics || []).some((t: string) => t.toLowerCase().includes(questionTopicFilter.toLowerCase()))).map(q => (
                    <div key={q.id} className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{q.type}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.difficulty === 'High' ? 'bg-red-100 text-red-700' : q.difficulty === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{q.difficulty}</span>
                          {q.pyq_tag && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">{q.pyq_tag}</span>}
                        </div>
                        {(q.topics || []).map((t: string) => <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 text-foreground/60">{t}</span>)}
                      </div>
                      <div className="prose prose-sm max-w-none text-[#262626] mb-4" dangerouslySetInnerHTML={{ __html: q.content_text || '' }} />
                      {q.media_url && <img src={q.media_url} alt="Question media" className="max-w-md rounded-lg border border-black/10 mb-4" />}
                      {questionPartFilter === 'A' && questionOptions[q.id] && (
                        <div className="mt-4 border-t border-black/5 pt-4">
                          <button onClick={() => setShowAnswers(prev => ({ ...prev, [q.id]: !prev[q.id] }))} className="flex items-center gap-2 text-sm font-medium text-primary mb-3 hover:underline">
                            {showAnswers[q.id] ? <><EyeOff className="w-4 h-4" /> Hide Answer</> : <><Eye className="w-4 h-4" /> Show Answer</>}
                          </button>
                          {showAnswers[q.id] && (
                            <div className="space-y-2">
                              {questionOptions[q.id].map((opt: any) => (
                                <div key={opt.id} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${opt.is_correct ? 'bg-green-50 border border-green-200' : 'bg-black/5'}`}>
                                  <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${opt.is_correct ? 'bg-green-500 text-white' : 'bg-black/10 text-foreground/40'}`}>
                                    {opt.is_correct ? '✓' : ''}
                                  </span>
                                  <span>{opt.content_text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-wrap gap-3">
                <select value={materialExamFilter} onChange={e => setMaterialExamFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm">
                  <option value="all">All Exams</option>
                  <option value="UCEED">UCEED</option><option value="CEED">CEED</option><option value="NID">NID</option>
                </select>
                <select value={materialCategoryFilter} onChange={e => setMaterialCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm">
                  <option value="all">All Categories</option>
                  {Array.from(new Set(studyMaterials.map(m => m.category))).sort().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {loadingMaterials ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : studyMaterials.filter(m => (materialExamFilter === 'all' || m.target_exam === 'all' || m.target_exam === materialExamFilter) && (materialCategoryFilter === 'all' || m.category === materialCategoryFilter)).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-black/5">
                  <Lightbulb className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <h3 className="font-bold text-[#262626] mb-2">No study materials available</h3>
                  <p className="text-sm text-foreground/50">New materials will appear here when added.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studyMaterials.filter(m => (materialExamFilter === 'all' || m.target_exam === 'all' || m.target_exam === materialExamFilter) && (materialCategoryFilter === 'all' || m.category === materialCategoryFilter)).map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-[#262626]">{m.title}</h3>
                        <div className="flex gap-2">
                          {m.is_focus_batch_exclusive && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1"><Star className="w-3 h-3" /> Exclusive</span>}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 text-foreground/60">{m.category}</span>
                          {m.target_exam !== 'all' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{m.target_exam}</span>}
                        </div>
                      </div>
                      {m.description && <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{m.description}</p>}
                      <div className="flex gap-2">
                        {m.file_url && <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"><Download className="w-3.5 h-3.5" /> Download</a>}
                        {m.external_url && <a href={m.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"><ExternalLink className="w-3.5 h-3.5" /> Open Link</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loadingAssignments ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-black/5">
                  <ClipboardList className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <h3 className="font-bold text-[#262626] mb-2">No assignments yet</h3>
                  <p className="text-sm text-foreground/50">New assignments will appear here when posted.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map(a => {
                    const sub = assignmentSubmissions[a.id];
                    const isOverdue = a.due_date && new Date(a.due_date) < new Date();
                    return (
                      <div key={a.id} className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-[#262626]">{a.title}</h3>
                            {a.due_date && (
                              <p className={`text-xs font-medium mt-1 ${isOverdue ? 'text-red-500' : 'text-foreground/50'}`}>
                                Due: {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {isOverdue && ' (Overdue)'}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {a.target_exam !== 'all' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{a.target_exam}</span>}
                            {sub ? (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${sub.status === 'reviewed' ? 'bg-green-100 text-green-700' : sub.status === 'needs_revision' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {sub.status === 'reviewed' ? '✅ Reviewed' : sub.status === 'needs_revision' ? '⚠️ Needs Revision' : '📤 Submitted'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {a.description && <p className="text-sm text-foreground/60 mb-4">{a.description}</p>}
                        {a.content_text && <div className="prose prose-sm max-w-none text-foreground/70 mb-4 border-l-2 border-primary/20 pl-4" dangerouslySetInnerHTML={{ __html: a.content_text }} />}
                        {a.file_url && <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors mb-4"><Download className="w-3.5 h-3.5" /> Download Brief</a>}
                        
                        {/* Mentor Feedback (Focus Batch only gets detailed) */}
                        {sub && sub.status !== 'submitted' && (
                          <div className="mt-4 p-4 rounded-xl bg-black/5 border border-black/10">
                            <h4 className="text-sm font-bold text-[#262626] mb-2">Mentor Feedback</h4>
                            {isFocusBatch ? (
                              <div className="space-y-2">
                                {sub.mentor_comments && <div className="text-sm text-foreground/70"><strong>Comments:</strong> {sub.mentor_comments}</div>}
                                {sub.mentor_improvements && <div className="text-sm text-foreground/70"><strong>Improvements:</strong> {sub.mentor_improvements}</div>}
                                {sub.mentor_loom_link && <a href={sub.mentor_loom_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"><ExternalLink className="w-3.5 h-3.5" /> Watch Video Feedback</a>}
                              </div>
                            ) : (
                              <p className="text-sm text-foreground/50">Your work has been {sub.status === 'reviewed' ? 'reviewed' : 'marked for revision'}. Detailed feedback is available for Focus Batch students.</p>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-3">
                          {!sub ? (
                            <Button onClick={() => { setSelectedAssignment(a); setShowSubmitModal(true); }} className="bg-primary hover:bg-primary/90 text-white gap-2">
                              <Upload className="w-4 h-4" /> Submit Work
                            </Button>
                          ) : sub.status === 'needs_revision' ? (
                            <Button onClick={() => { setSelectedAssignment(a); setShowSubmitModal(true); setSubmissionText(sub.answer_text || ''); }} variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 gap-2">
                              <Upload className="w-4 h-4" /> Resubmit
                            </Button>
                          ) : sub.file_url ? (
                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black/5 text-foreground/60 text-sm font-medium hover:bg-black/10 transition-colors">
                              <Eye className="w-4 h-4" /> View Submission
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-wrap gap-3">
                <select value={notesExamFilter} onChange={e => setNotesExamFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm">
                  <option value="all">All Exams</option>
                  <option value="UCEED">UCEED</option><option value="CEED">CEED</option><option value="NID">NID</option>
                </select>
                <select value={notesCategoryFilter} onChange={e => setNotesCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm">
                  <option value="all">All Categories</option>
                  {Array.from(new Set(classNotes.map(n => n.category))).sort().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {loadingNotes ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : classNotes.filter(n => (notesExamFilter === 'all' || n.target_exam === 'all' || n.target_exam === notesExamFilter) && (notesCategoryFilter === 'all' || n.category === notesCategoryFilter)).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-black/5">
                  <FileText className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <h3 className="font-bold text-[#262626] mb-2">No class notes available</h3>
                  <p className="text-sm text-foreground/50">Notes will appear here when published.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classNotes.filter(n => (notesExamFilter === 'all' || n.target_exam === 'all' || n.target_exam === notesExamFilter) && (notesCategoryFilter === 'all' || n.category === notesCategoryFilter)).map(n => (
                    <div key={n.id} className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-[#262626]">{n.title}</h3>
                        <div className="flex gap-2">
                          {n.is_focus_batch_exclusive && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1"><Star className="w-3 h-3" /> Exclusive</span>}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 text-foreground/60">{n.category}</span>
                        </div>
                      </div>
                      {n.description && <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{n.description}</p>}
                      <div className="flex gap-2">
                        {n.file_url && <a href={n.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"><Download className="w-3.5 h-3.5" /> Download</a>}
                        {n.external_url && <a href={n.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"><ExternalLink className="w-3.5 h-3.5" /> Open Link</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-sm max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#262626]">Your Profile</h3>
                {candidate?.unique_id && (
                  <div className="bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg text-primary text-sm font-mono font-medium">
                    ID: {candidate.unique_id}
                  </div>
                )}
              </div>
              <form onSubmit={handleOnboardingSubmit} className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-black/5">
                  <div className="relative group cursor-pointer">
                    {onboardingData.avatar_url || candidate?.avatar_url ? (
                      <img src={onboardingData.avatar_url || candidate?.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-black/10" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium cursor-pointer transition-opacity">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#262626]">Profile Photo</h4>
                    <p className="text-xs text-foreground/50 mt-1">Image will be auto-compressed to under 40kb and resized to 200x200.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prof-name">Full Name *</Label>
                    <Input
                      id="prof-name"
                      value={onboardingData.name}
                      onChange={e => setOnboardingData({ ...onboardingData, name: e.target.value })}
                      required
                      className="bg-background/50 border-black/10 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prof-phone">Phone Number</Label>
                    <Input
                      id="prof-phone"
                      value={onboardingData.phone}
                      onChange={e => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                      className="bg-background/50 border-black/10 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Programs for Preparation *</Label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-black/10 bg-background/50 focus:bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    value={onboardingData.education_level}
                    onChange={e => setOnboardingData({ ...onboardingData, education_level: e.target.value })}
                    disabled={!!candidate}
                  >
                    <option value="bachelors">Bachelors (B.Des / UCEED targets)</option>
                    <option value="masters">Masters (M.Des / CEED targets)</option>
                  </select>
                  {candidate && <p className="text-[10px] text-foreground/50">To change your target program later, please contact support.</p>}
                </div>
                <Button type="submit" disabled={savingOnboarding} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white gap-2">
                  {savingOnboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Changes
                </Button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Onboarding Modal */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Complete your profile</DialogTitle>
            <DialogDescription>
              Just a few more details so we can assign the right mock tests to you.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOnboardingSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={onboardingData.name}
                onChange={e => setOnboardingData({ ...onboardingData, name: e.target.value })}
                required
                className="bg-background/50 border-black/10 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={onboardingData.phone}
                onChange={e => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                className="bg-background/50 border-black/10 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Programs for Preparation *</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-black/10 bg-background/50 focus:bg-white text-sm"
                value={onboardingData.education_level}
                onChange={e => setOnboardingData({ ...onboardingData, education_level: e.target.value })}
              >
                <option value="bachelors">Bachelors (B.Des / UCEED targets)</option>
                <option value="masters">Masters (M.Des / CEED targets)</option>
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={savingOnboarding} className="w-full bg-primary hover:bg-primary/90 text-white">
                {savingOnboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile & Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Premium Content Modal */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Premium Content</DialogTitle>
            <DialogDescription>
              Class Assignments and Notes are available for Focus Batch students and subscribers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <h4 className="font-bold text-[#262626] mb-1">Unlock for ₹4,999</h4>
              <p className="text-sm text-foreground/60 mb-3">Get access to all class assignments, notes, and study materials until April 30, {new Date().getMonth() >= 4 ? new Date().getFullYear() + 1 : new Date().getFullYear()}.</p>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Class Assignments with submission</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Class Notes & Study Materials</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Question Bank access</li>
              </ul>
            </div>
            {upgradeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{upgradeError}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button onClick={handleUpgradePayment} disabled={upgradingPayment} className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-12">
              {upgradingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {upgradingPayment ? 'Processing...' : 'Unlock Now — ₹4,999'}
            </Button>
            <a href="/focus-batch" className="text-center text-sm text-primary font-medium hover:underline">Learn more about the Focus Batch →</a>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Assignment Modal */}
      <Dialog open={showSubmitModal} onOpenChange={(open) => { setShowSubmitModal(open); if (!open) { setSubmissionFile(null); setSubmissionText(''); setSelectedAssignment(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>{selectedAssignment?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Upload File (PDF, Image) *</Label>
              <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={e => setSubmissionFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <textarea value={submissionText} onChange={e => setSubmissionText(e.target.value)} rows={3} placeholder="Any comments about your submission..." className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitAssignment} disabled={!submissionFile || submitting} className="w-full bg-primary hover:bg-primary/90 text-white gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {submitting ? 'Uploading...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
