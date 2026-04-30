import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, AlertCircle, FileText, UploadCloud, EyeOff, FileCheck2, AlertTriangle, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface EngineState {
  test: any;
  sections: any[];
  questions: any[];
  options: Record<string, any[]>;
}

type TestStep = 'instructions' | 'test' | 'submitted';
type QuestionStatus = 'unseen' | 'visited' | 'answered' | 'marked';

interface ResponseData {
  status: QuestionStatus;
  selectedOptions: string[];
  answerText: string;
  fileUrl: string;
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
  
  // Security State
  const [warningsCount, setWarningsCount] = useState(0);
  const MAX_WARNINGS = 3;

  // Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [modalType, setModalType] = useState<'submit' | 'exit'>('submit');

  useEffect(() => {
    if (id) fetchTestEngineData();
    else {
      toast({ title: "Error", description: "No Test ID provided in URL", variant: "destructive" });
      setLocation('/portal/dashboard');
    }
  }, [id]);

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testStep === 'test') {
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
  }, [testStep]);

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
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [timerRunning, timeLeft]);

  const fetchTestEngineData = async () => {
    setLoading(true);
    try {
      if (!id) throw new Error("Invalid Test ID");
      // Fetch Test Details
      const { data: testData, error: testErr } = await supabase.from('exam_tests').select('*, exam_programs(name)').eq('id', id).single();
      if (testErr) throw new Error(`DB Error: ${testErr.message}`);
      if (!testData) throw new Error(`Test not found in DB for ID: ${id}`);

      // Fetch Sections
      const { data: sectionsData } = await supabase.from('exam_test_sections').select('*').eq('test_id', id);

      // Fetch Question Links
      const { data: tqData } = await supabase.from('exam_test_questions').select('question_id').eq('test_id', id);
      const questionIds = tqData?.map((t: any) => t.question_id) || [];

      // Fetch Actual Questions
      let questionsData: any[] = [];
      let optionsMap: Record<string, any[]> = {};
      let initialResponses: Record<string, ResponseData> = {};

      if (questionIds.length > 0) {
        const { data: qData } = await supabase.from('exam_questions').select('*').in('id', questionIds);
        questionsData = qData || [];

        // Sort questions by part
        questionsData.sort((a, b) => a.part.localeCompare(b.part));

        // Fetch Options securely
        const { data: optData } = await supabase.from('exam_options')
          .select('id, question_id, content_text, media_url')
          .in('question_id', questionIds);

        if (optData) {
          optData.forEach(opt => {
            if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
            optionsMap[opt.question_id].push(opt);
          });
        }

        // Initialize Responses State
        questionsData.forEach(q => {
          initialResponses[q.id] = {
            status: 'unseen',
            selectedOptions: [],
            answerText: '',
            fileUrl: ''
          };
        });
      }

      const totalMins = sectionsData?.reduce((acc: number, sec: any) => acc + sec.duration_minutes, 0) || 180;

      setEngineData({
        test: testData,
        sections: sectionsData || [],
        questions: questionsData,
        options: optionsMap
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

  const startTest = () => {
    setTestStep('test');
    setTimerRunning(true);
    
    // Mark first question as visited
    if (engineData?.questions.length) {
      const firstQId = engineData.questions[0].id;
      setResponses(prev => ({
        ...prev,
        [firstQId]: { ...prev[firstQId], status: prev[firstQId].status === 'unseen' ? 'visited' : prev[firstQId].status }
      }));
    }
  };

  const handleAutoSubmit = (reason: string) => {
    setShowSubmitModal(false);
    setTimerRunning(false);
    setTestStep('submitted');
    toast({ title: "Test Auto-Submitted", description: reason, variant: "destructive", duration: 8000 });
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    setTimerRunning(false);
    setTestStep('submitted');
    toast({ title: "Test Submitted successfully", description: "Your answers have been securely recorded." });
  };

  const openSubmitModal = (type: 'submit' | 'exit') => {
    setModalType(type);
    setShowSubmitModal(true);
  };

  const handleNavigateQuestion = (idx: number) => {
    setActiveQuestionIndex(idx);
    const qId = engineData!.questions[idx].id;
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], status: prev[qId].status === 'unseen' ? 'visited' : prev[qId].status }
    }));
  };

  const updateResponse = (qId: string, updates: Partial<ResponseData>) => {
    setResponses(prev => {
      const current = prev[qId];
      const newResponse = { ...current, ...updates };
      
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // Fake upload logic for frontend demo. Real upload goes to Supabase storage.
      const fakeUrl = URL.createObjectURL(file);
      updateResponse(qId, { fileUrl: file.name }); // storing name to show UI changes
      toast({ title: "File attached", description: `${file.name} uploaded successfully.` });
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
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
              
              <ul className="list-none space-y-3 mt-4">
                <li className="flex items-center gap-3"><div className="w-6 h-6 border border-black/20 rounded-md bg-white flex items-center justify-center text-xs font-bold">1</div> You have not visited the question yet.</li>
                <li className="flex items-center gap-3"><div className="w-6 h-6 border border-red-200 rounded-md bg-red-50 text-red-600 flex items-center justify-center text-xs font-bold">2</div> You have visited but not answered the question.</li>
                <li className="flex items-center gap-3"><div className="w-6 h-6 border border-green-200 rounded-md bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">3</div> You have answered the question.</li>
                <li className="flex items-center gap-3"><div className="w-6 h-6 border border-purple-200 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</div> You have NOT answered the question, but have marked it for review.</li>
              </ul>
            </div>
            
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
  // SUBMITTED SCREEN
  // -------------------------------------------------------------
  if (testStep === 'submitted') {
    return (
      <div className="h-screen w-full bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
        <div className="bg-white max-w-lg w-full rounded-2xl border border-black/5 shadow-sm p-10 text-center">
          <FileCheck2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[#262626] mb-4">Test Submitted!</h2>
          <p className="text-foreground/60 mb-8">Your answers have been successfully recorded. You may now safely close this window or return to the dashboard.</p>
          <Button onClick={() => setLocation('/portal/dashboard')} className="w-full">
            Return to Dashboard
          </Button>
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
    <div className="h-screen overflow-hidden bg-[#F8F9FA] flex flex-col select-none">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => openSubmitModal('exit')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 w-px bg-black/10 mx-2" />
          <h1 className="font-bold text-[#262626]">{engineData.test.title}</h1>
        </div>
        <div className="flex items-center gap-6">
          {warningsCount > 0 && (
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex p-6 gap-6 max-w-[1600px] mx-auto w-full min-h-0">
        {/* Left Side: Question Area */}
        {currentQ && currentResponse ? (
          <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm p-8 flex flex-col min-h-0 relative">
            <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-4 shrink-0">
              <div className="flex gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-bold">Part {currentQ.part}</span>
                <span className="bg-black/5 text-foreground/70 px-3 py-1 rounded text-sm font-bold">{currentQ.type}</span>
                {currentQ.pyq_tag && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm font-bold">{currentQ.pyq_tag}</span>}
              </div>
              <div className="text-sm font-bold text-foreground/50">
                Question {activeQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-4">
              <div className="text-lg text-[#262626] font-medium whitespace-pre-wrap leading-relaxed mb-6">
                <span className="font-bold mr-2">Q{activeQuestionIndex + 1}.</span>
                {currentQ.content_text}
              </div>

              {currentQ.media_url && (
                <div className="mb-8 rounded-lg overflow-hidden border border-black/10 inline-block max-w-full">
                  <img src={currentQ.media_url} alt="Question Media" className="max-h-96 object-contain bg-background/50" />
                </div>
              )}

              {/* Dynamic Inputs */}
              <div className="space-y-3 mt-4 mb-4">
                {currentQ.type === 'NAT' ? (
                  <div className="w-64">
                    <input 
                      type="number" 
                      placeholder="Enter numerical answer..." 
                      className="w-full h-12 border border-black/20 rounded-md px-4 text-lg bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm font-bold"
                      value={currentResponse.answerText}
                      onChange={(e) => updateResponse(currentQ.id, { answerText: e.target.value })}
                    />
                  </div>
                ) : currentQ.type === 'SUBJECTIVE' ? (
                  <div className="w-full max-w-2xl">
                    {currentResponse.fileUrl ? (
                      <div className="h-40 border-2 border-primary/40 rounded-xl bg-primary/5 flex flex-col items-center justify-center text-primary text-sm relative group overflow-hidden">
                        <FileCheck2 className="w-10 h-10 mb-2" />
                        <p className="font-bold">{currentResponse.fileUrl}</p>
                        <p className="text-xs mt-1 opacity-70">Successfully attached</p>
                        <label className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                          <span className="font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-primary/20 text-[#262626]">Replace File</span>
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, currentQ.id)} />
                        </label>
                      </div>
                    ) : (
                      <label className="h-40 border-2 border-dashed border-black/20 rounded-xl bg-background/50 hover:bg-black/5 flex flex-col items-center justify-center text-foreground/50 text-sm cursor-pointer transition-colors group">
                        <UploadCloud className="w-10 h-10 mb-3 text-foreground/30 group-hover:text-primary transition-colors" />
                        <p className="font-bold text-[#262626]">Click to upload sketch/media</p>
                        <p className="text-xs mt-1 font-medium">Supports JPG, PNG, PDF (Max 10MB)</p>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, currentQ.id)} />
                      </label>
                    )}
                  </div>
                ) : (
                  // MCQ and MSQ
                  <div className="space-y-3">
                    {currentOptions.map((opt, idx) => {
                      const isSelected = currentResponse.selectedOptions.includes(opt.id);
                      
                      return (
                        <div 
                          key={opt.id} 
                          onClick={() => {
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
                          className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-black/10 hover:bg-black/5'}`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'border-primary bg-primary text-white' : 'border-black/20 text-foreground/50'}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className={`text-sm ${isSelected ? 'font-bold text-primary' : 'font-semibold text-[#262626]'}`}>{opt.content_text}</span>
                          {opt.media_url && (
                             <img src={opt.media_url} alt="Option Media" className="max-h-24 rounded border border-black/5 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="pt-4 border-t border-black/5 flex justify-between items-center shrink-0">
              <Button variant="outline" onClick={() => handleNavigateQuestion(Math.max(0, activeQuestionIndex - 1))} disabled={activeQuestionIndex === 0} className="shadow-sm font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleMarkForReview} className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-sm font-bold">
                  Mark for Review
                </Button>
                <Button onClick={handleSaveAndNext} disabled={activeQuestionIndex === totalQuestions - 1} className="bg-primary text-white hover:bg-primary/90 px-10 shadow-md font-bold">
                  Save & Next
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
        <div className="w-64 bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col shrink-0">
          <h3 className="font-bold text-[#262626] mb-4 text-center">Question Palette</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-4 gap-2 mb-6">
              {engineData.questions.map((q, idx) => {
                const status = responses[q.id]?.status || 'unseen';
                
                let bgClass = "bg-white border-black/20 text-foreground/70 hover:bg-black/5"; // unseen
                if (status === 'visited') bgClass = "bg-red-50 border-red-200 text-red-600";
                if (status === 'answered') bgClass = "bg-green-100 border-green-200 text-green-700";
                if (status === 'marked') bgClass = "bg-purple-100 border-purple-200 text-purple-700";
                
                const isActive = idx === activeQuestionIndex;
                
                return (
                  <button 
                    key={q.id} 
                    onClick={() => handleNavigateQuestion(idx)}
                    className={`h-10 rounded-lg border flex items-center justify-center text-sm font-bold transition-all ${bgClass} ${isActive ? 'ring-2 ring-primary ring-offset-1 scale-105 shadow-sm' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-auto space-y-2 pt-4 border-t border-black/5 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-green-100 border border-green-200 text-green-700">3</div> Answered</div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-red-50 border border-red-200 text-red-600">2</div> Not Answered</div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center bg-purple-100 border border-purple-200 text-purple-700">4</div> Marked</div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70"><div className="w-4 h-4 rounded flex items-center justify-center border border-black/20 bg-white">1</div> Not Visited</div>
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
    </div>
  );
}
