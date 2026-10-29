import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, ArrowLeft, PenTool, CheckCircle2, ChevronRight, ChevronLeft, 
  MessageSquare, Video, FileText, Maximize, X, Shield,
  ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink, AlertCircle, Download,
  UploadCloud, Plus, Settings, Sparkles, Key, FileCheck2, Search, Layers,
  Users, ChevronDown, ChevronUp, ImagePlus, Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { sanitizeHtml, cleanPlainText } from "@/lib/sanitize";
import { roundScore, formatScore, resolvePartBMaxMarks } from "@/lib/utils";
import { evaluatePartBWithAI, evaluatePartBWithGemini, getAISettings, countWords } from "@/lib/geminiEvaluation";

const PAGE_SIZE = 100;

const parseFileUrls = (fileUrlString: string | undefined | null): string[] => {
  if (!fileUrlString) return [];
  try {
    const trimmed = String(fileUrlString).trim();
    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(s => String(s)).filter(Boolean);
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return [JSON.parse(trimmed)];
    }
  } catch (e) {
    // Fallback to single URL
  }
  return fileUrlString ? [String(fileUrlString).trim()] : [];
};

const normalizeSubmissionUrl = (rawUrl: string): { url: string; isDirectImage: boolean; isFilenameOnly: boolean } => {
  if (!rawUrl) return { url: '', isDirectImage: false, isFilenameOnly: false };
  const trimmed = rawUrl.trim();

  // If already a base64 / data URL
  if (trimmed.startsWith('data:image/')) {
    return { url: trimmed, isDirectImage: true, isFilenameOnly: false };
  }

  // If full http / https URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { url: trimmed, isDirectImage: true, isFilenameOnly: false };
  }

  // If relative storage path e.g. submissions/... or candidate-submissions/...
  const cleanPath = trimmed.replace(/^(\/?candidate-submissions\/|\/)/, '');
  if (cleanPath.startsWith('submissions/')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tbacsyjfbwaqobtmbwdr.supabase.co';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/candidate-submissions/${cleanPath}`;
    return { url: publicUrl, isDirectImage: true, isFilenameOnly: false };
  }

  // If raw filename without any path (e.g. "DSC_2799.JPG")
  if (!trimmed.includes('/')) {
    return { url: trimmed, isDirectImage: false, isFilenameOnly: true };
  }

  return { url: trimmed, isDirectImage: true, isFilenameOnly: false };
};

const resolveQuestionMediaUrl = (rawUrl: string | null | undefined): string => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.replace(/^(\/?question-media\/|\/)/, '');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tbacsyjfbwaqobtmbwdr.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/question-media/${cleanPath}`;
};

const parseQuestionMediaUrls = (rawUrl: string | null | undefined): string[] => {
  if (!rawUrl) return [];
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(u => resolveQuestionMediaUrl(String(u))).filter(Boolean);
      }
    } catch {}
  }
  return [resolveQuestionMediaUrl(trimmed)].filter(Boolean);
};

export default function AdminPartBEvaluations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'draft' | 'completed'>('pending');
  const [page, setPage] = useState(0);
  
  // Data Fetching via React Query — paginated per tab
  const { data: attemptsData, isLoading: isLoadingAttempts } = useQuery({
    queryKey: ['admin-part-b-attempts', activeTab, page],
    queryFn: async () => {
      const statusFilter = activeTab === 'pending' ? null : activeTab;
      let query = supabase
        .from('exam_attempts')
        .select(`
          *,
          exam_candidates(name, unique_id, email, access_level),
          exam_tests(id, title, test_code, is_focus_batch, program_format, exam_programs(name))
        `, { count: 'exact' })
        .or('part_b_answered.gt.0,part_b_evaluation_status.not.is.null')
        .order('completed_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
      if (statusFilter) {
        query = query.eq('part_b_evaluation_status', statusFilter);
      } else {
        // pending = null or 'pending'
        query = query.or('part_b_evaluation_status.is.null,part_b_evaluation_status.eq.pending');
      }
      
      const { data, error, count } = await query;
      if (error) throw error;
      let sortedData = data || [];
      // Priority sort: Focus Batch students first in pending tab
      if (activeTab === 'pending') {
        sortedData = [...sortedData].sort((a, b) => {
          const aFB = a.exam_candidates?.access_level === 'focus_batch' ? 0 : 1;
          const bFB = b.exam_candidates?.access_level === 'focus_batch' ? 0 : 1;
          return aFB - bFB;
        });
      }
      return { attempts: sortedData, total: count || 0 };
    },
    placeholderData: (prev) => prev,
  });

  const attempts = attemptsData?.attempts || [];
  const totalPages = Math.ceil((attemptsData?.total || 0) / PAGE_SIZE);
  const [evaluatingAttempt, setEvaluatingAttempt] = useState<any>(null);

  // Segregation & Live Search State
  const [viewMode, setViewMode] = useState<'paper' | 'student' | 'flat'>('paper');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPapers, setExpandedPapers] = useState<Record<string, boolean>>({});
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});
  
  // Evaluation Details State
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Form State for current question
  const [evalForm, setEvalForm] = useState({
    marks_awarded: "",
    rubric_marks: {
      critical_thinking: "",
      ideation: "",
      storytelling: "",
      conceptualisation: "",
      representation: ""
    },
    mentor_comments: "",
    mentor_improvements: "",
    mentor_loom_link: ""
  });
  
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [selectedQuestionMediaIndex, setSelectedQuestionMediaIndex] = useState(0);
  const [uploadingQuestionMedia, setUploadingQuestionMedia] = useState(false);

  // Zoom, rotation, and progressive image loading states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [resolvedUrlOverride, setResolvedUrlOverride] = useState<string | null>(null);
  const [retryingSignedUrl, setRetryingSignedUrl] = useState(false);
  const [adminUploading, setAdminUploading] = useState(false);
  const [aiEvaluatingSingle, setAiEvaluatingSingle] = useState(false);
  const [aiEvaluatingBatch, setAiEvaluatingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentQuestion: "" });
  const [showBatchModal, setShowBatchModal] = useState(false);

  // AI Configuration Modal state
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);
  const [activeAiProvider, setActiveAiProvider] = useState<'openai' | 'gemini'>('openai');
  const [configOpenaiKey, setConfigOpenaiKey] = useState('');
  const [configOpenaiModel, setConfigOpenaiModel] = useState('gpt-4o-mini');
  const [configGeminiKey, setConfigGeminiKey] = useState('');
  const [configGeminiModel, setConfigGeminiModel] = useState('gemini-flash-latest');
  const [testingAiKey, setTestingAiKey] = useState(false);
  const [testAiResult, setTestAiResult] = useState<string | null>(null);
  const [savingAiSettings, setSavingAiSettings] = useState(false);

  // Admin Proxy Submission (Create on behalf of student) state
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyCandidateFilter, setProxyCandidateFilter] = useState<'focus_batch' | 'materials_only' | 'generic' | 'all'>('focus_batch');
  const [proxyCandidateSearch, setProxyCandidateSearch] = useState('');
  const [proxySelectedCandidate, setProxySelectedCandidate] = useState<any>(null);
  const [proxySelectedTestId, setProxySelectedTestId] = useState('');
  const [proxyLoadingQuestions, setProxyLoadingQuestions] = useState(false);
  const [proxyTestQuestions, setProxyTestQuestions] = useState<any[]>([]);
  const [proxyResponses, setProxyResponses] = useState<Record<string, { fileUrls: string[]; answerText: string }>>({});
  const [proxyUploadingQId, setProxyUploadingQId] = useState<string | null>(null);
  const [submittingProxy, setSubmittingProxy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await getAISettings();
        setActiveAiProvider(s.provider);
        setConfigOpenaiKey(s.openaiKey);
        setConfigOpenaiModel(s.openaiModel || 'gpt-4o-mini');
        setConfigGeminiKey(s.geminiKey);
        setConfigGeminiModel(s.geminiModel || 'gemini-flash-latest');
      } catch (e) {
        console.warn("Could not pre-load AI settings:", e);
      }
    })();
  }, []);

  const handleSaveAiSettings = async () => {
    setSavingAiSettings(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("df_openai_api_key", configOpenaiKey.trim());
        localStorage.setItem("df_openai_api_model", configOpenaiModel);
        localStorage.setItem("df_gemini_api_key", configGeminiKey.trim());
        localStorage.setItem("df_gemini_api_model", configGeminiModel);
        localStorage.setItem("df_ai_provider", activeAiProvider);
      }

      await supabase.from("system_settings").upsert([
        { key: "openai_api_key", value: configOpenaiKey.trim() },
        { key: "openai_api_model", value: configOpenaiModel },
        { key: "gemini_api_key", value: configGeminiKey.trim() },
        { key: "gemini_api_model", value: configGeminiModel },
        { key: "ai_evaluation_provider", value: activeAiProvider }
      ]);

      toast({ 
        title: "AI Settings Saved", 
        description: `Active Evaluator: ${activeAiProvider === 'openai' ? `OpenAI (${configOpenaiModel})` : 'Google Gemini'}` 
      });
      setShowAiSettingsModal(false);
    } catch (e: any) {
      console.warn("Could not persist to DB, saved to browser session:", e);
      toast({ title: "Saved to Browser", description: "Settings updated for your active session." });
      setShowAiSettingsModal(false);
    } finally {
      setSavingAiSettings(false);
    }
  };

  const handleTestAiKey = async () => {
    setTestingAiKey(true);
    setTestAiResult(null);
    try {
      if (activeAiProvider === 'openai') {
        const keyToTest = configOpenaiKey.trim();
        if (!keyToTest) {
          setTestAiResult("❌ Please enter your OpenAI API key first.");
          return;
        }
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keyToTest}`
          },
          body: JSON.stringify({
            model: configOpenaiModel || "gpt-4o-mini",
            messages: [{ role: "user", content: "test" }],
            max_tokens: 5
          })
        });

        if (res.ok) {
          setTestAiResult("✅ Connected! OpenAI is active and ready to evaluate sketches.");
        } else {
          const errData = await res.json();
          if (errData?.error?.code === "credit_balance_exhausted" || errData?.error?.code === "insufficient_quota") {
            setTestAiResult("⚠️ Key is VALID, but credit balance is $0. Please add $5 credits at platform.openai.com/settings/organization/billing/ to start evaluating.");
          } else {
            setTestAiResult(`❌ Error (${res.status}): ${errData?.error?.message || res.statusText}`);
          }
        }
      } else {
        const keyToTest = configGeminiKey.trim();
        if (!keyToTest) {
          setTestAiResult("❌ Please enter your Gemini API key first.");
          return;
        }
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`);
        if (res.ok) {
          setTestAiResult("✅ Connected to Google Gemini!");
        } else {
          const errText = await res.text();
          setTestAiResult(`❌ Gemini Connection Failed: ${errText}`);
        }
      }
    } catch (err: any) {
      setTestAiResult(`❌ Connection Failed: ${err.message}`);
    } finally {
      setTestingAiKey(false);
    }
  };

  // Query candidates for proxy submission modal (filtered by tier with Focus Batch default)
  const { data: proxyCandidates = [] } = useQuery({
    queryKey: ['proxy-candidates', proxyCandidateFilter, proxyCandidateSearch],
    enabled: showProxyModal,
    queryFn: async () => {
      let q = supabase
        .from('exam_candidates')
        .select('id, name, email, unique_id, access_level, education_level, has_focus_mocks_access')
        .order('created_at', { ascending: false });

      if (proxyCandidateFilter === 'focus_batch') {
        q = q.or('access_level.eq.focus_batch,has_focus_mocks_access.eq.true');
      } else if (proxyCandidateFilter === 'materials_only') {
        q = q.eq('access_level', 'materials_only');
      } else if (proxyCandidateFilter === 'generic') {
        q = q.eq('access_level', 'generic').eq('has_focus_mocks_access', false);
      }

      if (proxyCandidateSearch.trim()) {
        q = q.or(`name.ilike.%${proxyCandidateSearch}%,email.ilike.%${proxyCandidateSearch}%,unique_id.ilike.%${proxyCandidateSearch}%`);
      }

      const { data, error } = await q.limit(60);
      if (error) {
        console.error("Error fetching proxy candidates:", error);
        throw error;
      }

      // Sort Focus Batch to top
      return (data || []).sort((a, b) => {
        const aIsFocus = a.access_level === 'focus_batch' || a.has_focus_mocks_access;
        const bIsFocus = b.access_level === 'focus_batch' || b.has_focus_mocks_access;
        if (aIsFocus && !bIsFocus) return -1;
        if (!aIsFocus && bIsFocus) return 1;
        return 0;
      });
    }
  });

  // Query tests for proxy submission modal
  const { data: proxyTests = [], isLoading: isLoadingProxyTests } = useQuery({
    queryKey: ['proxy-tests'],
    enabled: showProxyModal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_tests')
        .select('id, title, program_format, is_focus_batch, access_tier, status, category, exam_programs(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching proxy tests:", error);
        throw error;
      }
      return data || [];
    }
  });

  // Fetch questions for selected test in proxy modal
  const handleSelectProxyTest = async (testId: string) => {
    setProxySelectedTestId(testId);
    setProxyTestQuestions([]);
    setProxyResponses({});
    if (!testId) return;

    setProxyLoadingQuestions(true);
    try {
      // 1. Fetch questions linked to this test via exam_test_questions
      const { data: tqData, error: tqErr } = await supabase
        .from('exam_test_questions')
        .select('question_id, marks')
        .eq('test_id', testId);

      if (tqErr) {
        console.warn("Could not fetch exam_test_questions:", tqErr);
      }

      const qIds = (tqData || []).map((t: any) => t.question_id);
      let questions: any[] = [];

      if (qIds.length > 0) {
        const { data: qs, error: qsErr } = await supabase
          .from('exam_questions')
          .select('*')
          .in('id', qIds);

        if (qsErr) throw qsErr;

        const marksMap = new Map((tqData || []).map((t: any) => [t.question_id, t.marks]));
        const allQuestions = (qs || []).map((q: any) => ({
          ...q,
          marks: marksMap.get(q.id) != null ? Number(marksMap.get(q.id)) : (q.marks || 10)
        }));

        // Filter Part B subjective questions, fallback to all if none tagged Part B
        const partB = allQuestions.filter((q: any) => q.part === 'B');
        questions = partB.length > 0 ? partB : allQuestions;
      }

      setProxyTestQuestions(questions);
      const initResp: Record<string, { fileUrls: string[]; answerText: string }> = {};
      questions.forEach((q: any) => {
        initResp[q.id] = { fileUrls: [], answerText: '' };
      });
      setProxyResponses(initResp);
    } catch (err: any) {
      console.error("Error loading test questions for proxy:", err);
      toast({ title: "Failed to load questions", description: err.message, variant: "destructive" });
    } finally {
      setProxyLoadingQuestions(false);
    }
  };

  // Compress image helper with 1400px & 0.75 quality
  const compressImageForProxy = (file: File): Promise<{ blob: Blob; ext: string }> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({ blob: file, ext: file.name.split('.').pop() || 'dat' });
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
            resolve({ blob: file, ext: 'jpg' });
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve({ blob: blob || file, ext: 'jpg' });
          }, 'image/jpeg', 0.75);
        };
        img.onerror = () => resolve({ blob: file, ext: 'jpg' });
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve({ blob: file, ext: 'jpg' });
      reader.readAsDataURL(file);
    });
  };

  // Handle uploading sketches in proxy modal
  const handleProxyFileUpload = async (files: FileList | null, qId: string) => {
    if (!files || files.length === 0) return;
    setProxyUploadingQId(qId);
    try {
      const currentList = proxyResponses[qId]?.fileUrls || [];
      const newUrls = [...currentList];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { blob, ext } = await compressImageForProxy(file);
        const fileName = `proxy_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `submissions/proxy_${proxySelectedCandidate?.id || 'admin'}/${qId}_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('candidate-submissions')
          .upload(filePath, blob, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('candidate-submissions')
            .getPublicUrl(filePath);
          newUrls.push(publicUrl);
        } else {
          // Fallback to base64 if storage fails
          const reader = new FileReader();
          const base64 = await new Promise<string>((res) => {
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(blob);
          });
          newUrls.push(base64);
        }
      }

      setProxyResponses(prev => ({
        ...prev,
        [qId]: { ...prev[qId], fileUrls: newUrls }
      }));
      toast({ title: "Sketches uploaded", description: `${files.length} file(s) attached.` });
    } catch (err: any) {
      toast({ title: "Upload error", description: err.message, variant: "destructive" });
    } finally {
      setProxyUploadingQId(null);
    }
  };

  // Submit on behalf of student
  const handleSubmitProxy = async () => {
    if (!proxySelectedCandidate) {
      toast({ title: "Select a Candidate", description: "Please pick a student account.", variant: "destructive" });
      return;
    }
    if (!proxySelectedTestId) {
      toast({ title: "Select a Test", description: "Please choose an exam to submit.", variant: "destructive" });
      return;
    }

    setSubmittingProxy(true);
    try {
      // 1. Determine next attempt number
      const { data: prevAttempts } = await supabase
        .from('exam_attempts')
        .select('attempt_number')
        .eq('candidate_id', proxySelectedCandidate.id)
        .eq('test_id', proxySelectedTestId);

      const nextAttemptNumber = prevAttempts && prevAttempts.length > 0
        ? Math.max(...prevAttempts.map(a => a.attempt_number || 1)) + 1
        : 1;

      // Count answered Part B questions
      let answeredCount = 0;
      Object.values(proxyResponses).forEach(r => {
        if (r.fileUrls.length > 0 || r.answerText.trim()) answeredCount++;
      });

      // 2. Create completed exam_attempt
      const { data: newAttempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          candidate_id: proxySelectedCandidate.id,
          test_id: proxySelectedTestId,
          start_time: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date().toISOString(),
          status: 'completed',
          attempt_number: nextAttemptNumber,
          part_b_answered: answeredCount,
          part_b_evaluation_status: 'pending'
        })
        .select('id')
        .single();

      if (attemptError || !newAttempt) throw attemptError || new Error("Could not create attempt");

      // 3. Insert exam_responses for all Part B questions
      const responsesToInsert: any[] = [];
      proxyTestQuestions.forEach(q => {
        const resp = proxyResponses[q.id] || { fileUrls: [], answerText: '' };
        responsesToInsert.push({
          attempt_id: newAttempt.id,
          question_id: q.id,
          status: resp.fileUrls.length > 0 || resp.answerText.trim() ? 'answered' : 'unseen',
          selected_options: [],
          answer_text: resp.answerText.trim() || null,
          file_url: resp.fileUrls.length > 0 ? JSON.stringify(resp.fileUrls) : null,
          time_spent: 300,
          answer_changes: 1,
          state_transitions: [{ action: 'admin_proxy_submission', timestamp: new Date().toISOString() }]
        });
      });

      if (responsesToInsert.length > 0) {
        const { error: respError } = await supabase
          .from('exam_responses')
          .insert(responsesToInsert);

        if (respError) throw respError;
      }

      toast({
        title: "Submission Created Successfully",
        description: `Submission on behalf of ${proxySelectedCandidate.name} recorded. It is now listed under Pending evaluations.`
      });

      // Refresh list & reset modal
      queryClient.invalidateQueries({ queryKey: ['admin-part-b-attempts'] });
      setShowProxyModal(false);
      setActiveTab('pending');
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingProxy(false);
    }
  };

  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setImageLoading(true);
    setImageError(false);
    setResolvedUrlOverride(null);
    setSelectedQuestionMediaIndex(0);
  }, [currentQIndex, selectedFileIndex, evaluatingAttempt?.id]);

  const handleAdminManualUpload = async (fileOrFiles: File | FileList | File[]) => {
    if (!evaluatingAttempt) return;
    const currentResp = responses[currentQIndex];
    if (!currentResp) return;

    const fileList: File[] = fileOrFiles instanceof File 
      ? [fileOrFiles] 
      : Array.from(fileOrFiles as any);

    if (fileList.length === 0) return;

    setAdminUploading(true);
    try {
      const currentUrls = parseFileUrls(currentResp.file_url);
      const validUrls = currentUrls.filter(u => !normalizeSubmissionUrl(u).isFilenameOnly);
      const newUrls = [...validUrls];

      for (const file of fileList) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const uniqueId = crypto.randomUUID().slice(0, 8);
        const filePath = `submissions/${evaluatingAttempt.id}/${currentResp.question_id}_manual_${uniqueId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('candidate-submissions')
          .upload(filePath, file, {
            contentType: file.type || 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('candidate-submissions')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      // Upsert into exam_responses if not already recorded
      let responseId = currentResp.id;
      if (!responseId) {
        const { data: newResp, error: insErr } = await supabase
          .from('exam_responses')
          .insert({
            attempt_id: evaluatingAttempt.id,
            question_id: currentResp.question_id,
            status: 'answered',
            file_url: JSON.stringify(newUrls),
            selected_options: [],
            answer_text: null
          })
          .select('id')
          .single();
        if (insErr) throw insErr;
        responseId = newResp.id;
      } else {
        const { error: dbError } = await supabase
          .from('exam_responses')
          .update({ file_url: JSON.stringify(newUrls), status: 'answered' })
          .eq('id', responseId);

        if (dbError) throw dbError;
      }

      // Update in-memory responses state
      const updated = [...responses];
      updated[currentQIndex] = { ...currentResp, id: responseId, file_url: JSON.stringify(newUrls), status: 'answered' };
      setResponses(updated);
      setSelectedFileIndex(newUrls.length - 1);
      setResolvedUrlOverride(newUrls[newUrls.length - 1]);
      setImageError(false);
      setImageLoading(false);

      toast({ 
        title: "Sketches Uploaded! 🎉", 
        description: `${fileList.length} page(s) attached and saved. You can now score or evaluate with AI.` 
      });
    } catch (err: any) {
      console.error("Admin upload failed:", err);
      toast({ title: "Upload Failed", description: err.message || "Could not attach image", variant: "destructive" });
    } finally {
      setAdminUploading(false);
    }
  };

  const handleUploadQuestionMedia = async (fileOrFiles: File | FileList | File[]) => {
    const currentResp = responses[currentQIndex];
    const currentQ = questions.find(q => q.id === currentResp?.question_id);
    if (!currentQ) {
      toast({ title: "No Question Selected", description: "Could not find current question", variant: "destructive" });
      return;
    }

    const fileList: File[] = fileOrFiles instanceof File 
      ? [fileOrFiles] 
      : Array.from(fileOrFiles as any);

    if (fileList.length === 0) return;

    setUploadingQuestionMedia(true);
    try {
      const existingUrls = parseQuestionMediaUrls(currentQ.media_url);
      const newUrls = [...existingUrls];

      for (const file of fileList) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const uniqueId = crypto.randomUUID().slice(0, 8);
        const filePath = `questions/${currentQ.id}_${uniqueId}.${fileExt}`;

        let uploadRes = await supabase.storage
          .from('question-media')
          .upload(filePath, file, { contentType: file.type || 'image/jpeg', upsert: true });

        let publicUrl = '';
        if (!uploadRes.error) {
          publicUrl = supabase.storage.from('question-media').getPublicUrl(filePath).data.publicUrl;
        } else {
          // Fallback to candidate-submissions bucket
          const fallbackRes = await supabase.storage
            .from('candidate-submissions')
            .upload(filePath, file, { contentType: file.type || 'image/jpeg', upsert: true });
          if (fallbackRes.error) throw fallbackRes.error;
          publicUrl = supabase.storage.from('candidate-submissions').getPublicUrl(filePath).data.publicUrl;
        }

        newUrls.push(publicUrl);
      }

      const finalMediaUrl = newUrls.length === 1 ? newUrls[0] : JSON.stringify(newUrls);

      const { error: dbErr } = await supabase
        .from('exam_questions')
        .update({ media_url: finalMediaUrl })
        .eq('id', currentQ.id);

      if (dbErr) throw dbErr;

      setQuestions(prev => prev.map(q => q.id === currentQ.id ? { ...q, media_url: finalMediaUrl } : q));
      setSelectedQuestionMediaIndex(newUrls.length - 1);

      toast({
        title: "Question Reference Attached! 🎉",
        description: `${fileList.length} question reference image(s) saved permanently.`
      });
    } catch (err: any) {
      console.error("Upload question media failed:", err);
      toast({
        title: "Question Upload Failed",
        description: err.message || "Could not attach question image",
        variant: "destructive"
      });
    } finally {
      setUploadingQuestionMedia(false);
    }
  };

  const attemptSignedUrlRecovery = async (urlToRecover: string) => {
    try {
      setRetryingSignedUrl(true);
      const currentResp = responses[currentQIndex];

      // 1. First, search if any file exists in this attempt's storage folder
      if (evaluatingAttempt?.id) {
        const { data: listData } = await supabase.storage
          .from('candidate-submissions')
          .list(`submissions/${evaluatingAttempt.id}`);

        if (listData && listData.length > 0) {
          // Look for question ID match or any valid image
          const qMatch = listData.find(f => currentResp && f.name.includes(currentResp.question_id));
          const targetFile = qMatch || listData[0];
          if (targetFile) {
            const { data: { publicUrl } } = supabase.storage
              .from('candidate-submissions')
              .getPublicUrl(`submissions/${evaluatingAttempt.id}/${targetFile.name}`);

            if (currentResp) {
              await supabase.from('exam_responses').update({
                file_url: JSON.stringify([publicUrl])
              }).eq('id', currentResp.id);

              const updated = [...responses];
              updated[currentQIndex] = { ...currentResp, file_url: JSON.stringify([publicUrl]) };
              setResponses(updated);
            }

            setResolvedUrlOverride(publicUrl);
            setImageError(false);
            setImageLoading(false);
            toast({ title: "Found in Storage!", description: `Linked file: ${targetFile.name}` });
            return;
          }
        }
      }

      // 2. Direct signed URL attempt for path
      let storagePath = '';
      if (urlToRecover.includes('/candidate-submissions/')) {
        storagePath = urlToRecover.split('/candidate-submissions/')[1];
      } else if (urlToRecover.startsWith('submissions/')) {
        storagePath = urlToRecover;
      }
      
      if (storagePath) {
        storagePath = storagePath.split('?')[0];
        const { data } = await supabase.storage
          .from('candidate-submissions')
          .createSignedUrl(storagePath, 7200);

        if (data?.signedUrl) {
          setResolvedUrlOverride(data.signedUrl);
          setImageError(false);
          setImageLoading(true);
          return;
        }
      }

      toast({ 
        title: "No file found in cloud", 
        description: "Please use 'Attach / Upload Image' or paste (Ctrl+V) the sketch directly.", 
        variant: "destructive" 
      });
      setImageError(true);
    } catch (e) {
      console.error("Signed URL recovery failed:", e);
      setImageError(true);
    } finally {
      setRetryingSignedUrl(false);
    }
  };

  // Clipboard paste listener: paste student drawing directly into evaluation
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!evaluatingAttempt || !responses[currentQIndex]) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            toast({ title: "Pasting Image...", description: "Attaching sketch from clipboard." });
            handleAdminManualUpload(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [evaluatingAttempt, currentQIndex, responses]);

  // Note: fetchAttempts has been replaced by useQuery above

  const loadEvaluation = async (attempt: any) => {
    setLoading(true);
    setEvaluatingAttempt(attempt);
    try {
      // Get all Part B questions for this test with defensive marks retrieval
      let tqData: any[] = [];
      const tqRes = await supabase.from('exam_test_questions').select('question_id, marks').eq('test_id', attempt.test_id);
      if (tqRes.error && (tqRes.error.message?.includes('marks') || tqRes.error.code === '42703')) {
        const fallbackRes = await supabase.from('exam_test_questions').select('question_id').eq('test_id', attempt.test_id);
        tqData = fallbackRes.data || [];
      } else {
        tqData = tqRes.data || [];
      }
      const questionIds = tqData?.map(t => t.question_id) || [];
      
      const { data: qData } = await supabase.from('exam_questions').select('*').in('id', questionIds).eq('part', 'B');
      const marksMap = new Map((tqData || []).map(t => [t.question_id, t.marks]));
      const partBQs = (qData || []).map((q: any) => ({
        ...q,
        marks: marksMap.get(q.id) != null && Number(marksMap.get(q.id)) > 0 
          ? Number(marksMap.get(q.id)) 
          : (q.marks != null && Number(q.marks) > 0 ? Number(q.marks) : resolvePartBMaxMarks(q, attempt.exam_tests))
      }));
      
      // Sort questions so it's consistent
      partBQs.sort((a, b) => a.id.localeCompare(b.id));
      setQuestions(partBQs);
      
      // Get responses
      const { data: rData } = await supabase.from('exam_responses').select('*').eq('attempt_id', attempt.id).in('question_id', partBQs.map(q => q.id));
      
      // Map ALL Part B questions to response objects so unuploaded questions can be evaluated on-the-fly
      const mappedResponses = partBQs.map(q => {
        const existing = (rData || []).find((r: any) => r.question_id === q.id);
        return existing || {
          attempt_id: attempt.id,
          question_id: q.id,
          file_url: null,
          answer_text: null,
          marks_awarded: null,
          rubric_marks: null,
          mentor_comments: null,
          mentor_improvements: null,
          mentor_loom_link: null,
          status: 'unseen'
        };
      });
      
      // Map to state
      setResponses(mappedResponses);
      setCurrentQIndex(0);
      
      if (mappedResponses.length > 0) {
        populateForm(mappedResponses[0]);
      }
      
    } catch (err: any) {
      toast({ title: "Failed to load evaluation details", description: err.message, variant: "destructive" });
      setEvaluatingAttempt(null);
    } finally {
      setLoading(false);
    }
  };
  
  const populateForm = (response: any) => {
    if (!response) return;
    setEvalForm({
      marks_awarded: response.marks_awarded !== null ? response.marks_awarded.toString() : "",
      rubric_marks: response.rubric_marks || {
        critical_thinking: "",
        ideation: "",
        storytelling: "",
        conceptualisation: "",
        representation: ""
      },
      mentor_comments: response.mentor_comments || "",
      mentor_improvements: response.mentor_improvements || "",
      mentor_loom_link: response.mentor_loom_link || ""
    });
  };

  const saveCurrentQuestionDraft = async () => {
    if (!evaluatingAttempt || responses.length === 0) return;
    
    const currentResponse = responses[currentQIndex];
    if (!currentResponse) return;
    
    const roundedMarks = evalForm.marks_awarded !== "" && !isNaN(parseFloat(evalForm.marks_awarded))
      ? Math.max(0, Math.round(parseFloat(evalForm.marks_awarded) * 100) / 100)
      : null;

    // Update local state
    const updatedResponses = [...responses];
    updatedResponses[currentQIndex] = {
      ...currentResponse,
      marks_awarded: roundedMarks,
      rubric_marks: evalForm.rubric_marks,
      mentor_comments: evalForm.mentor_comments,
      mentor_improvements: evalForm.mentor_improvements,
      mentor_loom_link: evalForm.mentor_loom_link
    };
    setResponses(updatedResponses);
    
    // Save to DB
    try {
      let responseId = currentResponse.id;
      if (!responseId) {
        const { data: newResp, error: insErr } = await supabase.from('exam_responses').insert({
          attempt_id: evaluatingAttempt.id,
          question_id: currentResponse.question_id,
          marks_awarded: roundedMarks,
          rubric_marks: evalForm.rubric_marks,
          mentor_comments: evalForm.mentor_comments || null,
          mentor_improvements: evalForm.mentor_improvements || null,
          mentor_loom_link: evalForm.mentor_loom_link || null,
          status: 'answered'
        }).select('id').single();
        if (insErr) throw insErr;
        responseId = newResp.id;
        updatedResponses[currentQIndex].id = responseId;
        setResponses(updatedResponses);
      } else {
        await supabase.from('exam_responses').update({
          marks_awarded: roundedMarks,
          rubric_marks: evalForm.rubric_marks,
          mentor_comments: evalForm.mentor_comments || null,
          mentor_improvements: evalForm.mentor_improvements || null,
          mentor_loom_link: evalForm.mentor_loom_link || null
        }).eq('id', responseId);
      }
      
      // Update attempt status to draft if it was pending
      if (evaluatingAttempt.part_b_evaluation_status === 'pending') {
        await supabase.from('exam_attempts').update({ part_b_evaluation_status: 'draft' }).eq('id', evaluatingAttempt.id);
        
        queryClient.setQueryData(['admin-part-b-attempts'], (old: any) => 
          (old || []).map((a: any) => a.id === evaluatingAttempt.id ? { ...a, part_b_evaluation_status: 'draft' } : a)
        );
        
        setEvaluatingAttempt({ ...evaluatingAttempt, part_b_evaluation_status: 'draft' });
      }
      
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuestion = async () => {
    await saveCurrentQuestionDraft();
    if (currentQIndex < responses.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      populateForm(responses[currentQIndex + 1]);
    }
  };

  const handlePrevQuestion = async () => {
    await saveCurrentQuestionDraft();
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
      populateForm(responses[currentQIndex - 1]);
    }
  };
  
  const submitCompleteEvaluation = async () => {
    await saveCurrentQuestionDraft();
    setSaving(true);
    try {
      // Calculate total score rounded to 2 decimal places
      let scorePartB = 0;
      responses.forEach(r => {
        if (r.marks_awarded) scorePartB += Math.max(0, parseFloat(r.marks_awarded));
      });
      // Add the currently viewed one just in case state isn't synced yet
      if (evalForm.marks_awarded !== "" && !isNaN(parseFloat(evalForm.marks_awarded))) {
         // Replace the currently viewed one in the sum calculation
         const currentRespId = responses[currentQIndex].id;
         scorePartB = 0;
         responses.forEach(r => {
            if (r.id === currentRespId) scorePartB += Math.max(0, parseFloat(evalForm.marks_awarded));
            else if (r.marks_awarded) scorePartB += Math.max(0, parseFloat(r.marks_awarded));
         });
      }
      
      scorePartB = Math.max(0, Math.round(scorePartB * 100) / 100);
      const totalScore = Math.max(0, Math.round(((evaluatingAttempt.score_part_a || 0) + scorePartB) * 100) / 100);
      
      // Update attempt
      await supabase.from('exam_attempts').update({
        score_part_b: scorePartB,
        total_score: totalScore,
        part_b_evaluation_status: 'completed',
        part_b_evaluated_at: new Date().toISOString()
      }).eq('id', evaluatingAttempt.id);
      
      // Trigger email notification via Edge Function
      try {
        await supabase.functions.invoke('send-evaluation-email', {
          body: {
            email: evaluatingAttempt.exam_candidates.email,
            candidateName: evaluatingAttempt.exam_candidates.name,
            testTitle: evaluatingAttempt.exam_tests?.title || 'Exam',
            score: totalScore.toFixed(2),
            loginUrl: `${window.location.origin}/portal/dashboard`
          }
        });
      } catch (err) {
        console.error("Failed to trigger email notification", err);
      }
      
      toast({ title: "Evaluation Complete!", description: `Candidate scored ${scorePartB} in Part B. Total Score: ${totalScore}. Email notification triggered.` });
      
      setShowConfirmModal(false);
      setEvaluatingAttempt(null);
      queryClient.invalidateQueries({ queryKey: ['admin-part-b-attempts'] });
      
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getQuestionMaxMarks = (q: any) => {
    if (q?.marks && typeof q.marks === 'number' && q.marks > 0) return q.marks;
    const testTitleLower = (evaluatingAttempt?.exam_tests?.title || '').toLowerCase();
    const programNameLower = (evaluatingAttempt?.exam_tests?.exam_programs?.name || '').toLowerCase();
    const programFormatLower = (evaluatingAttempt?.exam_tests?.program_format || '').toLowerCase();

    const isUceed = testTitleLower.includes('uceed') || programNameLower.includes('uceed') || testTitleLower.includes('b.des') || testTitleLower.includes('bdes') || programFormatLower === 'bachelors';
    const isCeed = testTitleLower.includes('ceed') || programNameLower.includes('ceed') || testTitleLower.includes('m.des') || testTitleLower.includes('mdes') || programFormatLower === 'masters';

    if (isCeed && !testTitleLower.includes('uceed') && !programNameLower.includes('uceed')) {
      return 20;
    } else if (isUceed) {
      return 50;
    } else if (questions.length > 0) {
      return 100 / questions.length;
    }
    return 50;
  };

  const handleSingleAiEvaluate = async () => {
    const currentResp = responses[currentQIndex];
    const currentQ = questions.find(q => q.id === currentResp?.question_id);
    if (!currentResp || !currentQ) return;

    setAiEvaluatingSingle(true);
    try {
      const providerLabel = activeAiProvider === 'openai' ? `OpenAI (${configOpenaiModel})` : 'Google Gemini';
      toast({ title: `AI Evaluating with ${providerLabel}...`, description: "Analyzing sketch and formulating 20-25 word review." });

      const fileUrls = parseFileUrls(currentResp.file_url);
      const activeFileUrl = fileUrls.length > 0 ? normalizeSubmissionUrl(fileUrls[0]).url : null;
      const qMaxMarks = getQuestionMaxMarks(currentQ);

      const result = await evaluatePartBWithAI({
        questionText: currentQ.content_text || "",
        questionMediaUrl: currentQ.media_url ? resolveQuestionMediaUrl(currentQ.media_url) : null,
        candidateFileUrl: activeFileUrl,
        candidateAnswerText: currentResp.answer_text,
        maxMarks: qMaxMarks,
        provider: activeAiProvider,
        openaiKey: configOpenaiKey.trim() || undefined,
        openaiModel: configOpenaiModel,
        geminiKey: configGeminiKey.trim() || undefined,
        geminiModel: configGeminiModel,
      });

      setEvalForm(prev => ({
        ...prev,
        marks_awarded: result.marks_awarded.toString(),
        rubric_marks: {
          critical_thinking: String(result.rubric_marks.critical_thinking ?? ""),
          ideation: String(result.rubric_marks.ideation ?? ""),
          storytelling: String(result.rubric_marks.storytelling ?? ""),
          conceptualisation: String(result.rubric_marks.conceptualisation ?? ""),
          representation: String(result.rubric_marks.representation ?? "")
        },
        mentor_comments: result.mentor_comments,
        mentor_improvements: result.mentor_improvements || prev.mentor_improvements
      }));

      // Update response in state
      const updated = [...responses];
      updated[currentQIndex] = {
        ...currentResp,
        marks_awarded: result.marks_awarded,
        rubric_marks: result.rubric_marks,
        mentor_comments: result.mentor_comments,
        mentor_improvements: result.mentor_improvements || currentResp.mentor_improvements
      };
      setResponses(updated);

      toast({ 
        title: "AI Evaluation Ready", 
        description: `Scored ${result.marks_awarded}/${qMaxMarks} via ${providerLabel}. Please review and save.` 
      });
    } catch (err: any) {
      console.error("AI Evaluation failed:", err);
      toast({ title: "AI Evaluation Failed", description: err.message, variant: "destructive" });
    } finally {
      setAiEvaluatingSingle(false);
    }
  };

  const handleBatchAiEvaluate = async () => {
    if (!responses || responses.length === 0) return;
    setAiEvaluatingBatch(true);
    setShowBatchModal(true);
    setBatchProgress({ current: 0, total: responses.length, currentQuestion: "" });

    try {
      const updatedResponses = [...responses];

      let completedCount = 0;
      let successCount = 0;
      const failureErrors: string[] = [];

      setBatchProgress({
        current: 0,
        total: responses.length,
        currentQuestion: `Evaluating ${responses.length} questions in parallel...`
      });

      await Promise.allSettled(
        responses.map(async (resp, i) => {
          const q = questions.find(item => item.id === resp.question_id);
          if (!q) return;

          const fileUrls = parseFileUrls(resp.file_url);
          const activeFileUrl = fileUrls.length > 0 ? normalizeSubmissionUrl(fileUrls[0]).url : null;
          const qMaxMarks = getQuestionMaxMarks(q);

          try {
            const result = await evaluatePartBWithAI({
              questionText: q.content_text || "",
              questionMediaUrl: q.media_url ? resolveQuestionMediaUrl(q.media_url) : null,
              candidateFileUrl: activeFileUrl,
              candidateAnswerText: resp.answer_text,
              maxMarks: qMaxMarks,
              provider: activeAiProvider,
              openaiKey: configOpenaiKey.trim() || undefined,
              openaiModel: configOpenaiModel,
              geminiKey: configGeminiKey.trim() || undefined,
              geminiModel: configGeminiModel,
            });

            updatedResponses[i] = {
              ...resp,
              marks_awarded: result.marks_awarded,
              rubric_marks: result.rubric_marks,
              mentor_comments: result.mentor_comments,
              mentor_improvements: result.mentor_improvements || resp.mentor_improvements
            };
            successCount++;

            // Save to database
            await supabase.from('exam_responses').update({
              marks_awarded: result.marks_awarded,
              rubric_marks: result.rubric_marks,
              mentor_comments: result.mentor_comments,
              mentor_improvements: result.mentor_improvements || null,
              ai_evaluated: true
            }).eq('id', resp.id);

          } catch (qErr: any) {
            const errMsg = qErr?.message || String(qErr);
            failureErrors.push(`Question ${i + 1}: ${errMsg}`);
            console.error(`AI failed for question ${i + 1}:`, qErr);
          } finally {
            completedCount++;
            setBatchProgress({
              current: completedCount,
              total: responses.length,
              currentQuestion: `Evaluated ${completedCount} of ${responses.length} questions...`
            });
          }
        })
      );

      setResponses(updatedResponses);
      if (updatedResponses[currentQIndex]) {
        populateForm(updatedResponses[currentQIndex]);
      }

      if (successCount > 0 && evaluatingAttempt.part_b_evaluation_status === 'pending') {
        await supabase.from('exam_attempts').update({ part_b_evaluation_status: 'draft' }).eq('id', evaluatingAttempt.id);
        setEvaluatingAttempt({ ...evaluatingAttempt, part_b_evaluation_status: 'draft' });
      }

      if (failureErrors.length === responses.length) {
        toast({ 
          title: "Batch AI Evaluation Failed", 
          description: failureErrors[0] || "All questions failed evaluation.", 
          variant: "destructive" 
        });
      } else if (failureErrors.length > 0) {
        toast({ 
          title: "Batch AI Evaluation Partial", 
          description: `${successCount} evaluated successfully, ${failureErrors.length} failed. (${failureErrors[0]})`, 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Batch AI Evaluation Finished!", 
          description: `All ${responses.length} Part B questions evaluated. Review responses and verify.` 
        });
      }
    } catch (err: any) {
      toast({ title: "Batch Evaluation Error", description: err.message, variant: "destructive" });
    } finally {
      setAiEvaluatingBatch(false);
      setShowBatchModal(false);
    }
  };

  if (isLoadingAttempts && !evaluatingAttempt) {
    return <div className="flex items-center justify-center py-20 text-foreground/40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // -------------------------------------------------------------
  // LIST VIEW
  // -------------------------------------------------------------
  if (!evaluatingAttempt) {
    // Filter attempts by search query (Candidate name, DF ID, email, test title, test code)
    const filteredAttempts = useMemo(() => {
      if (!searchQuery.trim()) return attempts;
      const q = searchQuery.toLowerCase().trim();
      return attempts.filter((a: any) => {
        const name = (a.exam_candidates?.name || '').toLowerCase();
        const email = (a.exam_candidates?.email || '').toLowerCase();
        const uid = (a.exam_candidates?.unique_id || '').toLowerCase();
        const title = (a.exam_tests?.title || '').toLowerCase();
        const code = (a.exam_tests?.test_code || '').toLowerCase();
        return name.includes(q) || email.includes(q) || uid.includes(q) || title.includes(q) || code.includes(q);
      });
    }, [attempts, searchQuery]);

    // Paper-wise grouping (Segregate attempts by Exam Paper)
    const paperGroups = useMemo(() => {
      const map = new Map<string, { test: any; attempts: any[] }>();
      filteredAttempts.forEach((a: any) => {
        const key = a.test_id || a.exam_tests?.id || 'unknown';
        if (!map.has(key)) {
          map.set(key, { test: a.exam_tests, attempts: [] });
        }
        map.get(key)!.attempts.push(a);
      });
      return Array.from(map.values()).sort((a, b) => {
        const aFB = a.test?.is_focus_batch ? 0 : 1;
        const bFB = b.test?.is_focus_batch ? 0 : 1;
        if (aFB !== bFB) return aFB - bFB;
        return (a.test?.title || '').localeCompare(b.test?.title || '');
      });
    }, [filteredAttempts]);

    // Student-wise grouping (Segregate attempts by Candidate Name)
    const studentGroups = useMemo(() => {
      const map = new Map<string, { candidate: any; attempts: any[] }>();
      filteredAttempts.forEach((a: any) => {
        const key = a.candidate_id || a.exam_candidates?.id || 'unknown';
        if (!map.has(key)) {
          map.set(key, { candidate: a.exam_candidates, attempts: [] });
        }
        map.get(key)!.attempts.push(a);
      });
      return Array.from(map.values()).sort((a, b) => {
        const aFB = a.candidate?.access_level === 'focus_batch' ? 0 : 1;
        const bFB = b.candidate?.access_level === 'focus_batch' ? 0 : 1;
        if (aFB !== bFB) return aFB - bFB;
        return (a.candidate?.name || '').localeCompare(b.candidate?.name || '');
      });
    }, [filteredAttempts]);

    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#262626]">Part B Evaluations</h1>
            <p className="text-sm text-[#262626]/50 mt-1">Review and grade subjective candidate submissions.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setShowAiSettingsModal(true)}
              variant="outline"
              size="sm"
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 border-black/15 hover:bg-black/5"
            >
              <Settings className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Evaluator</span>
            </Button>
            <Button
              onClick={() => {
                setProxySelectedCandidate(null);
                setProxyCandidateFilter('focus_batch');
                setProxyCandidateSearch('');
                setProxySelectedTestId('');
                setProxyTestQuestions([]);
                setProxyResponses({});
                setShowProxyModal(true);
              }}
              size="sm"
              className="h-9 px-4 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Submit on Behalf of Student</span>
            </Button>
          </div>
        </div>

        {/* Search & View Mode Switcher Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-black/5 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input
                type="text"
                placeholder="Search student, DF ID, test code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 text-xs bg-black/[0.02] border-black/10 rounded-xl"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Segregation View Modes */}
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('paper')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'paper' ? 'bg-white shadow-xs text-primary font-bold' : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>By Paper ({paperGroups.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('student')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'student' ? 'bg-white shadow-xs text-primary font-bold' : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>By Student ({studentGroups.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'flat' ? 'bg-white shadow-xs text-primary font-bold' : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>All Attempts ({filteredAttempts.length})</span>
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-1.5 p-1 bg-black/5 rounded-xl text-xs font-semibold self-start lg:self-auto">
            <button 
              onClick={() => { setActiveTab('pending'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'pending' ? 'bg-white shadow-xs text-primary font-bold' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Pending {activeTab === 'pending' && attemptsData?.total !== undefined && <span className="ml-1 opacity-70 font-mono">({attemptsData.total})</span>}
            </button>
            <button 
              onClick={() => { setActiveTab('draft'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'draft' ? 'bg-white shadow-xs text-orange-600 font-bold' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Drafts {activeTab === 'draft' && attemptsData?.total !== undefined && <span className="ml-1 opacity-70 font-mono">({attemptsData.total})</span>}
            </button>
            <button 
              onClick={() => { setActiveTab('completed'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'completed' ? 'bg-white shadow-xs text-green-600 font-bold' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Evaluated {activeTab === 'completed' && attemptsData?.total !== undefined && <span className="ml-1 opacity-70 font-mono">({attemptsData.total})</span>}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: SEGREGATE BY EXAM PAPER (Recommended)                 */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'paper' && (
          <div className="space-y-4">
            {paperGroups.map(({ test, attempts: pAttempts }) => {
              const testKey = test?.id || 'unknown';
              const isExpanded = expandedPapers[testKey] !== false; // Default expanded
              const pendingCount = pAttempts.filter((a: any) => a.part_b_evaluation_status === 'pending' || !a.part_b_evaluation_status).length;
              const completedCount = pAttempts.filter((a: any) => a.part_b_evaluation_status === 'completed').length;

              return (
                <div key={testKey} className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-2xs">
                  {/* Paper Header */}
                  <div 
                    onClick={() => setExpandedPapers(prev => ({ ...prev, [testKey]: !isExpanded }))}
                    className="p-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-neutral-50/80 transition-colors border-b border-black/5"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      {test?.test_code && (
                        <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wide">
                          {test.test_code}
                        </span>
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-[#262626] flex items-center gap-2">
                          <span>{test?.title || 'Unknown Exam Test'}</span>
                          {test?.is_focus_batch && (
                            <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-orange-200">
                              Focus Batch
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-foreground/50 mt-0.5">
                          {test?.exam_programs?.name || (test?.program_format === 'masters' ? 'M.Des' : 'B.Des')} • {pAttempts.length} Total Submissions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {pendingCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">
                            {pendingCount} Pending
                          </span>
                        )}
                        {completedCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[11px]">
                            {completedCount} Evaluated
                          </span>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-foreground/60">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Attendees List Under This Paper */}
                  {isExpanded && (
                    <div className="divide-y divide-black/5 bg-neutral-50/30">
                      <div className="grid grid-cols-12 gap-4 px-6 py-2.5 bg-black/[0.02] text-[11px] font-bold text-foreground/50 uppercase tracking-wider hidden md:grid">
                        <div className="col-span-4">Student Attendee</div>
                        <div className="col-span-2">Submitted Date</div>
                        <div className="col-span-3">Scores (Part A / B / Total)</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2 text-right">Action</div>
                      </div>

                      {pAttempts.map((attempt: any) => (
                        <div key={attempt.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 px-6 items-center hover:bg-white transition-colors text-xs">
                          <div className="col-span-4 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {attempt.exam_candidates?.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="font-bold text-[#262626]">
                                {attempt.exam_candidates?.name}
                                {attempt.exam_candidates?.access_level === 'focus_batch' && (
                                  <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-green-100 text-green-800 border border-green-200">
                                    FB
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-foreground/50 font-mono">{attempt.exam_candidates?.unique_id}</p>
                            </div>
                          </div>

                          <div className="col-span-2 text-foreground/60 font-medium">
                            {new Date(attempt.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>

                          <div className="col-span-3 flex flex-wrap gap-1.5 items-center">
                            {attempt.total_part_a > 0 && (
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-200">
                                A: {formatScore(attempt.score_part_a)}/{attempt.total_part_a}
                              </span>
                            )}
                            {attempt.score_part_b !== null && (
                              <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-200">
                                B: {formatScore(attempt.score_part_b)}
                              </span>
                            )}
                            {attempt.total_score !== null && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black border border-primary/20">
                                Total: {formatScore(attempt.total_score)}
                              </span>
                            )}
                            {attempt.total_part_a === 0 && attempt.score_part_b === null && (
                              <span className="text-[11px] font-medium text-foreground/40 italic">Pending</span>
                            )}
                          </div>

                          <div className="col-span-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              attempt.part_b_evaluation_status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : attempt.part_b_evaluation_status === 'draft' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {attempt.part_b_evaluation_status || 'Pending'}
                            </span>
                          </div>

                          <div className="col-span-2 flex justify-end">
                            <Button 
                              onClick={() => loadEvaluation(attempt)} 
                              size="sm"
                              className={`h-7 px-3 font-bold text-xs rounded-md ${
                                attempt.part_b_evaluation_status === 'completed' 
                                  ? 'border border-black/10 bg-white hover:bg-black/5 text-[#262626]' 
                                  : 'bg-primary text-white hover:bg-primary/90 shadow-2xs'
                              }`}
                            >
                              {attempt.part_b_evaluation_status === 'completed' ? 'Edit Evaluation' : attempt.part_b_evaluation_status === 'draft' ? 'Resume' : 'Evaluate'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {paperGroups.length === 0 && (
              <div className="bg-white rounded-2xl border border-black/5 p-12 text-center text-foreground/40">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-sm">No test papers found matching your filters.</p>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: SEGREGATE BY STUDENT CANDIDATE                        */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'student' && (
          <div className="space-y-4">
            {studentGroups.map(({ candidate, attempts: sAttempts }) => {
              const candKey = candidate?.id || 'unknown';
              const isExpanded = expandedStudents[candKey] !== false; // Default expanded
              const isFB = candidate?.access_level === 'focus_batch';

              return (
                <div key={candKey} className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-2xs">
                  {/* Student Header */}
                  <div 
                    onClick={() => setExpandedStudents(prev => ({ ...prev, [candKey]: !isExpanded }))}
                    className="p-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-neutral-50/80 transition-colors border-b border-black/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                        {candidate?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#262626] flex items-center gap-2">
                          <span>{candidate?.name || 'Unknown Candidate'}</span>
                          {isFB && (
                            <span className="bg-green-100 text-green-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-green-200">
                              Focus Batch
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-foreground/50 font-mono mt-0.5">
                          {candidate?.unique_id} • {candidate?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-black/5 text-foreground/70 text-xs font-semibold">
                        {sAttempts.length} Paper Attempt{sAttempts.length === 1 ? '' : 's'}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-foreground/60">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Test Submissions by this student */}
                  {isExpanded && (
                    <div className="divide-y divide-black/5 bg-neutral-50/30">
                      <div className="grid grid-cols-12 gap-4 px-6 py-2.5 bg-black/[0.02] text-[11px] font-bold text-foreground/50 uppercase tracking-wider hidden md:grid">
                        <div className="col-span-5">Paper Attempted</div>
                        <div className="col-span-2">Date Submitted</div>
                        <div className="col-span-3">Scores</div>
                        <div className="col-span-2 text-right">Action</div>
                      </div>

                      {sAttempts.map((attempt: any) => (
                        <div key={attempt.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 px-6 items-center hover:bg-white transition-colors text-xs">
                          <div className="col-span-5">
                            <div className="flex items-center gap-2">
                              {attempt.exam_tests?.test_code && (
                                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">
                                  {attempt.exam_tests.test_code}
                                </span>
                              )}
                              <span className="font-bold text-[#262626] truncate">{attempt.exam_tests?.title || 'Exam'}</span>
                            </div>
                            <span className="text-[10px] text-foreground/50 capitalize">
                              Format: {attempt.exam_tests?.program_format || 'Standard'}
                            </span>
                          </div>

                          <div className="col-span-2 text-foreground/60 font-medium">
                            {new Date(attempt.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>

                          <div className="col-span-3 flex flex-wrap gap-1.5 items-center">
                            {attempt.total_part_a > 0 && (
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-200">
                                A: {formatScore(attempt.score_part_a)}/{attempt.total_part_a}
                              </span>
                            )}
                            {attempt.score_part_b !== null && (
                              <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-200">
                                B: {formatScore(attempt.score_part_b)}
                              </span>
                            )}
                            {attempt.total_score !== null && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black border border-primary/20">
                                Total: {formatScore(attempt.total_score)}
                              </span>
                            )}
                          </div>

                          <div className="col-span-2 flex justify-end">
                            <Button 
                              onClick={() => loadEvaluation(attempt)} 
                              size="sm"
                              className={`h-7 px-3 font-bold text-xs rounded-md ${
                                attempt.part_b_evaluation_status === 'completed' 
                                  ? 'border border-black/10 bg-white hover:bg-black/5 text-[#262626]' 
                                  : 'bg-primary text-white hover:bg-primary/90 shadow-2xs'
                              }`}
                            >
                              {attempt.part_b_evaluation_status === 'completed' ? 'Edit' : attempt.part_b_evaluation_status === 'draft' ? 'Resume' : 'Evaluate'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {studentGroups.length === 0 && (
              <div className="bg-white rounded-2xl border border-black/5 p-12 text-center text-foreground/40">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-sm">No students found matching your filters.</p>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: FLAT TIMELINE FEED (All Attempts)                     */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'flat' && (
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-2xs">
            <div className="grid grid-cols-12 gap-4 border-b border-black/5 p-4 bg-background/50 text-xs font-semibold text-foreground/50 uppercase tracking-widest hidden md:grid">
              <div className="col-span-3">Candidate</div>
              <div className="col-span-3">Test</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Scores</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            <div className="divide-y divide-black/5">
              {filteredAttempts.map(attempt => (
                <div key={attempt.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 px-4 items-center hover:bg-background/30 transition-colors text-sm">
                  <div className="col-span-3 flex flex-col justify-center">
                    <p className="font-bold text-[#262626] leading-tight flex items-center gap-1.5">
                      <span>{attempt.exam_candidates?.name}</span>
                      {attempt.exam_candidates?.access_level === 'focus_batch' && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          FB
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-foreground/50 mt-0.5 font-mono">{attempt.exam_candidates?.unique_id}</p>
                  </div>
                  <div className="col-span-3 text-foreground/70 font-semibold truncate text-xs flex items-center gap-1.5" title={attempt.exam_tests?.title}>
                    {attempt.exam_tests?.test_code && (
                      <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">
                        {attempt.exam_tests.test_code}
                      </span>
                    )}
                    <span className="truncate">{attempt.exam_tests?.title}</span>
                  </div>
                  <div className="col-span-2 text-foreground/60 text-xs font-medium">
                    {new Date(attempt.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-1.5 items-center">
                    {attempt.total_part_a > 0 && (
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-200">
                        A: {formatScore(attempt.score_part_a)}/{attempt.total_part_a}
                      </span>
                    )}
                    {attempt.score_part_b !== null && (
                      <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-200">
                        B: {formatScore(attempt.score_part_b)}
                      </span>
                    )}
                    {attempt.total_score !== null && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black border border-primary/20">
                        Total: {formatScore(attempt.total_score)}
                      </span>
                    )}
                    {attempt.total_part_a === 0 && attempt.score_part_b === null && (
                      <span className="text-[11px] font-medium text-foreground/40 italic">Pending</span>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button 
                      onClick={() => loadEvaluation(attempt)} 
                      variant={activeTab === 'completed' ? "outline" : "default"}
                      size="sm"
                      className={`h-7 px-3 font-bold text-xs rounded-md ${activeTab === 'completed' ? '' : 'bg-primary text-white hover:bg-primary/90 shadow-2xs'}`}
                    >
                      {activeTab === 'completed' ? 'Edit' : activeTab === 'draft' ? 'Resume' : 'Evaluate'}
                    </Button>
                  </div>
                </div>
              ))}
              {filteredAttempts.length === 0 && (
                <div className="p-12 text-center text-foreground/40">
                  <PenTool className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No attempts found in this category.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/50">
              Page {page + 1} of {totalPages} &mdash; {attemptsData?.total} total
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0 || isLoadingAttempts} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1 || isLoadingAttempts} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* AI Configuration Modal (List View) */}
        <Dialog open={showAiSettingsModal} onOpenChange={setShowAiSettingsModal}>
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Configure AI Evaluator
              </DialogTitle>
              <DialogDescription>
                Choose between OpenAI (GPT-4o) or Google Gemini for evaluating sketches against NID rubrics.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                  Active Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { 
                      setActiveAiProvider('openai'); 
                      setTestAiResult(null); 
                      try { localStorage.setItem("df_ai_provider", "openai"); } catch (e) {}
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeAiProvider === 'openai' 
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs' 
                        : 'border-black/10 bg-white hover:bg-black/5 text-foreground/70'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>OpenAI</span>
                      {activeAiProvider === 'openai' && <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                    <p className="text-[11px] text-foreground/50 mt-1">GPT-4o / GPT-4o-mini</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { 
                      setActiveAiProvider('gemini'); 
                      setTestAiResult(null); 
                      try { localStorage.setItem("df_ai_provider", "gemini"); } catch (e) {}
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeAiProvider === 'gemini' 
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs' 
                        : 'border-black/10 bg-white hover:bg-black/5 text-foreground/70'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Google Gemini</span>
                      {activeAiProvider === 'gemini' && <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                    <p className="text-[11px] text-foreground/50 mt-1">gemini-flash-latest</p>
                  </button>
                </div>
              </div>

              {activeAiProvider === 'openai' ? (
                <div className="space-y-3 pt-2 border-t border-black/5">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      placeholder="sk-proj-..."
                      value={configOpenaiKey}
                      onChange={(e) => setConfigOpenaiKey(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">
                      Model
                    </label>
                    <select
                      value={configOpenaiModel}
                      onChange={(e) => setConfigOpenaiModel(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (Faster & cost-effective)</option>
                      <option value="gpt-4o">gpt-4o (Highest reasoning & visual accuracy)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-black/5">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">
                      Gemini API Key
                    </label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={configGeminiKey}
                      onChange={(e) => setConfigGeminiKey(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">
                      Model
                    </label>
                    <select
                      value={configGeminiModel}
                      onChange={(e) => setConfigGeminiModel(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="gemini-flash-latest">gemini-flash-latest (Recommended)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    </select>
                  </div>
                </div>
              )}

              {testAiResult && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                  testAiResult.startsWith("✅") 
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200" 
                    : testAiResult.startsWith("⚠️")
                    ? "bg-amber-50 text-amber-900 border border-amber-200 font-medium"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}>
                  {testAiResult}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={testingAiKey}
                onClick={handleTestAiKey}
                className="text-xs font-semibold"
              >
                {testingAiKey ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Test Connection
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={savingAiSettings}
                onClick={handleSaveAiSettings}
                className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
              >
                {savingAiSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Admin Proxy Submission Modal (List View) */}
        <Dialog open={showProxyModal} onOpenChange={setShowProxyModal}>
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-6 pb-4 border-b shrink-0">
              <DialogTitle className="text-xl font-bold text-[#262626] flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <span>Submit on Behalf of Student</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/60">
                Create an exam submission for a student who could not complete their upload due to connectivity or technical issues.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Step 1: Candidate Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">
                    1. Select Student
                  </label>
                  {proxySelectedCandidate && (
                    <span className="text-[11px] font-medium text-emerald-600">Student selected</span>
                  )}
                </div>

                {/* Filter Tabs: Focus Batch (default) / Material / Generic / All */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/5 rounded-xl border border-black/5 w-fit mb-3">
                  <button
                    type="button"
                    onClick={() => setProxyCandidateFilter('focus_batch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      proxyCandidateFilter === 'focus_batch'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-foreground/70 hover:text-foreground hover:bg-black/5'
                    }`}
                  >
                    Focus Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setProxyCandidateFilter('materials_only')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      proxyCandidateFilter === 'materials_only'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-foreground/70 hover:text-foreground hover:bg-black/5'
                    }`}
                  >
                    Material
                  </button>
                  <button
                    type="button"
                    onClick={() => setProxyCandidateFilter('generic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      proxyCandidateFilter === 'generic'
                        ? 'bg-zinc-800 text-white shadow-xs font-bold'
                        : 'text-foreground/70 hover:text-foreground hover:bg-black/5'
                    }`}
                  >
                    Generic
                  </button>
                  <button
                    type="button"
                    onClick={() => setProxyCandidateFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      proxyCandidateFilter === 'all'
                        ? 'bg-zinc-800 text-white shadow-xs font-bold'
                        : 'text-foreground/70 hover:text-foreground hover:bg-black/5'
                    }`}
                  >
                    All Students
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search student by name, email, or DF ID…"
                    value={proxyCandidateSearch}
                    onChange={(e) => setProxyCandidateSearch(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />

                  {proxySelectedCandidate ? (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                          {proxySelectedCandidate.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
                            <span>{proxySelectedCandidate.name}</span>
                            {(proxySelectedCandidate.access_level === 'focus_batch' || proxySelectedCandidate.has_focus_mocks_access) && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                                Focus Batch
                              </span>
                            )}
                            {proxySelectedCandidate.access_level === 'materials_only' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Material
                              </span>
                            )}
                            {proxySelectedCandidate.education_level && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 text-foreground/60">
                                {proxySelectedCandidate.education_level === 'bachelors' ? 'B.Des' : proxySelectedCandidate.education_level === 'masters' ? 'M.Des' : proxySelectedCandidate.education_level}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-foreground/50">{proxySelectedCandidate.email} • {proxySelectedCandidate.unique_id}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProxySelectedCandidate(null)}
                        className="text-xs h-7 text-foreground/50 hover:text-red-600"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-black/10 rounded-xl divide-y divide-black/5 bg-white">
                      {proxyCandidates.length === 0 ? (
                        <div className="p-4 text-center text-xs text-foreground/40">
                          No students found in {proxyCandidateFilter.replace('_', ' ')}
                        </div>
                      ) : (
                        proxyCandidates.map((cand: any) => {
                          const isFocus = cand.access_level === 'focus_batch' || cand.has_focus_mocks_access;
                          const isMaterial = cand.access_level === 'materials_only';
                          return (
                            <div
                              key={cand.id}
                              onClick={() => setProxySelectedCandidate(cand)}
                              className="p-2.5 hover:bg-black/5 cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div>
                                <div className="text-xs font-semibold text-[#262626] flex items-center gap-1.5">
                                  <span>{cand.name}</span>
                                  {isFocus && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-800 border border-green-200">
                                      Focus
                                    </span>
                                  )}
                                  {isMaterial && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                      Material
                                    </span>
                                  )}
                                  {!isFocus && !isMaterial && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/5 text-foreground/60">
                                      Generic
                                    </span>
                                  )}
                                  {cand.education_level && (
                                    <span className="text-[10px] text-foreground/40">
                                      ({cand.education_level === 'bachelors' ? 'B.Des' : cand.education_level === 'masters' ? 'M.Des' : cand.education_level})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-foreground/50">{cand.email} • {cand.unique_id}</div>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">Select</Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Test Selection */}
              <div>
                <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                  2. Select Exam Test
                </label>
                <select
                  value={proxySelectedTestId}
                  onChange={(e) => handleSelectProxyTest(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{isLoadingProxyTests ? "Loading tests..." : "-- Choose Test --"}</option>
                  {proxyTests.map((t: any) => {
                    const isFocus = t.is_focus_batch;
                    const prog = t.exam_programs?.name || (t.program_format === 'bachelors' ? 'B.Des' : t.program_format === 'masters' ? 'M.Des' : 'All');
                    return (
                      <option key={t.id} value={t.id}>
                        {t.title} • {isFocus ? 'Focus Batch' : 'Generic'} ({prog})
                      </option>
                    );
                  })}
                </select>
                {proxyLoadingQuestions && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-foreground/60">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Loading questions for selected exam...</span>
                  </div>
                )}
              </div>

              {/* Step 3: Question-wise Solutions */}
              {proxySelectedTestId && (
                <div className="space-y-4 pt-2">
                  <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">
                    3. Upload Solutions Question-Wise ({proxyTestQuestions.length} Questions)
                  </label>

                  {proxyTestQuestions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-black/5 text-center text-xs text-foreground/50">
                      {proxyLoadingQuestions ? "Loading questions..." : "This test has no Part B questions configured."}
                    </div>
                  ) : (
                    proxyTestQuestions.map((q, idx) => {
                      const resp = proxyResponses[q.id] || { fileUrls: [], answerText: '' };
                      return (
                        <div key={q.id} className="p-4 rounded-xl border border-black/10 bg-black/[0.01] space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#262626]">
                                Q{idx + 1}. {q.pyq_tag ? cleanPlainText(q.pyq_tag) : `Question ${idx + 1}`}
                              </span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                {q.marks || 10} Marks
                              </span>
                            </div>
                            {q.content_text && (
                              <div className="text-xs text-foreground/80 bg-black/[0.03] p-3 rounded-lg border border-black/5 whitespace-pre-line leading-relaxed font-normal">
                                {cleanPlainText(q.content_text)}
                              </div>
                            )}
                          </div>

                          {/* Sketches Uploaded */}
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground/60 mb-1.5">
                              Sketches / Photos ({resp.fileUrls.length} attached)
                            </label>

                            {resp.fileUrls.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {resp.fileUrls.map((url, i) => (
                                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-black/10">
                                    <img src={url} alt="Thumbnail" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = resp.fileUrls.filter((_, idx2) => idx2 !== i);
                                        setProxyResponses(p => ({
                                          ...p,
                                          [q.id]: { ...p[q.id], fileUrls: updated }
                                        }));
                                      }}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 bg-white hover:bg-black/5 text-xs font-semibold">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={proxyUploadingQId === q.id}
                                onChange={(e) => handleProxyFileUpload(e.target.files, q.id)}
                              />
                              {proxyUploadingQId === q.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UploadCloud className="w-3.5 h-3.5 text-primary" />
                              )}
                              <span>{proxyUploadingQId === q.id ? 'Compressing & uploading...' : 'Attach Image Files'}</span>
                            </label>
                          </div>

                          {/* Concept notes */}
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground/60 mb-1">
                              Student Notes / Concept Text
                            </label>
                            <textarea
                              rows={2}
                              value={resp.answerText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProxyResponses(p => ({
                                  ...p,
                                  [q.id]: { ...p[q.id], answerText: val }
                                }));
                              }}
                              placeholder="Type student's written response or problem statement notes..."
                              className="w-full text-xs p-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:ring-1 focus:ring-primary/20 resize-y"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t bg-muted/20 shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowProxyModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submittingProxy || !proxySelectedCandidate || !proxySelectedTestId}
                onClick={handleSubmitProxy}
                className="text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1.5"
              >
                {submittingProxy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                <span>Create Submission Entry</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SIDE-BY-SIDE EVALUATION VIEW
  // -------------------------------------------------------------
  
  const currentResponse = responses[currentQIndex];
  const currentQ = questions.find(q => q.id === currentResponse?.question_id);
  
  // Determine max marks per question: UCEED = 50 marks/Q, CEED = 20 marks/Q
  const testTitleLower = (evaluatingAttempt?.exam_tests?.title || '').toLowerCase();
  const programNameLower = (evaluatingAttempt?.exam_tests?.exam_programs?.name || '').toLowerCase();
  const programFormatLower = (evaluatingAttempt?.exam_tests?.program_format || '').toLowerCase();

  const isUceed = testTitleLower.includes('uceed') || programNameLower.includes('uceed') || testTitleLower.includes('b.des') || testTitleLower.includes('bdes') || programFormatLower === 'bachelors';
  const isCeed = testTitleLower.includes('ceed') || programNameLower.includes('ceed') || testTitleLower.includes('m.des') || testTitleLower.includes('mdes') || programFormatLower === 'masters';

  let maxMarksPerQ = 50; // Default UCEED
  if (isCeed && !testTitleLower.includes('uceed') && !programNameLower.includes('uceed')) {
    maxMarksPerQ = 20;
  } else if (isUceed) {
    maxMarksPerQ = 50;
  } else if (questions.length > 0) {
    maxMarksPerQ = 100 / questions.length;
  }

  if (currentQ?.marks && typeof currentQ.marks === 'number' && currentQ.marks > 0) {
    maxMarksPerQ = currentQ.marks;
  }
  
  // Find current marks sum for the confirmation modal
  let currentSum = 0;
  responses.forEach(r => {
    if (r.id === currentResponse?.id) {
       currentSum += evalForm.marks_awarded !== "" && !isNaN(parseFloat(evalForm.marks_awarded)) ? parseFloat(evalForm.marks_awarded) : 0;
    } else {
       if (r.marks_awarded) currentSum += parseFloat(r.marks_awarded);
    }
  });

  return (
    <div className="absolute inset-0 z-20 bg-[#F8F9FA] flex flex-col animate-in fade-in duration-300">
      {/* Top Nav */}
      <div className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { saveCurrentQuestionDraft(); setEvaluatingAttempt(null); }} className="text-foreground/60"><ArrowLeft className="w-4 h-4 mr-2" /> Back to List</Button>
          <div className="h-6 w-px bg-black/10 mx-2" />
          <h2 className="text-lg font-bold text-[#262626]">
             {evaluatingAttempt.exam_candidates.name} <span className="text-foreground/40 font-normal ml-2">({evaluatingAttempt.exam_candidates.unique_id})</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            disabled={aiEvaluatingBatch || aiEvaluatingSingle}
            onClick={handleBatchAiEvaluate}
            className="font-bold border-purple-200 text-purple-700 bg-purple-50/60 hover:bg-purple-100/70 gap-1.5"
          >
            {aiEvaluatingBatch ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Sparkles className="w-4 h-4 text-purple-600" />}
            Evaluate All with {activeAiProvider === 'openai' ? 'OpenAI' : 'Gemini'}
          </Button>
          <Button variant="outline" onClick={() => { saveCurrentQuestionDraft(); toast({ title: "Draft Saved" }); }} className="font-bold border-orange-200 text-orange-600 hover:bg-orange-50">
            Save Draft
          </Button>
          <Button onClick={() => setShowConfirmModal(true)} className="font-bold bg-green-600 text-white hover:bg-green-700">
            Verify & Complete
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Question & Candidate Upload */}
        <div className="w-[70%] bg-[#F8F9FA] border-r border-black/5 flex flex-col overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-bold uppercase tracking-widest">Part B - Subjective</span>
            <span className="text-sm font-bold text-foreground/50">Question {currentQIndex + 1} of {responses.length}</span>
          </div>
          
          {currentQ && (
            <div className="bg-white p-5 rounded-xl border border-black/5 shadow-sm mb-6 space-y-4">
              <div 
                className="text-sm text-[#262626] leading-relaxed max-w-full prose prose-sm prose-p:my-1 prose-img:max-h-[500px] prose-img:w-auto prose-img:rounded-xl prose-img:shadow-sm prose-img:my-2" 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml((currentQ.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ')) }} 
              />
              {parseQuestionMediaUrls(currentQ.media_url).length > 0 ? (
                <div className="pt-3 border-t border-black/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
                        Question Reference Image ({parseQuestionMediaUrls(currentQ.media_url).length} page{parseQuestionMediaUrls(currentQ.media_url).length > 1 ? 's' : ''})
                      </span>
                      {parseQuestionMediaUrls(currentQ.media_url).length > 1 && (
                        <div className="flex items-center gap-1 bg-black/5 p-0.5 rounded-md">
                          {parseQuestionMediaUrls(currentQ.media_url).map((_, qmIdx) => (
                            <button
                              key={qmIdx}
                              onClick={() => setSelectedQuestionMediaIndex(qmIdx)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${selectedQuestionMediaIndex === qmIdx ? 'bg-primary text-white shadow-xs' : 'text-foreground/70 hover:bg-black/10'}`}
                            >
                              Page {qmIdx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={uploadingQuestionMedia}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleUploadQuestionMedia(e.target.files);
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 px-2 text-xs text-primary font-medium hover:bg-primary/5"
                        >
                          <span>
                            {uploadingQuestionMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                            Add Page / Image
                          </span>
                        </Button>
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFullscreenImage(parseQuestionMediaUrls(currentQ.media_url)[selectedQuestionMediaIndex] || parseQuestionMediaUrls(currentQ.media_url)[0])}
                        className="h-7 px-2 text-xs"
                      >
                        <Maximize className="w-3.5 h-3.5 mr-1" /> Full Screen
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-black/10 overflow-hidden bg-neutral-50/50 p-2 max-w-2xl relative group">
                    <img
                      src={parseQuestionMediaUrls(currentQ.media_url)[selectedQuestionMediaIndex] || parseQuestionMediaUrls(currentQ.media_url)[0]}
                      alt="Question Reference"
                      className="max-h-[450px] w-auto max-w-full rounded-lg object-contain mx-auto cursor-pointer"
                      onClick={() => setFullscreenImage(parseQuestionMediaUrls(currentQ.media_url)[selectedQuestionMediaIndex] || parseQuestionMediaUrls(currentQ.media_url)[0])}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('candidate-submissions')) {
                          target.src = normalizeSubmissionUrl(currentQ.media_url).url;
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-black/5">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-900">No Question Image Attached</div>
                        <div className="text-[11px] text-amber-800/80">Upload question reference or diagram while evaluating to guide marking.</div>
                      </div>
                    </div>
                    <label className="cursor-pointer shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingQuestionMedia}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleUploadQuestionMedia(e.target.files);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        disabled={uploadingQuestionMedia}
                        asChild
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-xs"
                      >
                        <span>
                          {uploadingQuestionMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                          Upload Question Image / Add Page
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-foreground/50 uppercase tracking-widest">Candidate Submission</h3>
            {parseFileUrls(currentResponse?.file_url).length > 1 && (
              <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-lg">
                {parseFileUrls(currentResponse?.file_url).map((_, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setSelectedFileIndex(pIdx)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${selectedFileIndex === pIdx ? 'bg-primary text-white shadow-sm' : 'text-foreground/70 hover:bg-black/10'}`}
                  >
                    Page {pIdx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-black/5 shadow-sm flex-1 flex flex-col items-center justify-center min-h-[400px] overflow-hidden relative">
             {parseFileUrls(currentResponse?.file_url).length > 0 ? (
               <>
                 {(() => {
                   const fileUrls = parseFileUrls(currentResponse?.file_url);
                   const rawActive = fileUrls[selectedFileIndex] || fileUrls[0] || '';
                   const normalized = normalizeSubmissionUrl(rawActive);
                   const displayUrl = resolvedUrlOverride || normalized.url;

                   if (normalized.isFilenameOnly) {
                     return (
                       <div 
                         className="flex flex-col items-center justify-center p-8 bg-amber-50/60 rounded-xl border-2 border-dashed border-amber-300 text-center max-w-lg my-auto transition-all"
                         onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                         onDrop={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           const droppedFile = e.dataTransfer.files?.[0];
                           if (droppedFile && droppedFile.type.startsWith('image/')) {
                             handleAdminManualUpload(droppedFile);
                           }
                         }}
                       >
                         <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3">
                           <AlertCircle className="w-6 h-6" />
                         </div>
                         <h4 className="font-bold text-base text-amber-900 mb-1">Local Filename Recorded</h4>
                         <p className="font-mono text-xs bg-white px-3 py-1 rounded border border-amber-200 text-amber-800 mb-3 break-all max-w-sm">
                           {normalized.url}
                         </p>
                         <p className="text-xs text-amber-800 leading-relaxed mb-4 max-w-sm">
                           During submission, this file was recorded as an attachment by the candidate's browser, but cloud sync was interrupted. You can search storage or attach the sketch directly to evaluate.
                         </p>

                         <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                           <Button
                             size="sm"
                             variant="outline"
                             disabled={retryingSignedUrl || adminUploading}
                             onClick={() => attemptSignedUrlRecovery(`submissions/${evaluatingAttempt.id}/${currentResponse.question_id}_${normalized.url}`)}
                             className="text-xs gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100 bg-white"
                           >
                             {retryingSignedUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                             Search Storage
                           </Button>

                           <label className="cursor-pointer">
                             <input
                               type="file"
                               accept="image/*"
                               className="hidden"
                               disabled={adminUploading}
                               onChange={(e) => {
                                 const f = e.target.files?.[0];
                                 if (f) handleAdminManualUpload(f);
                               }}
                             />
                             <Button
                               size="sm"
                               disabled={adminUploading}
                               asChild
                               className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                             >
                               <span>
                                 {adminUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                 Attach Sketch File
                               </span>
                             </Button>
                           </label>
                         </div>

                         <span className="text-[11px] text-amber-700/80">
                           Or drag & drop the image here / paste directly (<kbd className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300 text-[10px]">Ctrl+V</kbd>)
                         </span>
                       </div>
                     );
                   }

                   if (normalized.isDirectImage) {
                     return (
                       <div className="flex flex-col w-full h-full relative">
                         {/* Inspection Toolbar */}
                         <div className="flex items-center justify-between px-3 py-2 bg-black/[0.03] border-b border-black/5 rounded-t-xl mb-2 shrink-0">
                           <div className="flex items-center gap-1.5">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => setZoom(prev => Math.min(3, +(prev + 0.25).toFixed(2)))}
                               className="h-8 px-2 text-xs"
                               title="Zoom In"
                             >
                               <ZoomIn className="w-3.5 h-3.5 mr-1" /> Zoom In
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => setZoom(prev => Math.max(0.5, +(prev - 0.25).toFixed(2)))}
                               className="h-8 px-2 text-xs"
                               title="Zoom Out"
                             >
                               <ZoomOut className="w-3.5 h-3.5 mr-1" /> Zoom Out
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => setRotation(prev => (prev + 90) % 360)}
                               className="h-8 px-2 text-xs"
                               title="Rotate 90°"
                             >
                               <RotateCw className="w-3.5 h-3.5 mr-1" /> Rotate
                             </Button>
                             {(zoom !== 1 || rotation !== 0) && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => { setZoom(1); setRotation(0); }}
                                 className="h-8 px-2 text-[11px] text-foreground/50 hover:text-foreground"
                               >
                                 Reset ({Math.round(zoom * 100)}%)
                               </Button>
                             )}
                           </div>

                           <div className="flex items-center gap-1.5">
                             <label className="cursor-pointer">
                               <input
                                 type="file"
                                 accept="image/*"
                                 className="hidden"
                                 disabled={adminUploading}
                                 onChange={(e) => {
                                   const f = e.target.files?.[0];
                                   if (f) handleAdminManualUpload(f);
                                 }}
                               />
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 asChild
                                 className="h-8 px-2 text-xs text-primary font-medium hover:bg-primary/5"
                                 title="Attach an additional or replacement sketch"
                               >
                                 <span>
                                   {adminUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                                   Add Page
                                 </span>
                               </Button>
                             </label>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => setFullscreenImage(displayUrl)}
                               className="h-8 px-2 text-xs"
                             >
                               <Maximize className="w-3.5 h-3.5 mr-1" /> Full Screen
                             </Button>
                             <a
                               href={displayUrl}
                               target="_blank"
                               rel="noreferrer"
                               className="inline-flex items-center justify-center h-8 px-2 text-xs text-foreground/70 hover:text-foreground rounded-md hover:bg-black/5"
                               title="Open raw image in new tab"
                             >
                               <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                             </a>
                           </div>
                         </div>

                         {/* Image Canvas Container */}
                         <div
                           className="flex-1 flex items-center justify-center relative overflow-hidden min-h-[380px] bg-[#FAFAFA] rounded-b-xl border border-black/5"
                           onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                           onDrop={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             const droppedFile = e.dataTransfer.files?.[0];
                             if (droppedFile && droppedFile.type.startsWith('image/')) {
                               handleAdminManualUpload(droppedFile);
                             }
                           }}
                         >
                           {imageLoading && !imageError && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs z-10 transition-opacity">
                               <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                               <span className="text-xs font-semibold text-foreground/60">Loading candidate sketch...</span>
                             </div>
                           )}

                           {imageError ? (
                             <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
                               <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                               <h4 className="font-bold text-sm text-[#262626] mb-1">Image Could Not Be Loaded</h4>
                               <p className="text-xs text-foreground/60 mb-4">
                                 The image URL was not accessible directly via public storage.
                               </p>
                               <div className="flex gap-2">
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   disabled={retryingSignedUrl}
                                   onClick={() => attemptSignedUrlRecovery(displayUrl)}
                                   className="text-xs gap-1.5"
                                 >
                                   {retryingSignedUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                   Generate Secure Link
                                 </Button>
                                 <label className="cursor-pointer">
                                   <input
                                     type="file"
                                     accept="image/*"
                                     className="hidden"
                                     disabled={adminUploading}
                                     onChange={(e) => {
                                       const f = e.target.files?.[0];
                                       if (f) handleAdminManualUpload(f);
                                     }}
                                   />
                                   <Button
                                     size="sm"
                                     disabled={adminUploading}
                                     asChild
                                     className="text-xs gap-1.5 bg-primary text-white hover:bg-primary/90"
                                   >
                                     <span>
                                       {adminUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                       Attach Sketch File
                                     </span>
                                   </Button>
                                 </label>
                                 <a
                                   href={displayUrl}
                                   target="_blank"
                                   rel="noreferrer"
                                   className="text-xs font-bold px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 inline-flex items-center gap-1"
                                 >
                                   <ExternalLink className="w-3.5 h-3.5" /> Direct URL
                                 </a>
                                </div>
                             </div>
                           ) : (
                             <div className="w-full h-full flex items-center justify-center p-2 overflow-auto">
                               <img
                                 src={displayUrl}
                                 alt={`Candidate Submission Page ${selectedFileIndex + 1}`}
                                 loading="lazy"
                                 decoding="async"
                                 onLoad={() => setImageLoading(false)}
                                 onError={() => {
                                   setImageLoading(false);
                                   if (!resolvedUrlOverride && displayUrl.includes('candidate-submissions')) {
                                     attemptSignedUrlRecovery(displayUrl);
                                   } else {
                                     setImageError(true);
                                   }
                                 }}
                                 style={{
                                   transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                   transformOrigin: 'center center',
                                   transition: 'transform 0.15s ease-out',
                                   maxHeight: zoom <= 1 ? '560px' : 'none',
                                   maxWidth: zoom <= 1 ? '100%' : 'none',
                                   objectFit: 'contain'
                                 }}
                                 className="rounded-lg shadow-xs select-none cursor-pointer"
                                 onClick={() => {
                                   if (zoom === 1) setFullscreenImage(displayUrl);
                                 }}
                               />
                             </div>
                           )}
                         </div>
                       </div>
                     );
                   }

                   return (
                     <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                       <FileText className="w-16 h-16 text-primary mb-3" />
                       <p className="font-bold text-sm mb-2">{normalized.url.split('/').pop()}</p>
                       <a href={normalized.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold text-xs">Open File ↗</a>
                     </div>
                   );
                 })()}
               </>
             ) : currentResponse?.answer_text ? (
               <div className="w-full h-full bg-background/50 rounded-lg p-6 border border-black/10 text-lg font-medium">
                 {currentResponse.answer_text}
               </div>
             ) : (
               <div 
                 className="flex flex-col items-center justify-center p-8 bg-neutral-50/80 rounded-2xl border-2 border-dashed border-black/15 text-center max-w-md my-auto transition-all hover:border-primary/50 hover:bg-primary/[0.02]"
                 onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                 onDrop={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   const droppedFiles = e.dataTransfer.files;
                   if (droppedFiles && droppedFiles.length > 0) {
                     handleAdminManualUpload(droppedFiles);
                   }
                 }}
               >
                 <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3 shadow-xs">
                   <UploadCloud className="w-7 h-7" />
                 </div>
                 <h4 className="font-bold text-base text-[#262626] mb-1">No Candidate Sketch Uploaded</h4>
                 <p className="text-xs text-foreground/60 leading-relaxed mb-4 max-w-xs">
                   The student has not uploaded an image for this question. Attach their sketch sheet or pages here to evaluate against rubrics or run AI evaluation.
                 </p>

                 <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                   <label className="cursor-pointer">
                     <input
                       type="file"
                       accept="image/*"
                       multiple
                       className="hidden"
                       disabled={adminUploading}
                       onChange={(e) => {
                         if (e.target.files && e.target.files.length > 0) {
                           handleAdminManualUpload(e.target.files);
                         }
                       }}
                     />
                     <Button
                       size="sm"
                       disabled={adminUploading}
                       asChild
                       className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white font-bold h-9 px-4 shadow-xs"
                     >
                       <span>
                         {adminUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                         Upload Question Sketch / Add Page
                       </span>
                     </Button>
                   </label>
                 </div>

                 <span className="text-[11px] text-foreground/50">
                   Drag & drop images here or paste directly (<kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-black/10 text-[10px]">Ctrl+V</kbd>)
                 </span>
               </div>
             )}
          </div>
        </div>

        {/* Right Side: Evaluation Form */}
        <div className="w-[30%] bg-white flex flex-col overflow-y-auto custom-scrollbar p-6 lg:p-8">
           <h3 className="text-lg font-bold text-[#262626] mb-5 flex items-center gap-2"><PenTool className="w-5 h-5 text-primary" /> Evaluation Form</h3>
           
           <div className="space-y-5 flex-1">
             {/* Gemini AI Auto-Evaluation Action */}
             <div className="p-3.5 bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border border-purple-200/80 rounded-xl shadow-xs space-y-2.5">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                   <Sparkles className="w-4 h-4 text-purple-600" /> AI Auto-Evaluation
                 </span>
                 <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 border border-purple-200 px-2 py-0.5 rounded">
                      {activeAiProvider === "openai" ? `ChatGPT (${configOpenaiModel})` : "Gemini"}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setTestAiResult(null); setShowAiSettingsModal(true); }}
                      className="p-1 rounded text-purple-700 hover:text-purple-950 hover:bg-purple-100 transition-colors"
                      title="AI Settings & API Key"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
               <p className="text-[11px] text-purple-900/70 leading-snug">
                 Evaluates sketch against 5 design rubrics and crafts a 20–25 word critique.
               </p>
               <Button
                 type="button"
                 size="sm"
                 disabled={aiEvaluatingSingle || aiEvaluatingBatch}
                 onClick={handleSingleAiEvaluate}
                 className="w-full h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs"
               >
                 {aiEvaluatingSingle ? (
                   <>
                     <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     Evaluating with {activeAiProvider === 'openai' ? 'OpenAI' : 'Gemini'}...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-3.5 h-3.5" />
                     Evaluate with {activeAiProvider === 'openai' ? `OpenAI (${configOpenaiModel})` : 'Gemini'}
                   </>
                 )}
               </Button>
             </div>

             {/* Marks Input via Rubric */}
             <div>
               <div className="flex items-center justify-between mb-3">
                 <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">Rubric Evaluation</label>
                 <div className="text-right">
                   <span className="text-lg font-black text-primary">
                     {evalForm.marks_awarded ? (Math.round(parseFloat(evalForm.marks_awarded) * 100) / 100).toFixed(2).replace(/\.?0+$/, '') : '0'}
                   </span>
                   <span className="text-xs font-bold text-foreground/40 ml-1">/ {Number.isInteger(maxMarksPerQ) ? maxMarksPerQ : (Math.round(maxMarksPerQ * 100) / 100).toFixed(2)}</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 {[
                   { key: 'critical_thinking', label: 'Critical Thinking' },
                   { key: 'ideation', label: 'Ideation' },
                   { key: 'storytelling', label: 'Storytelling' },
                   { key: 'conceptualisation', label: 'Conceptualisation' },
                   { key: 'representation', label: 'Representation' }
                 ].map(criteria => (
                   <div key={criteria.key} className="col-span-1">
                     <label className="block text-[10px] font-bold text-foreground/60 mb-1">{criteria.label}</label>
                     <div className="relative">
                       <input 
                         type="number" 
                         min="0"
                         step="0.01"
                         aria-label={`Score for ${criteria.label}`}
                         value={(evalForm.rubric_marks as any)[criteria.key]}
                         onChange={e => {
                           const maxPerCriteria = Math.round((maxMarksPerQ / 5) * 100) / 100;
                           let rawVal = e.target.value;
                           let cleanVal = "";
                           if (rawVal !== "") {
                             let num = parseFloat(rawVal);
                             if (isNaN(num) || num < 0) num = 0;
                             if (num > maxPerCriteria) num = maxPerCriteria;
                             // Limit strictly to 2 decimal places
                             num = Math.round(num * 100) / 100;
                             cleanVal = num.toString();
                           }
                           
                           const newRubric = { ...evalForm.rubric_marks, [criteria.key]: cleanVal };
                           
                           // Calculate total
                           let sum = 0;
                           Object.values(newRubric).forEach(v => {
                             if (v !== "" && !isNaN(parseFloat(v as string))) {
                               sum += Math.max(0, parseFloat(v as string));
                             }
                           });
                           
                           const roundedSum = Math.max(0, Math.round(sum * 100) / 100);
                           setEvalForm({ ...evalForm, rubric_marks: newRubric, marks_awarded: roundedSum.toString() });
                         }}
                         className="w-full h-9 border-2 border-primary/10 rounded-lg px-2 text-sm font-bold bg-primary/5 focus:outline-none focus:border-primary text-primary text-left [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                         placeholder="0"
                       />
                       <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30 pointer-events-none">/ {(maxMarksPerQ / 5).toFixed(2).replace(/\.?0+$/, '')}</div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Comments */}
             <div>
               <div className="flex items-center justify-between mb-1.5">
                 <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 uppercase tracking-wider">
                   <MessageSquare className="w-3.5 h-3.5" /> Mentor Comments
                 </label>
                 {(() => {
                   const wc = countWords(evalForm.mentor_comments);
                   const isOptimal = wc >= 25 && wc <= 65;
                   return (
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                       isOptimal 
                         ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                         : wc > 0 
                         ? 'bg-blue-50 text-blue-700 border border-blue-200'
                         : 'text-foreground/40'
                     }`}>
                       {wc} words {isOptimal ? '✓ Studio Critique' : '(Guideline: 30–55 words)'}
                     </span>
                   );
                 })()}
               </div>
               <textarea 
                 aria-label="Mentor Comments"
                 value={evalForm.mentor_comments}
                 onChange={e => setEvalForm({ ...evalForm, mentor_comments: e.target.value })}
                 className="w-full h-24 border border-black/10 rounded-xl p-3 bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                 placeholder="Provide feedback on what the candidate did well and what went wrong..."
               />
             </div>

             {/* Improvements */}
             <div>
               <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 mb-1.5 uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Areas for Improvement</label>
               <textarea 
                 aria-label="Areas for Improvement"
                 value={evalForm.mentor_improvements}
                 onChange={e => setEvalForm({ ...evalForm, mentor_improvements: e.target.value })}
                 className="w-full h-20 border border-black/10 rounded-xl p-3 bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                 placeholder="Specific tips on how to improve..."
               />
             </div>

             {/* Loom Link */}
             <div>
               <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 mb-1.5 uppercase tracking-wider"><Video className="w-3.5 h-3.5" /> Loom Video Link (Optional)</label>
               <input 
                 type="url"
                 aria-label="Loom Video Link"
                 value={evalForm.mentor_loom_link}
                 onChange={e => setEvalForm({ ...evalForm, mentor_loom_link: e.target.value })}
                 className="w-full h-10 border border-black/10 rounded-xl px-3 bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                 placeholder="https://www.loom.com/share/..."
               />
             </div>
           </div>
           
           {/* Navigation Bottom */}
           <div className="border-t border-black/10 pt-4 mt-5 flex justify-between items-center shrink-0">
             <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQIndex === 0} className="shadow-sm font-bold h-10 px-4">
               <ArrowLeft className="w-4 h-4 mr-2" /> Previous
             </Button>
             <Button onClick={handleNextQuestion} disabled={currentQIndex === responses.length - 1} className="bg-black text-white hover:bg-black/80 shadow-sm font-bold h-10 px-6">
               Save & Next <ChevronRight className="w-4 h-4 ml-2" />
             </Button>
           </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#262626]">Complete Evaluation?</DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium pt-2">
              You are about to finalize the evaluation for {evaluatingAttempt.exam_candidates.name}. An email will be dispatched to notify them of their score.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl my-4 text-center">
            <p className="text-sm font-bold text-green-800 uppercase tracking-widest mb-2">Final Part B Score</p>
            <p className="text-5xl font-black text-green-600">{currentSum.toFixed(2)}</p>
            <p className="text-xs font-bold text-green-700/60 mt-2">Total marks awarded across {responses.length} questions</p>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="w-full font-bold">
              Cancel
            </Button>
            <Button onClick={submitCompleteEvaluation} disabled={saving} className="w-full font-bold bg-green-600 text-white hover:bg-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Complete Evaluation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Preview */}
      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-[96vw] max-h-[96vh] w-[96vw] h-[96vh] p-0 overflow-hidden bg-black/95 border-none flex flex-col items-center justify-center">
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <a
              href={fullscreenImage || ''}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open Tab
            </a>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setFullscreenImage(null)} 
              className="text-white hover:bg-white/20 h-9 w-9 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
            <img 
              src={fullscreenImage || ''} 
              alt="Candidate sketch fullscreen" 
              className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl select-none" 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Settings Modal */}
      <Dialog open={showAiSettingsModal} onOpenChange={setShowAiSettingsModal}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Key className="w-5 h-5 text-purple-600" />
              AI Evaluator Settings
            </DialogTitle>
            <DialogDescription>
              Choose your AI provider and configure secret API keys for subjective design evaluation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-foreground/70 uppercase mb-2">Active AI Provider</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { 
                    setActiveAiProvider("openai"); 
                    setTestAiResult(null); 
                    try { localStorage.setItem("df_ai_provider", "openai"); } catch (e) {}
                  }}
                  className={`p-3 rounded-xl border text-left font-bold text-xs transition-all ${
                    activeAiProvider === "openai" 
                      ? "border-purple-600 bg-purple-50/60 text-purple-950 shadow-xs ring-1 ring-purple-600" 
                      : "border-black/10 hover:border-black/20 text-foreground/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>OpenAI (ChatGPT)</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-semibold">Recommended</span>
                  </div>
                  <p className="text-[11px] font-normal text-foreground/60">GPT-4o-mini & GPT-4o Vision. No 20/day cap.</p>
                </button>

                <button
                  type="button"
                  onClick={() => { 
                    setActiveAiProvider("gemini"); 
                    setTestAiResult(null); 
                    try { localStorage.setItem("df_ai_provider", "gemini"); } catch (e) {}
                  }}
                  className={`p-3 rounded-xl border text-left font-bold text-xs transition-all ${
                    activeAiProvider === "gemini" 
                      ? "border-purple-600 bg-purple-50/60 text-purple-950 shadow-xs ring-1 ring-purple-600" 
                      : "border-black/10 hover:border-black/20 text-foreground/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>Google Gemini</span>
                  </div>
                  <p className="text-[11px] font-normal text-foreground/60">Gemini Flash Multimodal via AI Studio.</p>
                </button>
              </div>
            </div>

            {activeAiProvider === "openai" ? (
              <div className="space-y-3 bg-black/5 p-4 rounded-xl border border-black/5">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">OpenAI API Key (sk-...)</label>
                  <input
                    type="password"
                    value={configOpenaiKey}
                    onChange={(e) => setConfigOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-foreground/50 mt-1">
                    From <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-purple-600 underline">platform.openai.com/api-keys</a>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Model</label>
                  <select
                    value={configOpenaiModel}
                    onChange={(e) => setConfigOpenaiModel(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Fastest, High Vision Quality, ~$0.001/eval)</option>
                    <option value="gpt-4o">gpt-4o (Elite Reasoning & Highest Detail Vision)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-black/5 p-4 rounded-xl border border-black/5">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Gemini API Key</label>
                  <input
                    type="password"
                    value={configGeminiKey}
                    onChange={(e) => setConfigGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Gemini Model</label>
                  <select
                    value={configGeminiModel}
                    onChange={(e) => setConfigGeminiModel(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="gemini-flash-latest">gemini-flash-latest (Recommended)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  </select>
                </div>
              </div>
            )}

            {testAiResult && (
              <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                testAiResult.startsWith("✅") 
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200" 
                  : testAiResult.startsWith("⚠️")
                  ? "bg-amber-50 text-amber-900 border border-amber-200 font-medium"
                  : "bg-red-50 text-red-900 border border-red-200"
              }`}>
                {testAiResult}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testingAiKey}
              onClick={handleTestAiKey}
              className="text-xs font-semibold"
            >
              {testingAiKey ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Test Connection
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingAiSettings}
              onClick={handleSaveAiSettings}
              className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
            >
              {savingAiSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch AI Evaluation Progress Modal */}
      <Dialog open={showBatchModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md rounded-2xl p-6" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
              Evaluating Part B with {activeAiProvider === 'openai' ? `OpenAI (${configOpenaiModel})` : 'Google Gemini'}
            </DialogTitle>
            <DialogDescription>
              Evaluating candidate responses against the 5 design rubrics and drafting 20–25 word reviews...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="w-full bg-black/5 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-purple-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-foreground/60 font-semibold">
              <span>{batchProgress.currentQuestion || 'Processing...'}</span>
              <span>{batchProgress.current} / {batchProgress.total}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Proxy Submission Modal (Create On Behalf Of Student) */}
      <Dialog open={showProxyModal} onOpenChange={setShowProxyModal}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-xl font-bold text-[#262626] flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>Submit on Behalf of Student</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/60">
              Create an exam submission for a student who could not complete their upload due to connectivity or technical issues.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Step 1: Candidate Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">
                  1. Select Student
                </label>
                {proxySelectedCandidate && (
                  <span className="text-[11px] font-medium text-emerald-600">Student selected</span>
                )}
              </div>

              {/* Filter Tabs: Focus Batch (default) / Material / Generic / All */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/5 rounded-xl border border-black/5 w-fit mb-3">
                <button
                  type="button"
                  onClick={() => setProxyCandidateFilter('focus_batch')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    proxyCandidateFilter === 'focus_batch'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-foreground/70 hover:text-foreground hover:bg-black/5'
                  }`}
                >
                  Focus Batch
                </button>
                <button
                  type="button"
                  onClick={() => setProxyCandidateFilter('materials_only')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    proxyCandidateFilter === 'materials_only'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-foreground/70 hover:text-foreground hover:bg-black/5'
                  }`}
                >
                  Material
                </button>
                <button
                  type="button"
                  onClick={() => setProxyCandidateFilter('generic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    proxyCandidateFilter === 'generic'
                      ? 'bg-zinc-800 text-white shadow-xs font-bold'
                      : 'text-foreground/70 hover:text-foreground hover:bg-black/5'
                  }`}
                >
                  Generic
                </button>
                <button
                  type="button"
                  onClick={() => setProxyCandidateFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    proxyCandidateFilter === 'all'
                      ? 'bg-zinc-800 text-white shadow-xs font-bold'
                      : 'text-foreground/70 hover:text-foreground hover:bg-black/5'
                  }`}
                >
                  All Students
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search student by name, email, or DF ID…"
                  value={proxyCandidateSearch}
                  onChange={(e) => setProxyCandidateSearch(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {proxySelectedCandidate ? (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                        {proxySelectedCandidate.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
                          <span>{proxySelectedCandidate.name}</span>
                          {(proxySelectedCandidate.access_level === 'focus_batch' || proxySelectedCandidate.has_focus_mocks_access) && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                              Focus Batch
                            </span>
                          )}
                          {proxySelectedCandidate.access_level === 'materials_only' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Material
                            </span>
                          )}
                          {proxySelectedCandidate.education_level && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 text-foreground/60">
                              {proxySelectedCandidate.education_level === 'bachelors' ? 'B.Des' : proxySelectedCandidate.education_level === 'masters' ? 'M.Des' : proxySelectedCandidate.education_level}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-foreground/50">{proxySelectedCandidate.email} • {proxySelectedCandidate.unique_id}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProxySelectedCandidate(null)}
                      className="text-xs h-7 text-foreground/50 hover:text-red-600"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-black/10 rounded-xl divide-y divide-black/5 bg-white">
                    {proxyCandidates.length === 0 ? (
                      <div className="p-4 text-center text-xs text-foreground/40">
                        No students found in {proxyCandidateFilter.replace('_', ' ')}
                      </div>
                    ) : (
                      proxyCandidates.map((cand: any) => {
                        const isFocus = cand.access_level === 'focus_batch' || cand.has_focus_mocks_access;
                        const isMaterial = cand.access_level === 'materials_only';
                        return (
                          <div
                            key={cand.id}
                            onClick={() => setProxySelectedCandidate(cand)}
                            className="p-2.5 hover:bg-black/5 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="text-xs font-semibold text-[#262626] flex items-center gap-1.5">
                                <span>{cand.name}</span>
                                {isFocus && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-800 border border-green-200">
                                    Focus
                                  </span>
                                )}
                                {isMaterial && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    Material
                                  </span>
                                )}
                                {!isFocus && !isMaterial && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/5 text-foreground/60">
                                    Generic
                                  </span>
                                )}
                                {cand.education_level && (
                                  <span className="text-[10px] text-foreground/40">
                                    ({cand.education_level === 'bachelors' ? 'B.Des' : cand.education_level === 'masters' ? 'M.Des' : cand.education_level})
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-foreground/50">{cand.email} • {cand.unique_id}</div>
                            </div>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">Select</Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Test Selection */}
            <div>
              <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                2. Select Exam Test
              </label>
              <select
                value={proxySelectedTestId}
                onChange={(e) => handleSelectProxyTest(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{isLoadingProxyTests ? "Loading tests..." : "-- Choose Test --"}</option>
                {proxyTests.map((t: any) => {
                  const isFocus = t.is_focus_batch;
                  const prog = t.exam_programs?.name || (t.program_format === 'bachelors' ? 'B.Des' : t.program_format === 'masters' ? 'M.Des' : 'All');
                  return (
                    <option key={t.id} value={t.id}>
                      {t.title} • {isFocus ? 'Focus Batch' : 'Generic'} ({prog})
                    </option>
                  );
                })}
              </select>
              {proxyLoadingQuestions && (
                <div className="flex items-center gap-2 mt-2 text-xs text-foreground/60">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Loading questions for selected exam...</span>
                </div>
              )}
            </div>

            {/* Step 3: Question-wise Solutions */}
            {proxySelectedTestId && (
              <div className="space-y-4 pt-2">
                <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">
                  3. Upload Solutions Question-Wise ({proxyTestQuestions.length} Questions)
                </label>

                {proxyTestQuestions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/5 text-center text-xs text-foreground/50">
                    {proxyLoadingQuestions ? "Loading questions..." : "This test has no Part B questions configured."}
                  </div>
                ) : (
                  proxyTestQuestions.map((q, idx) => {
                    const resp = proxyResponses[q.id] || { fileUrls: [], answerText: '' };
                    return (
                      <div key={q.id} className="p-4 rounded-xl border border-black/10 bg-black/[0.01] space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#262626]">
                              Question {idx + 1} {q.pyq_tag ? `(${q.pyq_tag})` : ''}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {q.marks || 10} Marks
                            </span>
                          </div>
                          {q.content_text && (
                            <div className="text-xs text-foreground/80 bg-black/[0.03] p-3 rounded-lg border border-black/5 whitespace-pre-line leading-relaxed font-normal">
                              {cleanPlainText(q.content_text)}
                            </div>
                          )}
                        </div>

                        {/* Sketches Uploaded */}
                        <div>
                          <label className="block text-[11px] font-semibold text-foreground/60 mb-1.5">
                            Sketches / Photos ({resp.fileUrls.length} attached)
                          </label>

                          {resp.fileUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {resp.fileUrls.map((url, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-black/10">
                                  <img src={url} alt="Thumbnail" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = resp.fileUrls.filter((_, idx2) => idx2 !== i);
                                      setProxyResponses(p => ({
                                        ...p,
                                        [q.id]: { ...p[q.id], fileUrls: updated }
                                      }));
                                    }}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 bg-white hover:bg-black/5 text-xs font-semibold">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              disabled={proxyUploadingQId === q.id}
                              onChange={(e) => handleProxyFileUpload(e.target.files, q.id)}
                            />
                            {proxyUploadingQId === q.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5 text-primary" />
                            )}
                            <span>{proxyUploadingQId === q.id ? 'Compressing & uploading...' : 'Attach Image Files'}</span>
                          </label>
                        </div>

                        {/* Concept notes */}
                        <div>
                          <label className="block text-[11px] font-semibold text-foreground/60 mb-1">
                            Student Notes / Concept Text
                          </label>
                          <textarea
                            rows={2}
                            value={resp.answerText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProxyResponses(p => ({
                                ...p,
                                [q.id]: { ...p[q.id], answerText: val }
                              }));
                            }}
                            placeholder="Type student's written response or problem statement notes..."
                            className="w-full text-xs p-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:ring-1 focus:ring-primary/20 resize-y"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProxyModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submittingProxy || !proxySelectedCandidate || !proxySelectedTestId}
              onClick={handleSubmitProxy}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1.5"
            >
              {submittingProxy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
              <span>Create Submission Entry</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
