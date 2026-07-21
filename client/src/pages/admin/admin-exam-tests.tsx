import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, PlusCircle, CheckCircle2, Search, ArrowLeft, Loader2, FileText, Clock, Trash2, Filter, Settings, Wand2, RefreshCw, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TEMPLATES = [
  {
    id: "NID Bdes",
    name: "NID B.Des",
    description: "Duration: 180 Min",
    programFormat: "bachelors",
    sections: [{ part: "B", duration: 180, requirements: { SUBJECTIVE: 6 } }]
  },
  {
    id: "NID Mdes",
    name: "NID M.Des",
    description: "Duration: 180 Min",
    programFormat: "masters",
    sections: [{ part: "B", duration: 180, requirements: { SUBJECTIVE: 6 } }]
  },
  {
    id: "CEED",
    name: "CEED",
    description: "Duration: 180 Min",
    programFormat: "masters",
    sections: [
      { part: "A", duration: 60, requirements: { NAT: 8, MSQ: 10, MCQ: 26 } },
      { part: "B", duration: 120, requirements: { SUBJECTIVE: 5 } }
    ]
  },
  {
    id: "UCEED",
    name: "UCEED",
    description: "Duration: 180 Min",
    programFormat: "bachelors",
    sections: [
      { part: "A", duration: 120, requirements: { NAT: 14, MSQ: 15, MCQ: 28 } },
      { part: "B", duration: 60, requirements: { SUBJECTIVE: 2 } }
    ]
  }
];

export default function AdminExamTests() {
  const { toast } = useToast();

  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // App Flow State
  const [currentStep, setCurrentStep] = useState<'LIST' | 'BUILDER' | 'PREVIEW'>('LIST');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [testTitle, setTestTitle] = useState("");
  const [programFormat, setProgramFormat] = useState("bachelors");
  const [expiresAt, setExpiresAt] = useState("");
  const [testSections, setTestSections] = useState<any[]>([]); // cloned from template so duration can be edited
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  // Quick Gen Modal
  const [quickGenOpen, setQuickGenOpen] = useState(false);
  const [quickGenDiff, setQuickGenDiff] = useState("Medium");

  // Question Picker Modal (Used for Adding & Replacing)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSection, setPickerSection] = useState<any>(null);
  const [questionsBank, setQuestionsBank] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerTypeFilter, setPickerTypeFilter] = useState<string>("ALL");
  const [autoDifficulty, setAutoDifficulty] = useState<string>("ALL");

  // Replacement specific
  const [replacingQuestionId, setReplacingQuestionId] = useState<string | null>(null);

  // Preview State
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (currentStep === 'LIST') fetchTests();
  }, [currentStep]);

  const fetchTests = async () => {
    setLoading(true);
    const { data } = await supabase.from('exam_tests').select('*, exam_programs(name)').order('created_at', { ascending: false });
    setTests(data || []);
    setLoading(false);
  };

  const getOtherTestsQuestionIds = async (): Promise<Set<string>> => {
    let query = supabase.from('exam_test_questions').select('question_id, test_id');
    if (editingTestId) {
      query = query.neq('test_id', editingTestId);
    }
    const { data } = await query;
    return new Set<string>((data || []).map((t: any) => t.question_id));
  };

  const loadQuestionBank = async (part: 'A' | 'B') => {
    const { data } = await supabase.from('exam_questions').select('*').eq('part', part).order('created_at', { ascending: false });
    const usedIds = await getOtherTestsQuestionIds();
    const filtered = (data || []).filter(q => !usedIds.has(q.id));
    setQuestionsBank(filtered);
  };

  // -----------------------------------------------------
  // AUTO GENERATE LOGIC (Used from Dashboard & Builder)
  // -----------------------------------------------------
  const performAutoGenerate = async (template: any, targetDifficulty: string) => {
    setLoading(true);
    let newSelectedQs: any[] = [];
    let allMet = true;

    const usedIds = await getOtherTestsQuestionIds();

    for (const sec of template.sections) {
      const { data: qData } = await supabase.from('exam_questions').select('*').eq('part', sec.part);
      const bank = (qData || []).filter(q => !usedIds.has(q.id));

      for (const [type, requiredCount] of Object.entries(sec.requirements)) {
        let available = bank.filter(q => q.type === type);
        if (targetDifficulty !== "ALL") {
          available = available.filter(q => q.difficulty === targetDifficulty);
        }

        // Prevent selecting duplicate questions within the same test
        available = available.filter(q => !newSelectedQs.some(ns => ns.id === q.id));

        // Shuffle
        const shuffled = available.sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, requiredCount as number);
        if (picked.length < (requiredCount as number)) {
          allMet = false;
        }
        newSelectedQs = [...newSelectedQs, ...picked];
      }
    }

    setLoading(false);

    if (!allMet) {
      toast({ title: "Warning", description: `Not enough questions found at ${targetDifficulty} difficulty to fill exact requirements. Some slots left empty.`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Test fully generated!" });
    }

    const typeOrder: Record<string, number> = { 'NAT': 1, 'MSQ': 2, 'MCQ': 3, 'SUBJECTIVE': 4 };
    newSelectedQs.sort((a, b) => {
      if (a.part !== b.part) return a.part.localeCompare(b.part);
      return (typeOrder[a.type] || 5) - (typeOrder[b.type] || 5);
    });

    setSelectedTemplate(template);
    setTestSections(JSON.parse(JSON.stringify(template.sections)));
    setTestTitle(`${template.name} - ${targetDifficulty} Mock`);
    setProgramFormat(template.programFormat || "bachelors");
    setSelectedQuestions(newSelectedQs);
    setCurrentStep('PREVIEW'); // Drop straight into preview
    setPreviewIndex(0);
  };

  const handleQuickGenConfirm = () => {
    setQuickGenOpen(false);
    performAutoGenerate(selectedTemplate, quickGenDiff);
  };

  // -----------------------------------------------------
  // BUILDER / MODAL LOGIC
  // -----------------------------------------------------
  const openPicker = (section: any) => {
    setReplacingQuestionId(null);
    setPickerSection(section);
    setSearchQuery("");
    setPickerTypeFilter("ALL");
    loadQuestionBank(section.part);
    setPickerOpen(true);
  };

  const openReplacePicker = (questionToReplace: any) => {
    setReplacingQuestionId(questionToReplace.id);
    const section = testSections.find(s => s.part === questionToReplace.part);
    setPickerSection(section);
    setSearchQuery("");
    setPickerTypeFilter(questionToReplace.type); // lock to the type we are replacing
    loadQuestionBank(questionToReplace.part);
    setPickerOpen(true);
  };

  const toggleQuestionSelection = (q: any) => {
    if (replacingQuestionId) {
      // Replacing mode: Swap them
      if (selectedQuestions.some(sq => sq.id === q.id)) return; // Prevent picking an already selected one
      const updated = selectedQuestions.map(sq => sq.id === replacingQuestionId ? q : sq);
      setSelectedQuestions(updated);
      setPickerOpen(false);
      setReplacingQuestionId(null);
      toast({ title: "Replaced", description: "Question swapped successfully." });
      return;
    }

    // Normal mode: Toggle
    if (selectedQuestions.some(sq => sq.id === q.id)) {
      setSelectedQuestions(selectedQuestions.filter(sq => sq.id !== q.id));
    } else {
      setSelectedQuestions([...selectedQuestions, q]);
    }
  };

  const autoFillSectionFromPicker = () => {
    if (!pickerSection) return;
    const requirements = pickerSection.requirements;
    let newSelectedQs = selectedQuestions.filter(q => q.part !== pickerSection.part);

    let allMet = true;
    for (const [type, requiredCount] of Object.entries(requirements)) {
      let available = questionsBank.filter(q => q.type === type);
      if (autoDifficulty !== "ALL") {
        available = available.filter(q => q.difficulty === autoDifficulty);
      }
      // Prevent selecting duplicate questions within the same test
      available = available.filter(q => !newSelectedQs.some(ns => ns.id === q.id));

      const shuffled = available.sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, requiredCount as number);
      if (picked.length < (requiredCount as number)) allMet = false;
      newSelectedQs = [...newSelectedQs, ...picked];
    }

    setSelectedQuestions(newSelectedQs);
    if (!allMet) toast({ title: "Warning", description: `Could not find enough questions for all requirements at ${autoDifficulty} difficulty.`, variant: "destructive" });
    else toast({ title: "Success", description: "Section auto-filled." });
  };

  const updateSectionDuration = (part: string, newDuration: number) => {
    setTestSections(testSections.map(s => s.part === part ? { ...s, duration: newDuration } : s));
  };

  // -----------------------------------------------------
  // SAVE / DB LOGIC
  // -----------------------------------------------------
  const deleteTest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    const { error } = await supabase.from('exam_tests').delete().eq('id', id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchTests(); }
  };

  const downloadAnswerKey = async (testId: string, testTitle: string) => {
    try {
      const { data: tqData, error: tqErr } = await supabase.from('exam_test_questions').select('question_id').eq('test_id', testId);
      if (tqErr) throw tqErr;
      if (!tqData || tqData.length === 0) {
        toast({ title: "No Questions", description: "This test has no questions.", variant: "destructive" });
        return;
      }

      const qIds = tqData.map(t => t.question_id);
      const { data: qData, error: qErr } = await supabase.from('exam_questions').select('*, exam_options(*)').in('id', qIds);
      if (qErr) throw qErr;

      // Ensure consistent order based on the mapping table order if order_index existed, 
      // but since it doesn't, we just sort them safely or map them as they come.
      // Filter to Objective Questions only (Part A typically)
      let objectiveQs = (qData || []).filter(q => q.type !== 'SUBJECTIVE');
      
      const typeOrder: Record<string, number> = { 'NAT': 1, 'MSQ': 2, 'MCQ': 3 };
      objectiveQs.sort((a, b) => {
        if (a.part !== b.part) return a.part.localeCompare(b.part);
        if (a.type !== b.type) return (typeOrder[a.type] || 5) - (typeOrder[b.type] || 5);
        return a.id.localeCompare(b.id);
      });

      if (objectiveQs.length === 0) {
        toast({ title: "No Objective Questions", description: "This test has no objective questions (Part A) to generate an answer key for." });
        return;
      }

      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Answer Key: ${testTitle}`, 14, 20);
      
      doc.setFontSize(11);
      doc.text(`Total Objective Questions: ${objectiveQs.length}`, 14, 28);

      const tableData = objectiveQs.map((q, idx) => {
        let ansText = 'N/A';
        
        if (q.exam_options && Array.isArray(q.exam_options)) {
          // Sort options by ID to naturally shuffle (UUIDs are random) but maintain deterministic order
          const sortedOptions = [...q.exam_options].sort((a, b) => a.id.localeCompare(b.id));
          
          if (q.type === 'NAT') {
             const correctOpt = sortedOptions.find(o => o.is_correct);
             if (correctOpt) ansText = correctOpt.content_text;
          } else {
             const correctOpts = sortedOptions.map((o, i) => ({ opt: o, letter: String.fromCharCode(65 + i) })).filter(item => item.opt.is_correct);
             if (correctOpts.length > 0) {
                 ansText = correctOpts.map(item => `${item.letter}) ${item.opt.content_text}`).join('\n');
             }
          }
        }

        // Strip HTML tags and normalize spaces so it looks clean in PDF
        ansText = ansText.replace(/<[^>]*>?/gm, '').replace(/(?:&nbsp;|\u00A0)/g, ' ').trim();

        return [
          (idx + 1).toString(),
          q.type,
          '-', // Marks are currently section-based, so individual marks are implicit
          ansText
        ];
      });

      autoTable(doc, {
        startY: 35,
        head: [['Q.No.', 'Type', 'Marks', 'Correct Answer']],
        body: tableData,
        headStyles: { fillColor: [255, 107, 107] },
      });

      doc.save(`${testTitle.replace(/\s+/g, '_')}_Answer_Key.pdf`);
      toast({ title: "Success", description: "Answer Key PDF downloaded successfully." });

    } catch (err: any) {
      console.error(err);
      toast({ title: "Download Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleEditTest = async (testId: string) => {
    setLoading(true);
    try {
      const { data: testData } = await supabase.from('exam_tests').select('*, exam_programs(name)').eq('id', testId).single();
      if (!testData) return;
      
      const { data: sectionsData } = await supabase.from('exam_test_sections').select('*').eq('test_id', testId);
      const { data: tqData } = await supabase.from('exam_test_questions').select('question_id').eq('test_id', testId);
      
      const questionIds = tqData?.map((t: any) => t.question_id) || [];
      let questionsData: any[] = [];
      if (questionIds.length > 0) {
        const { data: qData } = await supabase.from('exam_questions').select('*').in('id', questionIds);
        questionsData = qData || [];
        
        const typeOrder: Record<string, number> = { 'NAT': 1, 'MSQ': 2, 'MCQ': 3, 'SUBJECTIVE': 4 };
        questionsData.sort((a, b) => {
          if (a.part !== b.part) return a.part.localeCompare(b.part);
          if (a.type !== b.type) return (typeOrder[a.type] || 5) - (typeOrder[b.type] || 5);
          return a.id.localeCompare(b.id);
        });
      }
      
      const templateId = testData.exam_programs?.name;
      const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
      
      setSelectedTemplate(template);
      setTestTitle(testData.title);
      setProgramFormat(testData.program_format || template.programFormat || "bachelors");
      setExpiresAt(testData.expires_at ? new Date(testData.expires_at).toISOString().slice(0, 16) : "");
      setEditingTestId(testId);
      
      const mergedSections = (sectionsData || []).map((sec: any) => {
        const tempSec = template.sections.find((ts: any) => ts.part === sec.part);
        return {
          ...sec,
          requirements: tempSec ? tempSec.requirements : {}
        };
      });
      
      setTestSections(mergedSections);
      setSelectedQuestions(questionsData);
      setCurrentStep('BUILDER');
    } catch(err: any) {
      toast({ title: "Error loading test", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveTest = async (publish: boolean) => {
    if (!testTitle) return toast({ title: "Error", description: "Please enter a test title.", variant: "destructive" });

    for (const sec of testSections) {
      const sectionQs = selectedQuestions.filter(q => q.part === sec.part);
      for (const [type, requiredCount] of Object.entries(sec.requirements)) {
        const count = sectionQs.filter(q => q.type === type).length;
        if (count !== requiredCount) return toast({ title: "Error", description: `Part ${sec.part} requires exactly ${requiredCount} ${type}. Found ${count}.`, variant: "destructive" });
      }
    }

    setSaving(true);
    try {
      let programId = null;
      const { data: progData } = await supabase.from('exam_programs').select('id').eq('name', selectedTemplate.id).single();
      if (progData) programId = progData.id;
      else {
        const { data: newProg } = await supabase.from('exam_programs').insert({ name: selectedTemplate.id }).select().single();
        programId = newProg?.id;
      }

      let testRecordId = editingTestId;

      if (editingTestId) {
        const { error: testErr } = await supabase.from('exam_tests').update({
          title: testTitle, program_id: programId, status: publish ? 'published' : 'draft', program_format: programFormat, expires_at: expiresAt || null
        }).eq('id', editingTestId);
        if (testErr) throw testErr;

        // Clear old sections and questions to replace them
        await supabase.from('exam_test_sections').delete().eq('test_id', editingTestId);
        await supabase.from('exam_test_questions').delete().eq('test_id', editingTestId);
      } else {
        const { data: testData, error: testErr } = await supabase.from('exam_tests').insert({
          title: testTitle, program_id: programId, status: publish ? 'published' : 'draft', program_format: programFormat, expires_at: expiresAt || null
        }).select().single();
        if (testErr) throw testErr;
        testRecordId = testData.id;
      }

      for (const sec of testSections) {
        await supabase.from('exam_test_sections').insert({
          test_id: testRecordId, part: sec.part, duration_minutes: sec.duration
        });
      }

      const questionsToLink = selectedQuestions.map((q, idx) => ({
        test_id: testRecordId, question_id: q.id,
      }));
      if (questionsToLink.length > 0) {
        await supabase.from('exam_test_questions').insert(questionsToLink);
      }

      toast({ title: "Success", description: `Test ${publish ? 'published' : 'saved as draft'}!` });
      setCurrentStep('LIST');
      setSelectedTemplate(null);
      setTestTitle("");
      setExpiresAt("");
      setSelectedQuestions([]);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------
  // RENDERERS
  // -----------------------------------------------------

  if (loading) return <div className="flex items-center justify-center py-20 text-foreground/40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const renderList = () => (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-semibold text-[#262626]">Exam Tests</h1>
        <p className="text-sm text-[#262626]/50 mt-1">Select a template to create a new test, or manage existing ones below.</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/50 mb-4">Available Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map(t => (
            <div key={t.id} className="bg-white border border-black/10 p-6 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{t.name}</h3>
                <p className="text-sm font-medium text-foreground/60 mb-5">{t.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => { setSelectedTemplate(t); setTestSections(JSON.parse(JSON.stringify(t.sections))); setEditingTestId(null); setTestTitle(""); setExpiresAt(""); setProgramFormat(t.programFormat || "bachelors"); setSelectedQuestions([]); setCurrentStep('BUILDER'); }} className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <PlusCircle className="w-4 h-4" /> Build Manually
                </Button>
                <Button variant="outline" onClick={() => { setSelectedTemplate(t); setQuickGenOpen(true); }} className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <Wand2 className="w-4 h-4" /> Quick Generate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-black/5" />

      <div>
        <h3 className="text-lg font-medium text-[#262626] mb-4">Created Tests ({tests.length})</h3>
        <div className="bg-white rounded-xl border border-black/5 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-black/5 p-4 bg-background/50 text-xs font-semibold text-foreground/50 uppercase tracking-widest hidden md:grid">
            <div className="col-span-4">Test Title</div>
            <div className="col-span-3">Program Format</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          <div className="divide-y divide-black/5">
            {tests.map(test => (
              <div key={test.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-background/30 transition-colors text-sm">
                <div className="col-span-4 font-semibold text-[#262626]">{test.title}</div>
                <div className="col-span-3 text-foreground/60 font-medium bg-black/5 inline-block px-2 py-1 rounded w-fit text-xs">
                  {test.program_format === 'both' ? 'Both' : test.program_format === 'masters' ? 'Masters (M.Des/CEED)' : test.program_format === 'bachelors' ? 'Bachelors (B.Des/UCEED)' : 'Unknown'}
                </div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${test.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {test.status.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  {test.status === 'published' && (
                    <Button variant="outline" size="sm" onClick={() => downloadAnswerKey(test.id, testTitle || test.title)} className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" title="Download Answer Key">
                      <FileDown className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEditTest(test.id)} className="h-8 text-primary hover:text-primary hover:bg-primary/5 border-primary/20">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteTest(test.id)} className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {tests.length === 0 && (
              <div className="p-12 text-center text-foreground/40">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tests created yet. Click a template above to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={quickGenOpen} onOpenChange={setQuickGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary" /> Quick Generate Test</DialogTitle>
            <DialogDescription>Auto-select questions for {selectedTemplate?.name} template.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Target Difficulty</Label>
            <select className="w-full h-10 border border-black/10 rounded-md px-3 bg-white text-sm" value={quickGenDiff} onChange={e => setQuickGenDiff(e.target.value)}>
              <option value="ALL">Mixed Difficulty</option>
              <option value="Low">Low Difficulty</option>
              <option value="Medium">Medium Difficulty</option>
              <option value="High">High Difficulty</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickGenOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={handleQuickGenConfirm} className="gap-2"><Wand2 className="w-4 h-4" /> Generate Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderBuilder = () => (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center gap-4 border-b border-black/5 pb-4">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('LIST')} className="text-foreground/50"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div>
          <h2 className="text-xl font-semibold text-[#262626]">Build {selectedTemplate.name} Test</h2>
          <p className="text-xs text-foreground/50">{selectedTemplate.description}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/10 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-semibold">Test Title</Label>
            <Input value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder={`e.g. ${selectedTemplate.name} Mock Test 1`} className="mt-1 h-10" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Target Program Format</Label>
            <select 
              className="w-full h-10 mt-1 border border-black/10 rounded-md px-3 bg-white text-sm"
              value={programFormat}
              onChange={e => setProgramFormat(e.target.value)}
            >
              <option value="bachelors">Bachelors (B.Des / UCEED targets)</option>
              <option value="masters">Masters (M.Des / CEED targets)</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <Label className="text-sm font-semibold">Expiry Date & Time (Optional)</Label>
            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1 h-10 bg-white" />
          </div>
        </div>

        <div className="space-y-6">
          {testSections.map((sec: any) => {
            const sectionQuestions = selectedQuestions.filter(q => q.part === sec.part);
            let isSectionValid = true;
            for (const [type, requiredCount] of Object.entries(sec.requirements)) {
              if (sectionQuestions.filter(q => q.type === type).length !== requiredCount) isSectionValid = false;
            }

            return (
              <div key={sec.part} className={`border ${isSectionValid ? 'border-green-300' : 'border-black/10'} rounded-xl overflow-hidden`}>
                <div className={`p-4 flex items-center justify-between border-b ${isSectionValid ? 'bg-green-50 border-green-200' : 'bg-background border-black/10'}`}>
                  <div>
                    <h3 className="font-semibold text-[#262626] flex items-center gap-2">
                      Part {sec.part} Section {isSectionValid && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2 text-xs text-foreground/60 font-medium">
                        <Clock className="w-3 h-3" /> Duration:
                        <Input type="number" min="1" value={sec.duration} onChange={e => updateSectionDuration(sec.part, parseInt(e.target.value) || 1)} className="w-16 h-7 text-xs px-2 text-center bg-white" />
                        Min
                      </div>
                      <span className="text-black/20">|</span>
                      <span className="text-xs text-foreground/60 font-medium">Reqs: {Object.entries(sec.requirements).map(([t, c]) => `${c} ${t}`).join(', ')}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openPicker(sec)} className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0">
                    <PlusCircle className="w-4 h-4" /> Add Questions
                  </Button>
                </div>
                <div className="p-4 bg-white min-h-[100px]">
                  {sectionQuestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-foreground/30 py-6">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Click "Add Questions" to select from the bank or auto-generate.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sectionQuestions.map((q, idx) => (
                        <div key={q.id} className="flex items-center justify-between p-3 border border-black/5 rounded-lg text-sm bg-background/50">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground/40 w-6">{idx + 1}.</span>
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-bold">{q.type}</span>
                            <span className="text-foreground/80 line-clamp-1 max-w-xl break-words whitespace-normal [&_p]:inline [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4" dangerouslySetInnerHTML={{ __html: (q.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>') }}></span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:bg-red-50" onClick={() => toggleQuestionSelection(q)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-black/10 pt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setCurrentStep('LIST')} disabled={saving}>Cancel</Button>
          <Button variant="outline" onClick={() => setCurrentStep('PREVIEW')} className="gap-2">
            Review & Publish <ArrowLeft className="w-4 h-4 rotate-180" />
          </Button>
        </div>
      </div>
      {renderPickerModal()}
    </div>
  );

  const renderPreview = () => {
    const currentQ = selectedQuestions[previewIndex];

    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-12 h-[calc(100vh-100px)] flex flex-col">
        <div className="flex items-center justify-between border-b border-black/5 pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep('BUILDER')} className="text-foreground/50"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Builder</Button>
            <div>
              <h2 className="text-xl font-semibold text-[#262626]">Candidate Preview: {testTitle || "Untitled Test"}</h2>
              <p className="text-xs text-foreground/50">{selectedQuestions.length} Total Questions | {testSections.reduce((acc, s) => acc + s.duration, 0)} Min</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveTest(false)} disabled={saving}>Save Draft</Button>
            <Button variant="outline" onClick={() => saveTest(true)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Publish Test
            </Button>
          </div>
        </div>

        {selectedQuestions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-foreground/40">No questions to preview. Go back and add some.</div>
        ) : (
          <div className="flex-1 flex gap-6 min-h-0">
            {/* Sidebar Palette */}
            <div className="w-64 bg-white rounded-xl border border-black/10 shadow-sm p-4 flex flex-col shrink-0 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-4">Question Palette</h3>
              <div className="grid grid-cols-4 gap-2">
                {selectedQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setPreviewIndex(idx)}
                    className={`h-10 rounded-md text-xs font-bold transition-all border ${idx === previewIndex ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-background hover:bg-black/5 border-black/10 text-[#262626]'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Question View */}
            <div className="flex-1 bg-white rounded-xl border border-black/10 shadow-sm p-8 overflow-y-auto relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" onClick={() => openReplacePicker(currentQ)} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <RefreshCw className="w-4 h-4" /> Replace Question
                </Button>
              </div>

              <div className="flex gap-2 mb-6">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">Part {currentQ.part}</span>
                <span className="bg-black/5 text-foreground/70 px-2 py-1 rounded text-xs font-bold">{currentQ.type}</span>
                {currentQ.pyq_tag && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">{currentQ.pyq_tag}</span>}
              </div>

              <div className="text-lg text-[#262626] font-medium leading-relaxed mb-8 flex items-start w-full overflow-hidden">
                <span className="font-bold mr-2 shrink-0">Q{previewIndex + 1}.</span>
                <div className="break-words whitespace-normal w-full min-w-0 [&_p]:mb-4 last:[&_p]:mb-0 [&_p:empty]:h-6 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4" dangerouslySetInnerHTML={{ __html: (currentQ.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>') }}></div>
              </div>

              {currentQ.media_url && (
                <div className="mb-8 rounded-lg overflow-hidden border border-black/10 inline-block max-w-full">
                  <img src={currentQ.media_url} alt="Question Media" className="max-h-80 object-contain bg-background/50" />
                </div>
              )}

              {/* Options Mock View */}
              {currentQ.type === 'NAT' ? (
                <div className="w-64">
                  <Label className="text-sm text-foreground/60 mb-2 block">Candidate Input (NAT)</Label>
                  <Input placeholder="Enter numerical answer..." className="h-12 text-lg bg-background" disabled />
                  <p className="text-xs text-green-600 font-medium mt-2">Accepted Answers logic is verified on submission.</p>
                </div>
              ) : currentQ.type === 'SUBJECTIVE' ? (
                <div className="w-full max-w-2xl">
                  <Label className="text-sm text-foreground/60 mb-2 block">Candidate Canvas Upload</Label>
                  <div className="h-40 border-2 border-dashed border-black/10 rounded-xl bg-background/50 flex items-center justify-center text-foreground/30 text-sm">
                    Drag & Drop Sketch File Here
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl">
                  <Label className="text-sm text-foreground/60 mb-2 block">Options</Label>
                  {/* Since options are not eagerly loaded for the test, we mock them for preview or would need to fetch them. For candidate preview, we can just show a placeholder if not fetched, but ideally we show something. */}
                  <div className="p-4 border border-black/5 rounded-lg bg-background text-sm text-foreground/50 italic">
                    Options for {currentQ.type} will be randomized and rendered here during the actual exam.
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-12 pt-6 border-t border-black/5">
                <Button variant="outline" onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))} disabled={previewIndex === 0}>Previous</Button>
                <Button variant="outline" onClick={() => setPreviewIndex(Math.min(selectedQuestions.length - 1, previewIndex + 1))} disabled={previewIndex === selectedQuestions.length - 1}>Next Question</Button>
              </div>
            </div>
          </div>
        )}
        {renderPickerModal()}
      </div>
    );
  };

  const renderPickerModal = () => {
    // Validation Logic
    let pickerIsValid = true;
    const counts: Record<string, { selected: number, required: number }> = {};
    if (pickerSection && !replacingQuestionId) {
      const sectionQs = selectedQuestions.filter(q => q.part === pickerSection.part);
      for (const [type, requiredCount] of Object.entries(pickerSection.requirements)) {
        const selected = sectionQs.filter(q => q.type === type).length;
        counts[type] = { selected, required: requiredCount as number };
        if (selected !== requiredCount) pickerIsValid = false;
      }
    }

    const filteredBank = questionsBank.filter(q => {
      if (pickerTypeFilter !== "ALL" && q.type !== pickerTypeFilter) return false;
      if (searchQuery && !q.content_text.toLowerCase().includes(searchQuery.toLowerCase()) && !q.topics.some((t: any) => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    });

    return (
      <Dialog open={pickerOpen} onOpenChange={(open) => !open && setPickerOpen(false)}>
        <DialogContent className="max-w-[75vw] w-[75vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-6 border-b border-black/5 shrink-0 bg-background/80 backdrop-blur-sm z-10">
            <DialogTitle className="text-2xl font-semibold text-[#262626]">
              {replacingQuestionId ? `Replace Question (Part ${pickerSection?.part})` : `Select Questions for Part ${pickerSection?.part}`}
            </DialogTitle>
            <DialogDescription className="mt-2 text-foreground/60 text-sm">
              {replacingQuestionId ? "Select a new question to swap into this slot. Already selected questions are highlighted in green and disabled." : "Select the exact number of questions required to complete this section."}
            </DialogDescription>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
              {/* Requirements Chips */}
              <div className="flex gap-3">
                {replacingQuestionId ? (
                  <div className="px-4 py-2 rounded-lg border-2 border-primary/30 bg-primary/5 text-primary flex items-center gap-2">
                    <span className="font-bold text-sm">Filtering by: {pickerTypeFilter}</span>
                  </div>
                ) : (
                  <>
                    {Object.entries(counts).map(([type, req]: [string, any]) => {
                      const isMet = req.selected === req.required;
                      const isOver = req.selected > req.required;
                      return (
                        <div
                          key={type}
                          onClick={() => setPickerTypeFilter(type)}
                          className={`cursor-pointer px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${pickerTypeFilter === type ? 'ring-2 ring-primary/20 shadow-sm' : 'opacity-80'
                            } ${isMet ? 'border-green-500 bg-green-50 text-green-700' :
                              isOver ? 'border-red-400 bg-red-50 text-red-700' : 'border-primary/30 bg-white text-[#262626]'
                            }`}
                        >
                          <span className="font-bold text-sm">{type}</span>
                          <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full font-medium">{req.selected} / {req.required}</span>
                          {isMet && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      );
                    })}
                    <Button variant="ghost" size="sm" onClick={() => setPickerTypeFilter("ALL")} className={`h-10 border-2 ${pickerTypeFilter === 'ALL' ? 'border-black/30 bg-black/5' : 'border-transparent'}`}>Show All</Button>
                  </>
                )}
              </div>

              {/* Search & Auto-Fill */}
              <div className="flex items-center gap-3">
                {!replacingQuestionId && (
                  <div className="flex items-center border border-black/10 rounded-md bg-white px-2 h-10 shadow-sm">
                    <span className="text-xs text-foreground/50 mr-2 font-medium">Auto-Fill:</span>
                    <select className="text-sm bg-transparent outline-none pr-2 font-semibold text-[#262626]" value={autoDifficulty} onChange={(e) => setAutoDifficulty(e.target.value)}>
                      <option value="ALL">Any Diff</option>
                      <option value="Low">Low Diff</option>
                      <option value="Medium">Medium Diff</option>
                      <option value="High">High Diff</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={autoFillSectionFromPicker} className="h-7 ml-2 text-xs px-3">Generate</Button>
                  </div>
                )}

                <div className="relative w-56 shadow-sm rounded-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <Input placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 bg-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white/50 p-6 relative">
            {filteredBank.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-foreground/40 bg-white rounded-xl border border-dashed border-black/10 shadow-sm">
                <Filter className="w-10 h-10 mb-3 opacity-30 text-primary" />
                <p className="text-base font-medium">No questions found matching the filter.</p>
              </div>
            ) : (
              <div className="border border-black/10 rounded-xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#262626]/5 border-b border-black/10 text-xs uppercase text-foreground/60 tracking-wider">
                    <tr>
                      <th className="p-4 w-16 text-center font-semibold">Select</th>
                      <th className="p-4 w-24 font-semibold">Type</th>
                      <th className="p-4 font-semibold">Content Snippet</th>
                      <th className="p-4 w-24 font-semibold">Diff</th>
                      <th className="p-4 w-40 font-semibold">Tags/PYQ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filteredBank.map(q => {
                      const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                      // In replacement mode, we highlight currently selected questions and prevent them from being clicked
                      const isUnclickable = replacingQuestionId && isSelected;

                      return (
                        <tr key={q.id} onClick={() => !isUnclickable && toggleQuestionSelection(q)} className={`${isUnclickable ? 'opacity-40 cursor-not-allowed bg-green-50' : 'cursor-pointer hover:bg-black/5'} transition-all duration-200 ${isSelected && !replacingQuestionId ? 'bg-primary/5 hover:bg-primary/10' : ''}`}>
                          <td className="p-4 text-center">
                            <div className={`mx-auto w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? (replacingQuestionId ? 'bg-green-500 border-green-500 text-white' : 'bg-primary border-primary text-white shadow-md shadow-primary/20') : 'border-black/20 bg-white'}`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-black/5 text-[#262626] border border-black/10 px-2 py-1 rounded text-[10px] font-bold tracking-wide">{q.type}</span>
                          </td>
                          <td className="p-4 font-medium text-foreground/80 line-clamp-2">
                            {q.content_text}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold tracking-wide ${q.difficulty === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : q.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              {q.pyq_tag && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded w-fit">{q.pyq_tag}</span>}
                              {q.topics && q.topics.length > 0 && <span className="text-[10px] text-foreground/60 font-medium truncate w-36" title={q.topics.join(', ')}>{q.topics[0]}...</span>}
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

          <div className="p-5 border-t border-black/10 shrink-0 bg-background/80 backdrop-blur-sm flex items-center justify-between z-10">
            <p className="text-sm text-foreground/60">
              {replacingQuestionId ? (
                <span className="text-primary font-medium">Click any available question to swap.</span>
              ) : (
                <>
                  {!pickerIsValid && <span className="text-red-500 font-medium">Requirements not met. Please match exact quantities.</span>}
                  {pickerIsValid && <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Perfect! All section requirements met.</span>}
                </>
              )}
            </p>
            <Button variant="outline" onClick={() => setPickerOpen(false)} disabled={!replacingQuestionId && !pickerIsValid} className="px-8">
              {replacingQuestionId ? "Cancel Swap" : "Confirm Selection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (currentStep === 'LIST') return renderList();
  if (currentStep === 'BUILDER') return renderBuilder();
  if (currentStep === 'PREVIEW') return renderPreview();
  return null;
}
