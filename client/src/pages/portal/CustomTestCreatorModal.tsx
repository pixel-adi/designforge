import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Zap, Clock, BookOpen, PenTool, Sparkles, AlertCircle, CheckCircle2, 
  Loader2, Filter, Layers, BrainCircuit, Shuffle, Compass
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomTestCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  activeTestCount: number;
  onTestCreated: (testId: string) => void;
}

const CATEGORIES = [
  {
    id: "gk_spree",
    name: "GK Spree & Design Awareness",
    icon: BrainCircuit,
    description: "Design History, Architecture, Visual Culture, Typography & Current Awareness",
    defaultPart: "A",
    defaultTypes: ["MCQ", "MSQ"],
    color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-700"
  },
  {
    id: "part_a_drill",
    name: "Part A Speed Drill",
    icon: Zap,
    description: "High-intensity NAT, MSQ & MCQ analytical problem solving and spatial logic",
    defaultPart: "A",
    defaultTypes: ["NAT", "MSQ", "MCQ"],
    color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-700"
  },
  {
    id: "part_b_studio",
    name: "Part B Creative Studio",
    icon: PenTool,
    description: "Creative problem solving, product sketching & visual storytelling with AI review",
    defaultPart: "B",
    defaultTypes: ["SUBJECTIVE"],
    color: "from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-700"
  },
  {
    id: "custom_mixed",
    name: "Custom Mixed Drill",
    icon: Layers,
    description: "Fully customizable mixed test with your choice of topics and question types",
    defaultPart: "both",
    defaultTypes: ["NAT", "MSQ", "MCQ", "SUBJECTIVE"],
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-700"
  }
];

export default function CustomTestCreatorModal({
  isOpen,
  onClose,
  candidate,
  activeTestCount,
  onTestCreated
}: CustomTestCreatorModalProps) {
  const { toast } = useToast();

  const isFocusBatch = candidate?.access_level === 'focus_batch';
  const MAX_GENERIC_TESTS = 10;
  const isLimitReached = !isFocusBatch && activeTestCount >= MAX_GENERIC_TESTS;

  const [selectedCategory, setSelectedCategory] = useState("gk_spree");
  const [testTitle, setTestTitle] = useState("");
  const [examFocus, setExamFocus] = useState<string>("ALL");
  const [difficulty, setDifficulty] = useState<string>("ALL");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [topicFilter, setTopicFilter] = useState<string>("");

  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [creating, setCreating] = useState(false);

  // Auto-generate title when category changes
  useEffect(() => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    setTestTitle(`Custom ${cat?.name || "Drill"} - ${dateStr}`);
  }, [selectedCategory]);

  // Query matching question availability count
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchCount = async () => {
      setCounting(true);
      try {
        const cat = CATEGORIES.find(c => c.id === selectedCategory);
        let query = supabase.from("exam_questions").select("id", { count: "exact", head: true });

        if (cat?.defaultPart === "A") query = query.eq("part", "A");
        else if (cat?.defaultPart === "B") query = query.eq("part", "B");

        if (cat?.defaultTypes && cat.defaultTypes.length > 0) {
          query = query.in("type", cat.defaultTypes);
        }

        if (difficulty !== "ALL") {
          query = query.eq("difficulty", difficulty);
        }

        if (examFocus !== "ALL") {
          query = query.ilike("pyq_tag", `%${examFocus}%`);
        }

        if (topicFilter.trim()) {
          query = query.contains("topics", [topicFilter.trim()]);
        }

        const { count, error } = await query;
        if (isMounted) {
          if (!error && count !== null) {
            setAvailableCount(count);
          } else {
            setAvailableCount(50); // Fallback estimate
          }
        }
      } catch (err) {
        if (isMounted) setAvailableCount(50);
      } finally {
        if (isMounted) setCounting(false);
      }
    };

    fetchCount();
    return () => { isMounted = false; };
  }, [isOpen, selectedCategory, examFocus, difficulty, topicFilter]);

  const handleCreateTest = async () => {
    if (isLimitReached) {
      toast({
        title: "Test Quota Reached",
        description: `Generic tier accounts are limited to ${MAX_GENERIC_TESTS} active practice tests. Please delete an older test to continue.`,
        variant: "destructive"
      });
      return;
    }

    if (!candidate?.id) {
      toast({ title: "Authentication Error", description: "Candidate profile not loaded.", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const cat = CATEGORIES.find(c => c.id === selectedCategory);

      // 1. Fetch matching question IDs
      let qQuery = supabase.from("exam_questions").select("id, marks, part, type");

      if (cat?.defaultPart === "A") qQuery = qQuery.eq("part", "A");
      else if (cat?.defaultPart === "B") qQuery = qQuery.eq("part", "B");

      if (cat?.defaultTypes && cat.defaultTypes.length > 0) {
        qQuery = qQuery.in("type", cat.defaultTypes);
      }

      if (difficulty !== "ALL") {
        qQuery = qQuery.eq("difficulty", difficulty);
      }

      if (examFocus !== "ALL") {
        qQuery = qQuery.ilike("pyq_tag", `%${examFocus}%`);
      }

      const { data: qData, error: qErr } = await qQuery.limit(Math.max(100, questionCount * 3));
      if (qErr) throw qErr;

      let pickedQs = qData || [];
      if (pickedQs.length === 0) {
        // Fallback: pick any available questions
        const { data: fallbackData } = await supabase.from("exam_questions").select("id, marks, part, type").limit(questionCount);
        pickedQs = fallbackData || [];
      }

      // Shuffle and slice to desired count
      const shuffled = [...pickedQs].sort(() => Math.random() - 0.5).slice(0, questionCount);
      const questionIds = shuffled.map(q => q.id);
      const hasPartB = shuffled.some(q => q.part === "B");

      // 2. Try creating via RPC first for server-side quota verification
      let newTestId: string | null = null;
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc("create_student_custom_test", {
          p_candidate_id: candidate.id,
          p_title: testTitle || "Custom Practice Test",
          p_practice_category: selectedCategory,
          p_duration_minutes: durationMinutes,
          p_question_ids: questionIds,
          p_has_part_b: hasPartB,
          p_part_b_duration_minutes: Math.max(15, Math.round(durationMinutes * 0.5))
        });

        if (!rpcErr && rpcData?.test_id) {
          newTestId = rpcData.test_id;
        } else if (rpcErr?.message?.includes("TEST_LIMIT_REACHED")) {
          throw new Error(rpcErr.message);
        }
      } catch (rpcEx: any) {
        if (rpcEx.message?.includes("TEST_LIMIT_REACHED")) {
          throw rpcEx;
        }
        console.warn("RPC failed or not deployed yet, falling back to direct table creation:", rpcEx);
      }

      // Fallback: direct table creation if RPC not yet created in PostgreSQL
      if (!newTestId) {
        // Create test
        const { data: newTest, error: testErr } = await supabase
          .from("exam_tests")
          .insert({
            title: testTitle || "Custom Practice Test",
            status: "published",
            category: "custom_practice",
            is_custom_practice: true,
            created_by_candidate_id: candidate.id,
            practice_category: selectedCategory,
            program_format: candidate.education_level || "both"
          })
          .select("id")
          .single();

        if (testErr) throw testErr;
        newTestId = newTest.id;

        // Create sections
        await supabase.from("exam_test_sections").insert([
          { test_id: newTestId, part: "A", duration_minutes: durationMinutes },
          ...(hasPartB ? [{ test_id: newTestId, part: "B", duration_minutes: 30 }] : [])
        ]);

        // Link questions
        if (questionIds.length > 0) {
          const links = shuffled.map(q => ({
            test_id: newTestId,
            question_id: q.id,
            marks: q.marks || (q.part === "B" ? 10 : 1)
          }));
          await supabase.from("exam_test_questions").insert(links);
        }

        // Initialize attempt
        await supabase.from("exam_attempts").insert({
          candidate_id: candidate.id,
          test_id: newTestId,
          attempt_number: 1,
          status: "not_started"
        });
      }

      toast({
        title: "Practice Test Created!",
        description: `Generated "${testTitle}" with ${questionIds.length} questions.`
      });

      if (newTestId) {
        onTestCreated(newTestId);
      }
      onClose();
    } catch (err: any) {
      console.error("Custom test creation error:", err);
      toast({
        title: "Could Not Create Test",
        description: err.message || "Failed to generate test. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-6 rounded-2xl overflow-hidden">
        <DialogHeader className="border-b border-black/5 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold text-[#262626]">
                  Build Custom Practice Test
                </DialogTitle>
                <DialogDescription className="text-xs text-foreground/50">
                  Target your weak areas by generating customized drills from the question bank.
                </DialogDescription>
              </div>
            </div>

            {/* Quota Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isFocusBatch 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : isLimitReached 
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-black/5 text-foreground/70 border-black/10'
            }`}>
              {isFocusBatch 
                ? "🎯 Focus Batch (Unlimited)" 
                : `${activeTestCount} / ${MAX_GENERIC_TESTS} Tests Used`}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-6">
          {/* Limit Reached Warning */}
          {isLimitReached && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Test Limit Reached (10 / 10 Tests)</span>
                Generic tier students can save up to 10 custom practice tests. Please delete completed or older custom tests from your dashboard to create a new one.
              </div>
            </div>
          )}

          {/* Step 1: Select Category Preset */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-foreground/70 uppercase tracking-wider block">
              1. Choose Practice Category
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORIES.map(cat => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                        : 'border-black/10 bg-white hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`p-1.5 rounded-lg border bg-white ${isSelected ? 'text-primary border-primary/20' : 'text-foreground/60 border-black/10'}`}>
                        <IconComponent className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-xs text-[#262626]">{cat.name}</span>
                    </div>
                    <p className="text-[11px] text-foreground/60 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Test Parameters */}
          <div className="space-y-4 p-4 rounded-xl border border-black/10 bg-[#FAFAFA]">
            <Label className="text-xs font-bold text-foreground/70 uppercase tracking-wider block">
              2. Test Configuration
            </Label>

            <div>
              <Label className="text-xs font-semibold text-foreground/70 block mb-1">Test Title</Label>
              <Input
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                placeholder="e.g. Speed Drill - Perspective & NAT"
                className="h-9 text-xs bg-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground/70 block mb-1">Exam Style</Label>
                <select
                  value={examFocus}
                  onChange={e => setExamFocus(e.target.value)}
                  className="w-full h-9 border border-black/10 rounded-lg px-2 text-xs bg-white font-medium"
                >
                  <option value="ALL">All Exams</option>
                  <option value="NID">NID DAT</option>
                  <option value="CEED">CEED</option>
                  <option value="UCEED">UCEED</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground/70 block mb-1">Difficulty</Label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full h-9 border border-black/10 rounded-lg px-2 text-xs bg-white font-medium"
                >
                  <option value="ALL">Mixed Difficulty</option>
                  <option value="Low">Low / Foundation</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High / Advanced</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground/70 block mb-1">Questions</Label>
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(parseInt(e.target.value, 10))}
                  className="w-full h-9 border border-black/10 rounded-lg px-2 text-xs bg-white font-medium"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground/70 block mb-1">Duration</Label>
                <select
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full h-9 border border-black/10 rounded-lg px-2 text-xs bg-white font-medium"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                  <option value={90}>90 Minutes</option>
                </select>
              </div>
            </div>

            {/* Optional Topic Filter */}
            <div>
              <Label className="text-xs font-semibold text-foreground/70 block mb-1">
                Filter Specific Topic (Optional)
              </Label>
              <Input
                placeholder="e.g. Perspective, Color Theory, Typography, Geometry..."
                value={topicFilter}
                onChange={e => setTopicFilter(e.target.value)}
                className="h-9 text-xs bg-white"
              />
            </div>

            {/* Real-time Availability Pill */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 text-foreground/60 font-medium">
              <span>Matching Questions in Repository:</span>
              <span className="font-bold text-primary flex items-center gap-1.5">
                {counting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {availableCount !== null ? `${availableCount} Available` : "Plenty available"}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-black/5 pt-4 shrink-0 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={creating}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={creating || isLimitReached}
            onClick={handleCreateTest}
            className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Test...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate & Start Drill
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
