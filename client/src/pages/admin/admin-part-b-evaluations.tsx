import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, ArrowLeft, PenTool, CheckCircle2, ChevronRight, ChevronLeft, 
  MessageSquare, Video, FileText, Maximize, X, Shield,
  ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink, AlertCircle, Download,
  UploadCloud, Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { sanitizeHtml } from "@/lib/sanitize";

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
          exam_tests(title, program_format, exam_programs(name))
        `, { count: 'exact' })
        .gt('part_b_answered', 0)
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

  // Zoom, rotation, and progressive image loading states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [resolvedUrlOverride, setResolvedUrlOverride] = useState<string | null>(null);
  const [retryingSignedUrl, setRetryingSignedUrl] = useState(false);
  const [adminUploading, setAdminUploading] = useState(false);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setImageLoading(true);
    setImageError(false);
    setResolvedUrlOverride(null);
  }, [currentQIndex, selectedFileIndex, evaluatingAttempt?.id]);

  const handleAdminManualUpload = async (file: File) => {
    if (!evaluatingAttempt) return;
    const currentResp = responses[currentQIndex];
    if (!currentResp) return;

    setAdminUploading(true);
    try {
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

      // Clean existing filenames from array if any, keeping valid URLs
      const currentUrls = parseFileUrls(currentResp.file_url);
      const validUrls = currentUrls.filter(u => !normalizeSubmissionUrl(u).isFilenameOnly);
      const newUrls = [...validUrls, publicUrl];

      const { error: dbError } = await supabase
        .from('exam_responses')
        .update({ file_url: JSON.stringify(newUrls) })
        .eq('id', currentResp.id);

      if (dbError) throw dbError;

      // Update in-memory responses state
      const updated = [...responses];
      updated[currentQIndex] = { ...currentResp, file_url: JSON.stringify(newUrls) };
      setResponses(updated);
      setSelectedFileIndex(newUrls.length - 1);
      setResolvedUrlOverride(publicUrl);
      setImageError(false);
      setImageLoading(false);

      toast({ title: "Image Attached!", description: "Candidate submission sketch updated and saved." });
    } catch (err: any) {
      console.error("Admin upload failed:", err);
      toast({ title: "Upload Failed", description: err.message || "Could not attach image", variant: "destructive" });
    } finally {
      setAdminUploading(false);
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
      // Get all Part B questions for this test
      const { data: tqData } = await supabase.from('exam_test_questions').select('question_id').eq('test_id', attempt.test_id);
      const questionIds = tqData?.map(t => t.question_id) || [];
      
      const { data: qData } = await supabase.from('exam_questions').select('*').in('id', questionIds).eq('part', 'B');
      const partBQs = qData || [];
      
      // Sort questions so it's consistent
      partBQs.sort((a, b) => a.id.localeCompare(b.id));
      setQuestions(partBQs);
      
      // Get responses
      const { data: rData } = await supabase.from('exam_responses').select('*').eq('attempt_id', attempt.id).in('question_id', partBQs.map(q => q.id));
      
      // We only care about questions they actually answered
      const answeredResponses = (rData || []).filter(r => r.fileUrl !== null || r.answer_text !== null || r.file_url !== null);
      
      // Map to state
      setResponses(answeredResponses);
      setCurrentQIndex(0);
      
      if (answeredResponses.length > 0) {
        populateForm(answeredResponses[0]);
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
    
    // Update local state
    const updatedResponses = [...responses];
    updatedResponses[currentQIndex] = {
      ...currentResponse,
      marks_awarded: evalForm.marks_awarded !== "" ? parseFloat(evalForm.marks_awarded) : null,
      rubric_marks: evalForm.rubric_marks,
      mentor_comments: evalForm.mentor_comments,
      mentor_improvements: evalForm.mentor_improvements,
      mentor_loom_link: evalForm.mentor_loom_link
    };
    setResponses(updatedResponses);
    
    // Save to DB
    try {
      await supabase.from('exam_responses').update({
        marks_awarded: evalForm.marks_awarded !== "" ? parseFloat(evalForm.marks_awarded) : null,
        rubric_marks: evalForm.rubric_marks,
        mentor_comments: evalForm.mentor_comments || null,
        mentor_improvements: evalForm.mentor_improvements || null,
        mentor_loom_link: evalForm.mentor_loom_link || null
      }).eq('id', currentResponse.id);
      
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
      // Calculate total score
      let scorePartB = 0;
      responses.forEach(r => {
        if (r.marks_awarded) scorePartB += parseFloat(r.marks_awarded);
      });
      // Add the currently viewed one just in case state isn't synced yet
      if (evalForm.marks_awarded !== "" && !isNaN(parseFloat(evalForm.marks_awarded))) {
         // Replace the currently viewed one in the sum calculation
         const currentRespId = responses[currentQIndex].id;
         scorePartB = 0;
         responses.forEach(r => {
            if (r.id === currentRespId) scorePartB += parseFloat(evalForm.marks_awarded);
            else if (r.marks_awarded) scorePartB += parseFloat(r.marks_awarded);
         });
      }
      
      const totalScore = (evaluatingAttempt.score_part_a || 0) + scorePartB;
      
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

  if (isLoadingAttempts && !evaluatingAttempt) {
    return <div className="flex items-center justify-center py-20 text-foreground/40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // -------------------------------------------------------------
  // LIST VIEW
  // -------------------------------------------------------------
  if (!evaluatingAttempt) {
    // Data is already filtered server-side per activeTab
    const filteredAttempts = attempts;

    return (
      <div className="space-y-8 pb-12 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Part B Evaluations</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Review and grade subjective candidate submissions.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-1 bg-black/5 rounded-xl w-fit">
          <button 
            onClick={() => { setActiveTab('pending'); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pending' ? 'bg-white shadow-sm text-primary' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Pending {activeTab === 'pending' && attemptsData?.total !== undefined && <span className="ml-1 text-xs opacity-60">({attemptsData.total})</span>}
          </button>
          <button 
            onClick={() => { setActiveTab('draft'); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'draft' ? 'bg-white shadow-sm text-orange-600' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Drafts {activeTab === 'draft' && attemptsData?.total !== undefined && <span className="ml-1 text-xs opacity-60">({attemptsData.total})</span>}
          </button>
          <button 
            onClick={() => { setActiveTab('completed'); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'completed' ? 'bg-white shadow-sm text-green-600' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Evaluated {activeTab === 'completed' && attemptsData?.total !== undefined && <span className="ml-1 text-xs opacity-60">({attemptsData.total})</span>}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-black/5 overflow-hidden shadow-sm">
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
                  <p className="font-bold text-[#262626] leading-tight">
                    {attempt.exam_candidates?.name}
                    {attempt.exam_candidates?.access_level === 'focus_batch' && (
                      <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 align-middle">
                        <Shield className="w-2.5 h-2.5" /> FB
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-foreground/50 mt-0.5">{attempt.exam_candidates?.unique_id}</p>
                </div>
                <div className="col-span-3 text-foreground/70 font-semibold truncate text-xs" title={attempt.exam_tests?.title}>
                  {attempt.exam_tests?.title}
                </div>
                <div className="col-span-2 text-foreground/60 text-xs font-medium">
                  {new Date(attempt.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="col-span-2 flex flex-wrap gap-1.5 items-center">
                  {attempt.total_part_a > 0 && (
                    <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-200">
                      A: {attempt.score_part_a}/{attempt.total_part_a}
                    </span>
                  )}
                  {attempt.score_part_b !== null && (
                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-200">
                      B: {attempt.score_part_b}
                    </span>
                  )}
                  {attempt.total_score !== null && (
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black border border-primary/20">
                      Total: {attempt.total_score}
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
                    className={`h-7 px-3 font-bold text-xs rounded-md ${activeTab === 'completed' ? '' : 'bg-primary text-white hover:bg-primary/90 shadow-sm'}`}
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
            <div className="bg-white p-5 rounded-xl border border-black/5 shadow-sm mb-6">
               <div className="text-sm text-[#262626] leading-relaxed max-w-full overflow-hidden prose prose-sm prose-p:my-1 prose-img:max-h-40 prose-img:w-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml((currentQ.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ')) }}></div>
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
               <div className="text-foreground/40 flex flex-col items-center">
                 <FileText className="w-12 h-12 mb-2 opacity-50" />
                 <p className="font-medium text-lg">No file uploaded for this question.</p>
               </div>
             )}
          </div>
        </div>

        {/* Right Side: Evaluation Form */}
        <div className="w-[30%] bg-white flex flex-col overflow-y-auto custom-scrollbar p-6 lg:p-8">
           <h3 className="text-lg font-bold text-[#262626] mb-5 flex items-center gap-2"><PenTool className="w-5 h-5 text-primary" /> Evaluation Form</h3>
           
           <div className="space-y-5 flex-1">
             {/* Marks Input via Rubric */}
             <div>
               <div className="flex items-center justify-between mb-3">
                 <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">Rubric Evaluation</label>
                 <div className="text-right">
                   <span className="text-lg font-black text-primary">{evalForm.marks_awarded || '0'}</span>
                   <span className="text-xs font-bold text-foreground/40 ml-1">/ {Number.isInteger(maxMarksPerQ) ? maxMarksPerQ : maxMarksPerQ.toFixed(2)}</span>
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
                         aria-label={`Score for ${criteria.label}`}
                         value={(evalForm.rubric_marks as any)[criteria.key]}
                         onChange={e => {
                           const maxPerCriteria = maxMarksPerQ / 5;
                           let val = e.target.value;
                           if (parseFloat(val) > maxPerCriteria) val = maxPerCriteria.toString();
                           
                           const newRubric = { ...evalForm.rubric_marks, [criteria.key]: val };
                           
                           // Calculate total
                           let sum = 0;
                           Object.values(newRubric).forEach(v => {
                             if (v !== "" && !isNaN(parseFloat(v as string))) sum += parseFloat(v as string);
                           });
                           
                           setEvalForm({ ...evalForm, rubric_marks: newRubric, marks_awarded: sum.toString() });
                         }}
                         className="w-full h-9 border-2 border-primary/10 rounded-lg px-2 text-sm font-bold bg-primary/5 focus:outline-none focus:border-primary text-primary text-left [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                         placeholder="0"
                       />
                       <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30 pointer-events-none">/ {(maxMarksPerQ / 5).toFixed(1).replace(/\.0$/, '')}</div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Comments */}
             <div>
               <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 mb-1.5 uppercase tracking-wider"><MessageSquare className="w-3.5 h-3.5" /> Mentor Comments</label>
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
    </div>
  );
}
