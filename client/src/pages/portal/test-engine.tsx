import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface EngineState {
  test: any;
  sections: any[];
  questions: any[];
  options: Record<string, any[]>;
}

export default function PortalTestEngine({ params }: { params?: { id: string } }) {
  const { id: paramId } = useParams();
  const id = params?.id || paramId;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [engineData, setEngineData] = useState<EngineState | null>(null);
  
  // Navigation State
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    if (id) fetchTestEngineData();
    else {
      toast({ title: "Error", description: "No Test ID provided in URL", variant: "destructive" });
      setLocation('/portal/dashboard');
    }
  }, [id]);

  const fetchTestEngineData = async () => {
    setLoading(true);
    try {
      if (!id) throw new Error("Invalid Test ID");
      // 1. Fetch Test Details
      const { data: testData, error: testErr } = await supabase.from('exam_tests').select('*, exam_programs(name)').eq('id', id).single();
      if (testErr) throw new Error(`DB Error: ${testErr.message}`);
      if (!testData) throw new Error(`Test not found in DB for ID: ${id}`);

      // 2. Fetch Sections
      const { data: sectionsData } = await supabase.from('exam_test_sections').select('*').eq('test_id', id);

      // 3. Fetch Question Links
      const { data: tqData } = await supabase.from('exam_test_questions').select('question_id').eq('test_id', id);
      const questionIds = tqData?.map((t: any) => t.question_id) || [];

      // 4. Fetch Actual Questions
      let questionsData: any[] = [];
      let optionsMap: Record<string, any[]> = {};

      if (questionIds.length > 0) {
        const { data: qData } = await supabase.from('exam_questions').select('*').in('id', questionIds);
        questionsData = qData || [];

        // Sort questions by part (Part A first, then Part B)
        questionsData.sort((a, b) => a.part.localeCompare(b.part));

        // 5. Fetch Options securely (EXCLUDING is_correct)
        const { data: optData } = await supabase.from('exam_options')
          .select('id, question_id, content_text, media_url')
          .in('question_id', questionIds);

        if (optData) {
          optData.forEach(opt => {
            if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
            optionsMap[opt.question_id].push(opt);
          });
        }
      }

      setEngineData({
        test: testData,
        sections: sectionsData || [],
        questions: questionsData,
        options: optionsMap
      });

    } catch (err: any) {
      toast({ title: "Failed to load test", description: err.message, variant: "destructive" });
      setLocation('/portal/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !engineData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-6" />
        <h2 className="text-xl font-semibold text-[#262626] animate-pulse">Initializing Test Environment...</h2>
        <p className="text-foreground/50 mt-2">Loading secure engine and sectional timers</p>
      </div>
    );
  }

  const currentQ = engineData.questions[activeQuestionIndex];
  const currentOptions = currentQ ? engineData.options[currentQ.id] || [] : [];
  const totalQuestions = engineData.questions.length;
  
  // Calculate total duration
  const totalDuration = engineData.sections.reduce((acc, sec) => acc + sec.duration_minutes, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/portal/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 w-px bg-black/10 mx-2" />
          <h1 className="font-bold text-[#262626]">{engineData.test.title}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col text-right">
             <span className="text-xs text-foreground/50 font-medium">Remaining Time</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold font-mono border border-orange-200">
            <Clock className="w-4 h-4" />
            {/* Placeholder timer for Milestone 1 */}
            {totalDuration}:00:00
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 font-bold">
            Submit Test
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex p-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Side: Question Area */}
        {currentQ ? (
          <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm p-10 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-4">
              <div className="flex gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-bold">Part {currentQ.part}</span>
                <span className="bg-black/5 text-foreground/70 px-3 py-1 rounded text-sm font-bold">{currentQ.type}</span>
                {currentQ.pyq_tag && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm font-bold">{currentQ.pyq_tag}</span>}
              </div>
              <div className="text-sm font-bold text-foreground/50">
                Question {activeQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="text-lg text-[#262626] font-medium whitespace-pre-wrap leading-relaxed mb-8">
                {currentQ.content_text}
              </div>

              {currentQ.media_url && (
                <div className="mb-8 rounded-lg overflow-hidden border border-black/10 inline-block max-w-full">
                  <img src={currentQ.media_url} alt="Question Media" className="max-h-96 object-contain bg-background/50" />
                </div>
              )}

              {/* Options Placeholder for Milestone 1 */}
              <div className="space-y-3 mt-4">
                {currentQ.type === 'NAT' ? (
                  <div className="w-64">
                    <input type="number" placeholder="Enter numerical answer..." className="w-full h-12 border border-black/10 rounded-md px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                ) : currentQ.type === 'SUBJECTIVE' ? (
                  <div className="w-full max-w-2xl h-40 border-2 border-dashed border-black/10 rounded-xl bg-background/50 flex flex-col items-center justify-center text-foreground/50 text-sm">
                    <p className="font-semibold text-foreground/70 mb-1">Upload Sketch</p>
                    <p>Milestone 4: File Uploader goes here</p>
                  </div>
                ) : (
                  currentOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-4 p-4 border border-black/10 rounded-xl cursor-pointer hover:bg-background/50 transition-colors">
                      <div className="w-6 h-6 rounded-full border border-black/20 flex items-center justify-center text-xs font-bold text-foreground/50">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm font-medium">{opt.content_text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="mt-8 pt-6 border-t border-black/5 flex justify-between items-center">
              <Button variant="outline" onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))} disabled={activeQuestionIndex === 0}>
                Previous Question
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                  Mark for Review
                </Button>
                <Button onClick={() => setActiveQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))} disabled={activeQuestionIndex === totalQuestions - 1} className="bg-primary text-white hover:bg-primary/90 px-8">
                  Save & Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm p-10 flex flex-col items-center justify-center">
             <AlertCircle className="w-12 h-12 text-foreground/30 mb-4" />
             <p className="text-foreground/50 font-medium">No questions found for this test.</p>
          </div>
        )}

        {/* Right Side: Navigation Palette */}
        <div className="w-80 bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-[#262626] mb-4">Question Palette</h3>
          
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-3 mb-6">
              {engineData.questions.map((q, idx) => {
                let stateClass = "bg-white border-black/10 text-foreground/70 hover:bg-black/5"; // Unseen
                
                if (idx === activeQuestionIndex) {
                  stateClass = "bg-primary text-white font-bold ring-2 ring-primary/30 ring-offset-2 border-primary"; // Active
                }
                
                return (
                  <button 
                    key={q.id} 
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`h-12 rounded-lg border flex items-center justify-center text-sm transition-all ${stateClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-auto space-y-3 pt-6 border-t border-black/5 shrink-0">
            <div className="flex items-center gap-3 text-xs text-foreground/70"><div className="w-3 h-3 rounded bg-green-100 border border-green-200" /> Answered</div>
            <div className="flex items-center gap-3 text-xs text-foreground/70"><div className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Skipped</div>
            <div className="flex items-center gap-3 text-xs text-foreground/70"><div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" /> Marked for Review</div>
            <div className="flex items-center gap-3 text-xs text-foreground/70"><div className="w-3 h-3 rounded border border-black/10 bg-white" /> Not Visited</div>
          </div>
        </div>
      </div>
    </div>
  );
}
