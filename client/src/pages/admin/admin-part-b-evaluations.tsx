import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, PenTool, CheckCircle2, ChevronRight, ChevronLeft, MessageSquare, Video, FileText, Maximize, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const PAGE_SIZE = 100;

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
          exam_candidates(name, unique_id, email),
          exam_tests(title)
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
      return { attempts: data || [], total: count || 0 };
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
                  <p className="font-bold text-[#262626] leading-tight">{attempt.exam_candidates?.name}</p>
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
  const maxMarksPerQ = questions.length > 0 ? (100 / questions.length) : 0;
  
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
               <div className="text-sm text-[#262626] leading-relaxed max-w-full overflow-hidden prose prose-sm prose-p:my-1 prose-img:max-h-40 prose-img:w-auto" dangerouslySetInnerHTML={{ __html: (currentQ.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ') }}></div>
            </div>
          )}
          
          <h3 className="font-bold text-sm text-foreground/50 uppercase tracking-widest mb-4">Candidate Submission</h3>
          <div className="bg-white p-4 rounded-xl border border-black/5 shadow-sm flex-1 flex flex-col items-center justify-center min-h-[400px] overflow-hidden group relative">
             {currentResponse?.file_url ? (
               <>
                 <img src={currentResponse.file_url} className="max-h-[600px] w-auto object-contain rounded-lg border border-black/10 cursor-pointer" alt="Candidate Submission" onClick={() => setFullscreenImage(currentResponse.file_url)} />
                 <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button onClick={() => setFullscreenImage(currentResponse.file_url)} variant="secondary" className="shadow-md bg-white text-black hover:bg-gray-100"><Maximize className="w-4 h-4 mr-2" /> Full Screen</Button>
                 </div>
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
                   <span className="text-xs font-bold text-foreground/40 ml-1">/ {maxMarksPerQ.toFixed(2)}</span>
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
                       <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30 pointer-events-none">/ {(maxMarksPerQ / 5).toFixed(1)}</div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Comments */}
             <div>
               <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 mb-1.5 uppercase tracking-wider"><MessageSquare className="w-3.5 h-3.5" /> Mentor Comments</label>
               <textarea 
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none flex items-center justify-center">
          <Button variant="ghost" size="icon" onClick={() => setFullscreenImage(null)} className="absolute top-4 right-4 text-white hover:bg-white/20 z-50">
            <X className="w-6 h-6" />
          </Button>
          <img src={fullscreenImage || ''} className="max-w-full max-h-[90vh] object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
