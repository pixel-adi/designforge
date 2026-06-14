import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LayoutDashboard, Clock, FileText, User, LogOut, ChevronRight, CheckCircle2, Trophy, BookOpen, Lightbulb, ClipboardList, Lock, CreditCard, ExternalLink, Download, Eye, EyeOff, Upload, AlertCircle, Star, Shield } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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
  const [candidateAttemptsMap, setCandidateAttemptsMap] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardFilterTestId, setLeaderboardFilterTestId] = useState<string>('all');

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

  // Access level helpers
  const isPaidUser = candidate?.access_level === 'materials_only' || candidate?.access_level === 'focus_batch';
  const isAccessExpired = candidate?.access_expires_at && new Date(candidate.access_expires_at) < new Date();
  const hasActiveAccess = isPaidUser && !isAccessExpired;
  const isFocusBatch = candidate?.access_level === 'focus_batch' && !isAccessExpired;

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
        supabase.from('exam_attempts').select('id, test_id, status').eq('candidate_id', candidateId),
        supabase.from('exam_programs').select('id, name')
      ]);

      if (testsRes.error) throw testsRes.error;

      const tests = testsRes.data;
      const attempts = attemptsRes.data;
      const allPrograms = programsRes.data;

      const attemptMap: Record<string, any> = {};
      (attempts || []).forEach(a => { attemptMap[a.test_id] = a; });
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
      if (!error) setPastAttempts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttempts(false);
    }
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
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
                      const attempt = candidateAttemptsMap[test.id];
                      const hasCompletedAttempt = attempt?.status === 'completed';
                      
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

                          <div className="flex items-center gap-4 text-xs font-medium text-foreground/50 mb-6">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {test.exam_test_sections?.reduce((acc: number, curr: any) => acc + curr.duration_minutes, 0)} Mins
                            </div>
                            <div className="flex items-center gap-1.5">
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              {test.exam_test_sections?.length} Sections
                            </div>
                          </div>
                        </div>

                        {hasCompletedAttempt ? (
                          <Button
                            onClick={() => setLocation(`/portal/test/${test.id}?review_attempt=${attempt.id}`)}
                            variant="outline"
                            className="w-full border-primary text-primary hover:bg-primary/5 transition-all"
                          >
                            Review Attempt <ChevronRight className="w-4 h-4 ml-1" />
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#262626]">Performance Analytics</h2>
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                  <div className="text-sm font-semibold text-foreground/50 mb-2">Total Tests Attempted</div>
                  <div className="text-3xl font-bold text-[#262626]">{pastAttempts.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                  <div className="text-sm font-semibold text-foreground/50 mb-2">Average Part A Score</div>
                  <div className="text-3xl font-bold text-green-600">
                    {pastAttempts.length === 0 ? '—' : 
                      Math.round(pastAttempts.reduce((acc, a) => acc + (a.total_part_a > 0 ? (a.score_part_a / a.total_part_a) * 100 : 0), 0) / pastAttempts.length) + '%'}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                  <div className="text-sm font-semibold text-foreground/50 mb-2">Best Part A Score</div>
                  <div className="text-3xl font-bold text-primary">
                    {pastAttempts.length === 0 ? '—' :
                      (() => { const best = pastAttempts.reduce((b, a) => (a.score_part_a > b.score_part_a ? a : b), pastAttempts[0]); return `${best.score_part_a}/${best.total_part_a}`; })()
                    }
                  </div>
                </div>
              </div>

              {pastAttempts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Accuracy Bar Chart */}
                  <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-[#262626] mb-6">Historical Accuracy Trends</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pastAttempts.map((a, i) => ({ name: `Attempt ${pastAttempts.length - i}`, accuracy: a.total_part_a > 0 ? Math.round((a.score_part_a / a.total_part_a) * 100) : 0 })).reverse()}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} domain={[0, 100]} />
                          <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="accuracy" fill="#FF6B6B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Skills Radar Chart - Simulated since we don't have granular question tags yet */}
                  <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-[#262626] mb-6">Strengths & Weaknesses (Estimated)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Visualisation', A: pastAttempts[0]?.score_part_a ? Math.min(100, (pastAttempts[0].score_part_a / pastAttempts[0].total_part_a) * 110) : 0, fullMark: 100 },
                          { subject: 'Observation', A: pastAttempts[0]?.score_part_a ? Math.min(100, (pastAttempts[0].score_part_a / pastAttempts[0].total_part_a) * 90) : 0, fullMark: 100 },
                          { subject: 'Aptitude', A: pastAttempts[0]?.score_part_a ? Math.min(100, (pastAttempts[0].score_part_a / pastAttempts[0].total_part_a) * 105) : 0, fullMark: 100 },
                          { subject: 'GK', A: pastAttempts[0]?.score_part_a ? Math.min(100, (pastAttempts[0].score_part_a / pastAttempts[0].total_part_a) * 85) : 0, fullMark: 100 },
                          { subject: 'Creativity', A: pastAttempts[0]?.part_b_answered ? Math.min(100, pastAttempts[0].part_b_answered * 25) : 0, fullMark: 100 },
                        ]}>
                          <PolarGrid stroke="#E5E7EB" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Skills" dataKey="A" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.4} />
                          <RechartsTooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
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
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {pastAttempts.map((attempt, i) => {
                      const scoreA = attempt.score_part_a || 0;
                      const totalA = attempt.total_part_a || 0;
                      const partAPercent = totalA > 0 ? Math.round((scoreA / totalA) * 100) : 0;
                      const partBAns = attempt.part_b_answered || 0;
                      const scoreColor = partAPercent >= 70 ? 'text-green-600' : partAPercent >= 40 ? 'text-orange-600' : 'text-red-600';
                      const completedDate = attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
                      
                      return (
                        <AccordionItem key={attempt.id} value={attempt.id} className="border border-black/5 rounded-xl px-6 py-2 shadow-sm bg-white data-[state=open]:bg-primary/5 transition-colors">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center justify-between w-full pr-4 text-left">
                              <div>
                                <h4 className="font-bold text-lg text-[#262626]">{attempt.exam_tests?.title || 'Unknown Test'}</h4>
                                <p className="text-xs text-foreground/50 font-medium mt-1">Completed: {completedDate}</p>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                  {totalA > 0 && (
                                    <div className="text-xs font-semibold text-foreground/60 mb-0.5">
                                      Part A: <span className={`font-bold ${scoreColor}`}>{scoreA}/{totalA}</span>
                                    </div>
                                  )}
                                  {partBAns > 0 && (
                                    <div className="text-xs font-semibold text-foreground/60 mb-0.5">
                                      Part B: {attempt.part_b_evaluation_status === 'completed' ? (
                                        <span className="font-bold text-green-600">{attempt.score_part_b}</span>
                                      ) : (
                                        <span className="font-bold text-orange-500">Pending</span>
                                      )}
                                    </div>
                                  )}
                                  {attempt.total_score !== null && (
                                    <div className="text-sm font-bold text-primary mt-1 border-t border-black/5 pt-1">
                                      Total: {attempt.total_score}
                                    </div>
                                  )}
                                </div>
                                <div className="px-3 py-1 bg-black/5 rounded-full text-xs font-bold text-foreground/70">Attempt {pastAttempts.length - i}</div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-6">
                            <div className={`grid grid-cols-1 ${totalA > 0 ? 'sm:grid-cols-2' : ''} gap-4`}>
                              {totalA > 0 && (
                                <div className="p-4 rounded-xl bg-white border border-black/5">
                                  <h5 className="font-bold text-sm text-[#262626] mb-2 flex justify-between">
                                    <span>Part A (Objective)</span>
                                    <span className="text-primary">{scoreA} / {totalA}</span>
                                  </h5>
                                  <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${partAPercent}%` }} />
                                  </div>
                                  <p className="text-xs text-foreground/50 mt-2">{partAPercent}% accuracy on objective questions.</p>
                                </div>
                              )}
                              <div className="p-4 rounded-xl bg-white border border-black/5 flex flex-col justify-between">
                                  <div>
                                    <h5 className="font-bold text-sm text-[#262626] mb-2 flex justify-between">
                                      <span>Part B (Subjective)</span>
                                      {attempt.part_b_evaluation_status === 'completed' && attempt.score_part_b !== null ? (
                                        <span className="text-green-600">{attempt.score_part_b} Marks</span>
                                      ) : (
                                        <span className="text-orange-600">{partBAns} submitted</span>
                                      )}
                                    </h5>
                                    {attempt.part_b_evaluation_status === 'completed' ? (
                                      <div className="h-2 w-full bg-green-100 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-green-500 rounded-full w-full" />
                                      </div>
                                    ) : (
                                      <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: partBAns > 0 ? '100%' : '0%' }} />
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-foreground/50 mt-2">
                                    {attempt.part_b_evaluation_status === 'completed' 
                                      ? "Evaluated. Click below to view feedback." 
                                      : "Awaiting manual evaluation by faculty."}
                                  </p>
                                </div>
                              </div>
                              {attempt.total_score !== null && (
                                <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
                                  <span className="font-bold text-[#262626]">Total Final Score</span>
                                  <span className="text-xl font-black text-primary">{attempt.total_score}</span>
                                </div>
                              )}
                              <div className="mt-4 pt-4 border-t border-black/5 text-right">
                               <Button variant="outline" onClick={() => setLocation(`/portal/test/${attempt.test_id}?review_attempt=${attempt.id}`)} className="font-bold border-primary text-primary hover:bg-primary/5">
                                 Review Scorecard & Answers
                               </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
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
              <h4 className="font-bold text-[#262626] mb-1">Unlock for ₹2,000</h4>
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
              {upgradingPayment ? 'Processing...' : 'Unlock Now — ₹2,000'}
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
