import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, PlusCircle, CheckCircle2, Search, ArrowLeft, Loader2, FileText, Clock, Trash2, Filter, Settings, Wand2, RefreshCw, FileDown, Zap, Plus, Sparkles, Upload, Image as ImageIcon, AlertCircle, Check, CalendarPlus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sanitizeHtml, cleanPlainText } from "@/lib/sanitize";
import BulkExamUploadModal from "./BulkExamUploadModal";

const TEMPLATES = [
  // Full Length Mocks
  {
    id: "NID Bdes",
    name: "NID B.Des Full Mock",
    category: "full_length",
    description: "Duration: 180 Min (Full Length)",
    programFormat: "bachelors",
    sections: [{ part: "B", duration: 180, requirements: { SUBJECTIVE: 6 } }]
  },
  {
    id: "NID Mdes",
    name: "NID M.Des Full Mock",
    category: "full_length",
    description: "Duration: 180 Min (Full Length)",
    programFormat: "masters",
    sections: [{ part: "B", duration: 180, requirements: { SUBJECTIVE: 6 } }]
  },
  {
    id: "CEED",
    name: "CEED Full Mock",
    category: "full_length",
    description: "Duration: 180 Min (Full Length)",
    programFormat: "masters",
    sections: [
      { part: "A", duration: 60, requirements: { NAT: 8, MSQ: 10, MCQ: 26 } },
      { part: "B", duration: 120, requirements: { SUBJECTIVE: 5 } }
    ]
  },
  {
    id: "UCEED",
    name: "UCEED Full Mock",
    category: "full_length",
    description: "Duration: 180 Min (Full Length)",
    programFormat: "bachelors",
    sections: [
      { part: "A", duration: 120, requirements: { NAT: 14, MSQ: 15, MCQ: 28 } },
      { part: "B", duration: 60, requirements: { SUBJECTIVE: 2 } }
    ]
  },
  // Half Length Mocks
  {
    id: "NID Bdes Half",
    name: "NID B.Des Half Length",
    category: "half_length",
    description: "Duration: 90 Min (Half Length)",
    programFormat: "bachelors",
    sections: [{ part: "B", duration: 90, requirements: { SUBJECTIVE: 3 } }]
  },
  {
    id: "NID Mdes Half",
    name: "NID M.Des Half Length",
    category: "half_length",
    description: "Duration: 90 Min (Half Length)",
    programFormat: "masters",
    sections: [{ part: "B", duration: 90, requirements: { SUBJECTIVE: 3 } }]
  },
  {
    id: "CEED Half",
    name: "CEED Half Length",
    category: "half_length",
    description: "Duration: 90 Min (Part A: 30m, Part B: 60m)",
    programFormat: "masters",
    sections: [
      { part: "A", duration: 30, requirements: { NAT: 4, MSQ: 5, MCQ: 13 } },
      { part: "B", duration: 60, requirements: { SUBJECTIVE: 3 } }
    ]
  },
  {
    id: "UCEED Half",
    name: "UCEED Half Length",
    category: "half_length",
    description: "Duration: 90 Min (Part A: 60m, Part B: 30m)",
    programFormat: "bachelors",
    sections: [
      { part: "A", duration: 60, requirements: { NAT: 7, MSQ: 7, MCQ: 14 } },
      { part: "B", duration: 30, requirements: { SUBJECTIVE: 1 } }
    ]
  },
  // Custom Short Test
  {
    id: "Custom Short",
    name: "Custom Practice Test",
    category: "custom_short",
    description: "Configurable duration & custom question rules",
    programFormat: "both",
    sections: [
      { part: "A", duration: 30, requirements: { NAT: 5, MSQ: 5, MCQ: 10 } },
      { part: "B", duration: 30, requirements: { SUBJECTIVE: 2 } }
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
  const [testCode, setTestCode] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [programFormat, setProgramFormat] = useState("bachelors");
  const [testCategory, setTestCategory] = useState<string>("full_length");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("ALL");
  const [testListCategoryFilter, setTestListCategoryFilter] = useState<string>("ALL");
  const [testListFocusFilter, setTestListFocusFilter] = useState<'ALL' | 'FOCUS' | 'GENERAL'>('ALL');
  const [expiresAt, setExpiresAt] = useState("");
  const [isFocusBatch, setIsFocusBatch] = useState(false);
  const [testSections, setTestSections] = useState<any[]>([]); // cloned from template so duration can be edited
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  // Single Entry Point Studio State
  const [selectedExamKey, setSelectedExamKey] = useState<string>("CEED");
  const [selectedFormatKey, setSelectedFormatKey] = useState<string>("full_length");

  // Quick Gen Modal State with PYQ & Exam Tag
  const [quickGenOpen, setQuickGenOpen] = useState(false);
  const [quickGenDiff, setQuickGenDiff] = useState("Medium");
  const [quickGenSource, setQuickGenSource] = useState<"all" | "pyq_only">("all");
  const [quickGenExamTag, setQuickGenExamTag] = useState<string>("ALL");

  // Bulk Upload Exam Paper Modal State
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  // Quick Extend Expiry Modal State (Admin list quick action)
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [testToExtend, setTestToExtend] = useState<any | null>(null);
  const [extendPresetDays, setExtendPresetDays] = useState<number | 'custom' | 'clear'>(7);
  const [customExtendDate, setCustomExtendDate] = useState("");
  const [extendingExpiry, setExtendingExpiry] = useState(false);

  const openExtendModal = (test: any) => {
    setTestToExtend(test);
    setExtendPresetDays(7);
    const base = test.expires_at ? new Date(test.expires_at).getTime() : Date.now();
    const plusWeek = new Date(base + 7 * 24 * 60 * 60 * 1000);
    setCustomExtendDate(plusWeek.toISOString().slice(0, 16));
    setExtendModalOpen(true);
  };

  const handleConfirmExtendExpiry = async () => {
    if (!testToExtend) return;
    setExtendingExpiry(true);

    try {
      let finalExpiresAt: string | null = null;
      if (extendPresetDays === 'clear') {
        finalExpiresAt = null;
      } else if (extendPresetDays === 'custom') {
        finalExpiresAt = customExtendDate ? new Date(customExtendDate).toISOString() : null;
      } else {
        const base = testToExtend.expires_at ? new Date(testToExtend.expires_at).getTime() : Date.now();
        finalExpiresAt = new Date(base + (Number(extendPresetDays) || 7) * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from('exam_tests')
        .update({ expires_at: finalExpiresAt })
        .eq('id', testToExtend.id);

      if (error) throw error;

      // Update local state in tests list
      setTests(prev => prev.map(t => t.id === testToExtend.id ? { ...t, expires_at: finalExpiresAt } : t));

      const formattedLabel = finalExpiresAt
        ? new Date(finalExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Removed (No Expiry)';

      toast({
        title: "Test Expiry Updated! ⏰",
        description: `New deadline for "${testToExtend.title}": ${formattedLabel}`,
      });

      setExtendModalOpen(false);
      setTestToExtend(null);
    } catch (err: any) {
      toast({
        title: "Failed to Extend Expiry",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setExtendingExpiry(false);
    }
  };

  // Helper to resolve the active template
  const getActiveTemplate = () => {
    if (selectedExamKey === "CUSTOM" || selectedFormatKey === "custom_short") {
      return TEMPLATES.find(t => t.id === "Custom Short") || TEMPLATES[0];
    }
    if (selectedExamKey === "NID_BDES") {
      return selectedFormatKey === "half_length" 
        ? (TEMPLATES.find(t => t.id === "NID Bdes Half") || TEMPLATES[0])
        : (TEMPLATES.find(t => t.id === "NID Bdes") || TEMPLATES[0]);
    }
    if (selectedExamKey === "NID_MDES") {
      return selectedFormatKey === "half_length" 
        ? (TEMPLATES.find(t => t.id === "NID Mdes Half") || TEMPLATES[0])
        : (TEMPLATES.find(t => t.id === "NID Mdes") || TEMPLATES[0]);
    }
    if (selectedExamKey === "CEED") {
      return selectedFormatKey === "half_length" 
        ? (TEMPLATES.find(t => t.id === "CEED Half") || TEMPLATES[0])
        : (TEMPLATES.find(t => t.id === "CEED") || TEMPLATES[0]);
    }
    if (selectedExamKey === "UCEED") {
      return selectedFormatKey === "half_length" 
        ? (TEMPLATES.find(t => t.id === "UCEED Half") || TEMPLATES[0])
        : (TEMPLATES.find(t => t.id === "UCEED") || TEMPLATES[0]);
    }
    return TEMPLATES[0];
  };

  // Question Picker Modal (Used for Adding & Replacing)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSection, setPickerSection] = useState<any>(null);
  const [questionsBank, setQuestionsBank] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerTypeFilter, setPickerTypeFilter] = useState<string>("ALL");
  const [pickerDiffFilter, setPickerDiffFilter] = useState<string>("ALL");
  const [pickerTopicFilter, setPickerTopicFilter] = useState<string>("");
  const [pickerPyqOnly, setPickerPyqOnly] = useState<boolean>(false);
  const [pickerExamTagFilter, setPickerExamTagFilter] = useState<string>("ALL");
  const [autoDifficulty, setAutoDifficulty] = useState<string>("ALL");

  // Replacement specific
  const [replacingQuestionId, setReplacingQuestionId] = useState<string | null>(null);

  // Preview State
  const [previewIndex, setPreviewIndex] = useState(0);

  // Target Part B Marks based on category (full = 100, half = 50, custom = 50)
  const getTargetPartBMarks = (cat?: string) => {
    const category = cat || testCategory;
    if (category === 'half_length') return 50;
    if (category === 'custom_short') return 50;
    return 100;
  };

  const getPartBTotalMarks = (qs?: any[]) => {
    const list = qs || selectedQuestions;
    return list
      .filter(q => q.part === 'B')
      .reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  };

  const distributePartBMarks = (targetTotal?: number) => {
    const target = targetTotal ?? getTargetPartBMarks(testCategory);
    const partBIndices: number[] = [];
    selectedQuestions.forEach((q, idx) => {
      if (q.part === 'B') partBIndices.push(idx);
    });
    if (partBIndices.length === 0) {
      toast({ title: "No Part B questions", description: "Please add Part B questions before distributing marks.", variant: "destructive" });
      return;
    }
    const base = Math.floor(target / partBIndices.length);
    const remainder = target % partBIndices.length;
    const updated = [...selectedQuestions];
    partBIndices.forEach((qIdx, i) => {
      updated[qIdx] = {
        ...updated[qIdx],
        marks: Math.max(1, base + (i < remainder ? 1 : 0))
      };
    });
    setSelectedQuestions(updated);
    toast({
      title: "Marks Distributed Evenly ✨",
      description: `Part B marks evenly split among ${partBIndices.length} questions to sum to ${target} marks.`
    });
  };

  // Inline Question Creation Modal State (Part A & Part B)
  const [createQModalOpen, setCreateQModalOpen] = useState(false);
  const [createQPart, setCreateQPart] = useState<'A' | 'B'>('B');
  const [createQType, setCreateQType] = useState<'MCQ' | 'MSQ' | 'NAT' | 'SUBJECTIVE'>('SUBJECTIVE');
  const [createQDifficulty, setCreateQDifficulty] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [createQContent, setCreateQContent] = useState('');
  const [createQMediaFile, setCreateQMediaFile] = useState<File | null>(null);
  const [createQMediaPreview, setCreateQMediaPreview] = useState<string | null>(null);
  const [createQPyqTag, setCreateQPyqTag] = useState('');
  const [createQTopics, setCreateQTopics] = useState('');
  const [createQMarks, setCreateQMarks] = useState<number>(20);
  const [createQSaving, setCreateQSaving] = useState(false);
  const [createQOptions, setCreateQOptions] = useState<Array<{ content_text: string; is_correct: boolean }>>([
    { content_text: '', is_correct: false },
    { content_text: '', is_correct: false },
    { content_text: '', is_correct: false },
    { content_text: '', is_correct: false }
  ]);

  const openCreateQuestion = (part: 'A' | 'B', preferredType?: string) => {
    setCreateQPart(part);
    if (part === 'B') {
      setCreateQType('SUBJECTIVE');
      const currentSum = getPartBTotalMarks();
      const target = getTargetPartBMarks(testCategory);
      const remaining = target - currentSum;
      setCreateQMarks(remaining > 0 ? remaining : 20);
    } else {
      const pType = (preferredType as any) || 'MCQ';
      setCreateQType(pType);
      setCreateQOptions([
        { content_text: '', is_correct: pType === 'NAT' ? true : false },
        { content_text: '', is_correct: false },
        { content_text: '', is_correct: false },
        { content_text: '', is_correct: false }
      ]);
    }
    setCreateQDifficulty('Medium');
    setCreateQContent('');
    setCreateQMediaFile(null);
    setCreateQMediaPreview(null);
    setCreateQPyqTag('');
    setCreateQTopics('');
    setCreateQModalOpen(true);
  };

  const handleCreateQuestionSubmit = async () => {
    if (!createQContent.trim()) {
      return toast({ title: "Validation Error", description: "Question prompt text is required.", variant: "destructive" });
    }

    if (createQPart === 'B') {
      const parsedMarks = Number(createQMarks);
      if (!createQMarks || isNaN(parsedMarks) || parsedMarks <= 0) {
        return toast({ 
          title: "Invalid Marks", 
          description: "Marks must be strictly greater than 0. Zero or negative marks are not allowed.", 
          variant: "destructive" 
        });
      }
    } else {
      if (createQType === 'MCQ') {
        const correctCount = createQOptions.filter(o => o.is_correct).length;
        if (correctCount !== 1) {
          return toast({ title: "Validation Error", description: "MCQ questions must have exactly 1 correct option selected.", variant: "destructive" });
        }
        if (createQOptions.some(o => !o.content_text.trim())) {
          return toast({ title: "Validation Error", description: "All 4 options must contain content text.", variant: "destructive" });
        }
      } else if (createQType === 'MSQ') {
        const correctCount = createQOptions.filter(o => o.is_correct).length;
        if (correctCount < 1) {
          return toast({ title: "Validation Error", description: "MSQ questions must have at least 1 correct option selected.", variant: "destructive" });
        }
        if (createQOptions.some(o => !o.content_text.trim())) {
          return toast({ title: "Validation Error", description: "All 4 options must contain content text.", variant: "destructive" });
        }
      } else if (createQType === 'NAT') {
        if (!createQOptions[0]?.content_text.trim()) {
          return toast({ title: "Validation Error", description: "Please enter the acceptable numerical answer or range for NAT.", variant: "destructive" });
        }
      }
    }

    setCreateQSaving(true);
    try {
      let uploadedMediaUrl: string | null = null;
      if (createQMediaFile) {
        const fileExt = createQMediaFile.name.split('.').pop();
        const cleanTag = (createQPyqTag || 'INLINE').replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const fileName = `${cleanTag}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
        const { error: upErr } = await supabase.storage.from('question-media').upload(fileName, createQMediaFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('question-media').getPublicUrl(fileName);
          uploadedMediaUrl = urlData.publicUrl;
        }
      }

      const topicsArr = createQTopics.split(',').map(t => t.trim()).filter(Boolean);
      const questionPayload = {
        type: createQType,
        part: createQPart,
        difficulty: createQDifficulty,
        content_text: createQContent.trim(),
        media_url: uploadedMediaUrl,
        topics: topicsArr,
        pyq_tag: createQPyqTag.trim() || null
      };

      const { data: insertedQ, error: insErr } = await supabase.from('exam_questions').insert(questionPayload).select().single();
      if (insErr) throw insErr;

      if (createQPart === 'A' && insertedQ) {
        const optsToInsert = (createQType === 'NAT' ? [createQOptions[0]] : createQOptions).map(opt => ({
          question_id: insertedQ.id,
          content_text: opt.content_text.trim(),
          is_correct: createQType === 'NAT' ? true : opt.is_correct
        }));
        await supabase.from('exam_options').insert(optsToInsert);
      }

      const newQuestionObj = {
        ...insertedQ,
        marks: createQPart === 'B' ? Number(createQMarks) : undefined
      };

      // Add to selected questions in current test
      setSelectedQuestions(prev => [...prev, newQuestionObj]);

      // Automatically adjust section requirements count so validation passes smoothly
      setTestSections(prev => prev.map(s => {
        if (s.part === createQPart) {
          const currentCount = s.requirements[createQType] || 0;
          return {
            ...s,
            requirements: {
              ...s.requirements,
              [createQType]: currentCount + 1
            }
          };
        }
        return s;
      }));

      // Update question bank cache
      setQuestionsBank(prev => [insertedQ, ...prev]);

      toast({
        title: "Question Created & Attached! 🎉",
        description: `Saved to central Question Bank and added to Part ${createQPart} of this test.`
      });
      setCreateQModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to create question", description: err.message, variant: "destructive" });
    } finally {
      setCreateQSaving(false);
    }
  };

  // Auto-import preselected questions from Question Bank if forwarded
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('df_preselected_questions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          sessionStorage.removeItem('df_preselected_questions');
          const customTemplate = TEMPLATES.find(t => t.id === "Custom Short") || TEMPLATES[0];
          setSelectedTemplate(customTemplate);
          setTestCategory("custom_short");
          setTestSections(JSON.parse(JSON.stringify(customTemplate.sections)));
          setSelectedQuestions(parsed);
          setTestTitle(`Mock Test (${parsed.length} Questions)`);
          setCurrentStep('BUILDER');
          toast({
            title: "Questions Imported! 🚀",
            description: `${parsed.length} questions loaded directly from the Question Bank.`
          });
        }
      }
    } catch (e) {
      console.error('Failed to import preselected questions:', e);
    }
  }, []);

  const handleFocusBatchToggle = (checked: boolean) => {
    setIsFocusBatch(checked);
    if (checked) {
      // Enforce strict 1-week deadline from now
      const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const iso = oneWeekLater.toISOString().slice(0, 16);
      setExpiresAt(iso);
    }
  };

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
  const performAutoGenerate = async (
    template: any, 
    targetDifficulty: string = "ALL", 
    isPyqOnly: boolean = false, 
    examTag: string = "ALL"
  ) => {
    setLoading(true);
    let newSelectedQs: any[] = [];
    let allMet = true;

    const usedIds = await getOtherTestsQuestionIds();

    for (const sec of template.sections) {
      const { data: qData } = await supabase.from('exam_questions').select('*').eq('part', sec.part);
      const bank = (qData || []).filter(q => !usedIds.has(q.id));

      for (const [type, requiredCount] of Object.entries(sec.requirements)) {
        let available = bank.filter(q => q.type === type);
        
        // 1. Target Difficulty filter
        if (targetDifficulty !== "ALL") {
          available = available.filter(q => q.difficulty === targetDifficulty);
        }

        // 2. PYQ filter
        if (isPyqOnly) {
          available = available.filter(q => Boolean(q.pyq_tag && q.pyq_tag.trim().length > 0));
        }

        // 3. Exam Tag filter (NID / CEED / UCEED)
        if (examTag && examTag !== "ALL") {
          const tagUpper = examTag.toUpperCase();
          available = available.filter(q => {
            const pyqMatch = (q.pyq_tag || '').toUpperCase().includes(tagUpper);
            const topicMatch = Array.isArray(q.topics) && q.topics.some((t: string) => t.toUpperCase().includes(tagUpper));
            const textMatch = (q.content_text || '').toUpperCase().includes(tagUpper);
            return pyqMatch || topicMatch || textMatch;
          });
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
      const pyqText = isPyqOnly ? " [PYQ Only]" : "";
      const tagText = examTag !== "ALL" ? ` [${examTag}]` : "";
      toast({ 
        title: "Warning", 
        description: `Not enough questions found for all slots with strict criteria (${targetDifficulty} diff${pyqText}${tagText}). Added all available matches.`, 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Success", description: "Test fully generated!" });
    }

    const typeOrder: Record<string, number> = { 'NAT': 1, 'MSQ': 2, 'MCQ': 3, 'SUBJECTIVE': 4 };
    newSelectedQs.sort((a, b) => {
      if (a.part !== b.part) return a.part.localeCompare(b.part);
      return (typeOrder[a.type] || 5) - (typeOrder[b.type] || 5);
    });

    // Auto-distribute Part B marks according to target format total (100 for Full, 50 for Half)
    const targetPartBMarks = getTargetPartBMarks(template.category || "full_length");
    const partBCount = newSelectedQs.filter(q => q.part === 'B').length;
    if (partBCount > 0) {
      const base = Math.floor(targetPartBMarks / partBCount);
      const remainder = targetPartBMarks % partBCount;
      let bIdx = 0;
      newSelectedQs.forEach(q => {
        if (q.part === 'B') {
          q.marks = Math.max(1, base + (bIdx < remainder ? 1 : 0));
          bIdx++;
        }
      });
    }

    setSelectedTemplate(template);
    setTestSections(JSON.parse(JSON.stringify(template.sections)));
    
    const diffLabel = targetDifficulty === "ALL" ? "Mixed" : targetDifficulty;
    const pyqLabel = isPyqOnly ? " PYQ" : "";
    const examLabel = examTag !== "ALL" ? ` (${examTag})` : "";
    setTestTitle(`${template.name} - ${diffLabel}${pyqLabel} Mock${examLabel}`);
    
    setProgramFormat(template.programFormat || "bachelors");
    setSelectedQuestions(newSelectedQs);
    setCurrentStep('PREVIEW'); // Drop straight into preview
    setPreviewIndex(0);
  };

  const handleQuickGenConfirm = () => {
    setQuickGenOpen(false);
    performAutoGenerate(selectedTemplate, quickGenDiff, quickGenSource === "pyq_only", quickGenExamTag);
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
      if (pickerPyqOnly) {
        available = available.filter(q => !!q.pyq_tag);
      }
      if (pickerExamTagFilter !== "ALL") {
        const tagUpper = pickerExamTagFilter.toUpperCase();
        available = available.filter(q =>
          (q.pyq_tag || '').toUpperCase().includes(tagUpper) ||
          q.topics?.some((t: any) => t.toUpperCase().includes(tagUpper)) ||
          (q.content_text || '').toUpperCase().includes(tagUpper)
        );
      }
      // Prevent selecting duplicate questions within the same test
      available = available.filter(q => !newSelectedQs.some(ns => ns.id === q.id));

      const shuffled = available.sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, requiredCount as number);
      if (picked.length < (requiredCount as number)) allMet = false;
      newSelectedQs = [...newSelectedQs, ...picked];
    }

    setSelectedQuestions(newSelectedQs);
    if (!allMet) toast({ title: "Warning", description: `Could not find enough questions for all requirements under current filters.`, variant: "destructive" });
    else toast({ title: "Success", description: "Section auto-filled." });
  };

  const updateSectionDuration = (part: string, newDuration: number) => {
    setTestSections(testSections.map(s => s.part === part ? { ...s, duration: newDuration } : s));
  };

  const updateRequirementCount = (part: string, type: string, count: number) => {
    setTestSections(prev => prev.map(s => {
      if (s.part === part) {
        return {
          ...s,
          requirements: {
            ...s.requirements,
            [type]: Math.max(0, count)
          }
        };
      }
      return s;
    }));
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

        ansText = ansText.replace(/<[^>]*>?/gm, '').replace(/(?:&nbsp;|\u00A0)/g, ' ').trim();

        return [
          (idx + 1).toString(),
          q.type,
          '-',
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
      
      // Load question_id and marks defensively with zero-downtime fallback
      let tqData: any[] = [];
      const tqRes = await supabase.from('exam_test_questions').select('question_id, marks').eq('test_id', testId);
      if (tqRes.error && (tqRes.error.message?.includes('marks') || tqRes.error.code === '42703')) {
        const fallbackRes = await supabase.from('exam_test_questions').select('question_id').eq('test_id', testId);
        tqData = fallbackRes.data || [];
      } else {
        tqData = tqRes.data || [];
      }
      
      const questionIds = tqData?.map((t: any) => t.question_id) || [];
      let questionsData: any[] = [];
      if (questionIds.length > 0) {
        const { data: qData } = await supabase.from('exam_questions').select('*').in('id', questionIds);
        const marksMap = new Map((tqData || []).map((t: any) => [t.question_id, t.marks]));
        const categoryTarget = getTargetPartBMarks(testData.category);
        const partBCount = (qData || []).filter((q: any) => q.part === 'B').length;
        const defaultPerQ = partBCount > 0 ? Math.floor(categoryTarget / partBCount) : 20;

        questionsData = (qData || []).map((q: any) => ({
          ...q,
          marks: marksMap.get(q.id) != null ? Number(marksMap.get(q.id)) : (q.part === 'B' ? defaultPerQ : undefined)
        }));
        
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
      setTestCode(testData.test_code || "");
      setProgramFormat(testData.program_format || template.programFormat || "bachelors");
      setTestCategory(testData.category || template.category || "full_length");
      setExpiresAt(testData.expires_at ? new Date(testData.expires_at).toISOString().slice(0, 16) : "");
      setIsFocusBatch(Boolean(testData.is_focus_batch || testData.access_tier === 'focus_batch'));
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

    // Strict Part B marks validation: non-zero, non-negative, and sums to paper target
    const partBQuestions = selectedQuestions.filter(q => q.part === 'B');
    if (partBQuestions.length > 0) {
      const invalidMarksQ = partBQuestions.find(q => !q.marks || Number(q.marks) <= 0 || isNaN(Number(q.marks)));
      if (invalidMarksQ) {
        return toast({
          title: "Invalid Part B Marks",
          description: "All Part B questions must have strictly positive marks (> 0). Zero or negative marks are not allowed.",
          variant: "destructive"
        });
      }

      const targetPartBMarks = getTargetPartBMarks(testCategory);
      const totalPartBMarks = partBQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
      if (totalPartBMarks !== targetPartBMarks) {
        return toast({
          title: "Part B Marks Total Mismatch",
          description: `Part B questions must sum to exactly ${targetPartBMarks} marks for this paper format. Current sum: ${totalPartBMarks} marks. Please adjust marks or click "Auto-Distribute Evenly".`,
          variant: "destructive"
        });
      }
    }

    setSaving(true);
    try {
      let programId = null;
      const targetName = selectedTemplate.name || selectedTemplate.id;
      let { data: progData } = await supabase.from('exam_programs').select('id').eq('name', targetName).maybeSingle();
      if (!progData && selectedTemplate.id !== targetName) {
        const { data: progData2 } = await supabase.from('exam_programs').select('id').eq('name', selectedTemplate.id).maybeSingle();
        progData = progData2;
      }

      if (progData) {
        programId = progData.id;
      } else {
        const { data: newProg } = await supabase.from('exam_programs').insert({ name: targetName }).select().maybeSingle();
        if (newProg) {
          programId = newProg.id;
        } else {
          const { data: firstProg } = await supabase.from('exam_programs').select('id').limit(1).maybeSingle();
          if (firstProg) programId = firstProg.id;
        }
      }

      let testRecordId = editingTestId;

      const testPayload: any = {
        title: testTitle, 
        test_code: testCode.trim() || null,
        program_id: programId, 
        status: publish ? 'published' : 'draft', 
        program_format: programFormat, 
        expires_at: expiresAt || null,
        category: testCategory,
        is_focus_batch: isFocusBatch,
        access_tier: isFocusBatch ? 'focus_batch' : 'all'
      };

      if (editingTestId) {
        let { error: testErr } = await supabase.from('exam_tests').update(testPayload).eq('id', editingTestId);
        if (testErr && (testErr.message?.includes('test_code') || testErr.message?.includes('category') || testErr.message?.includes('is_focus_batch') || testErr.message?.includes('access_tier'))) {
          if (testErr.message?.includes('test_code')) delete testPayload.test_code;
          delete testPayload.is_focus_batch;
          delete testPayload.access_tier;
          delete testPayload.category;
          const retry = await supabase.from('exam_tests').update(testPayload).eq('id', editingTestId);
          if (retry.error) throw retry.error;
        } else if (testErr) {
          throw testErr;
        }

        // Clear old sections and questions to replace them
        await supabase.from('exam_test_sections').delete().eq('test_id', editingTestId);
        await supabase.from('exam_test_questions').delete().eq('test_id', editingTestId);
      } else {
        let { data: testData, error: testErr } = await supabase.from('exam_tests').insert(testPayload).select().single();
        if (testErr && (testErr.message?.includes('category') || testErr.message?.includes('is_focus_batch') || testErr.message?.includes('access_tier'))) {
          delete testPayload.is_focus_batch;
          delete testPayload.access_tier;
          delete testPayload.category;
          const retry = await supabase.from('exam_tests').insert(testPayload).select().single();
          if (retry.error) throw retry.error;
          testData = retry.data;
        } else if (testErr) {
          throw testErr;
        }
        testRecordId = testData.id;
      }

      for (const sec of testSections) {
        await supabase.from('exam_test_sections').insert({
          test_id: testRecordId, part: sec.part, duration_minutes: sec.duration
        });
      }

      const questionsToLink = selectedQuestions.map((q) => ({
        test_id: testRecordId, 
        question_id: q.id,
        marks: q.part === 'B' ? (Number(q.marks) || null) : null
      }));
      if (questionsToLink.length > 0) {
        let { error: insertErr } = await supabase.from('exam_test_questions').insert(questionsToLink);
        if (insertErr && (insertErr.message?.includes('marks') || insertErr.code === '42703')) {
          // Zero-downtime fallback: if marks column not yet in DB, link without marks
          const fallbackLinks = questionsToLink.map(({ test_id, question_id }) => ({ test_id, question_id }));
          const retry = await supabase.from('exam_test_questions').insert(fallbackLinks);
          if (retry.error) throw retry.error;
        } else if (insertErr) {
          throw insertErr;
        }
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

  const renderList = () => {
    const filteredTemplates = templateCategoryFilter === "ALL" 
      ? TEMPLATES 
      : TEMPLATES.filter(t => t.category === templateCategoryFilter);

    const filteredTests = tests.filter(t => {
      if (testListCategoryFilter !== "ALL" && (t.category || "full_length") !== testListCategoryFilter) return false;
      if (testListFocusFilter === "FOCUS" && !t.is_focus_batch && t.access_tier !== 'focus_batch') return false;
      if (testListFocusFilter === "GENERAL" && (t.is_focus_batch || t.access_tier === 'focus_batch')) return false;
      if (testSearch.trim()) {
        const s = testSearch.trim().toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(s);
        const matchCode = (t.test_code || '').toLowerCase().includes(s);
        if (!matchTitle && !matchCode) return false;
      }
      return true;
    });

    return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-semibold text-[#262626]">Exam Tests</h1>
        <p className="text-sm text-[#262626]/50 mt-1">Select a template to create a new test, or manage existing ones below.</p>
      </div>

      {/* MOCK CREATION STUDIO: Unified Single Entry Point */}
      {(() => {
        const activeTemplate = getActiveTemplate();
        const totalDuration = activeTemplate?.sections?.reduce((acc: number, s: any) => acc + s.duration, 0) || 180;
        
        return (
          <div className="bg-white border border-black/10 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-black/5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Mock Creation Studio</span>
                </div>
                <h2 className="text-xl font-bold text-[#262626]">Create New Mock Test</h2>
                <p className="text-xs text-foreground/50 mt-0.5">
                  Configure test structure, duration, and question distribution from a single control point.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/40 font-medium">Selected Template:</span>
                <span className="text-xs font-bold bg-black/5 px-2.5 py-1 rounded-md text-foreground/80">
                  {activeTemplate?.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Left Column: Target Exam & Format Selectors */}
              <div className="space-y-5">
                {/* 1. Target Exam Selection */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2.5 block">
                    1. Target Exam
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'NID_BDES', label: 'NID B.Des', tag: 'UG' },
                      { key: 'NID_MDES', label: 'NID M.Des', tag: 'PG' },
                      { key: 'CEED', label: 'CEED', tag: 'M.Des' },
                      { key: 'UCEED', label: 'UCEED', tag: 'B.Des' },
                      { key: 'CUSTOM', label: 'Custom Test', tag: 'Flex' }
                    ].map(exam => {
                      const isSelected = selectedExamKey === exam.key;
                      return (
                        <button
                          key={exam.key}
                          type="button"
                          onClick={() => {
                            setSelectedExamKey(exam.key);
                            if (exam.key === 'CUSTOM') setSelectedFormatKey('custom_short');
                          }}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary shadow-xs font-bold ring-1 ring-primary/20'
                              : 'border-black/10 bg-white text-foreground/70 hover:border-black/20 hover:bg-black/[0.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-semibold">{exam.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              isSelected ? 'bg-primary text-white' : 'bg-black/5 text-foreground/50'
                            }`}>
                              {exam.tag}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Format / Duration Selection */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2.5 block">
                    2. Test Format & Duration
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'full_length', label: 'Full Length', badge: '180 Mins' },
                      { key: 'half_length', label: '⚡ Half Length', badge: '90 Mins' },
                      { key: 'custom_short', label: '⚡ Custom Short', badge: 'Flexible' }
                    ].map(fmt => {
                      const isSelected = selectedFormatKey === fmt.key;
                      return (
                        <button
                          key={fmt.key}
                          type="button"
                          onClick={() => {
                            setSelectedFormatKey(fmt.key);
                            if (fmt.key === 'custom_short') setSelectedExamKey('CUSTOM');
                          }}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary shadow-xs font-bold ring-1 ring-primary/20'
                              : 'border-black/10 bg-white text-foreground/70 hover:border-black/20 hover:bg-black/[0.02]'
                          }`}
                        >
                          <span className="text-xs font-semibold">{fmt.label}</span>
                          <span className="text-[11px] text-foreground/50 mt-0.5">{fmt.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Spec Preview & Instant Action Buttons */}
              <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#111111] text-white shadow-md relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                        Structure Preview
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1.5">{activeTemplate?.name}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">{activeTemplate?.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">{totalDuration}</span>
                      <span className="text-xs text-neutral-400 block -mt-1">Minutes</span>
                    </div>
                  </div>

                  {/* Sections Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {activeTemplate?.sections?.map((sec: any) => {
                      const reqs = sec.requirements || {};
                      return (
                        <div key={sec.part} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-white">Part {sec.part}</span>
                            <span className="text-neutral-400 font-medium">⏱️ {sec.duration} Mins</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[11px] text-neutral-300">
                            {Object.entries(reqs).map(([type, count]) => (
                              <span key={type} className="px-2 py-0.5 rounded bg-white/10 text-white/90">
                                {count as number} {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/10 relative z-10">
                  <Button
                    onClick={() => {
                      const t = activeTemplate;
                      setSelectedTemplate(t);
                      setTestCategory(t.category || "full_length");
                      setTestSections(JSON.parse(JSON.stringify(t.sections)));
                      setEditingTestId(null);
                      setTestTitle("");
                      setExpiresAt("");
                      setIsFocusBatch(false);
                      setProgramFormat(t.programFormat || "bachelors");
                      setSelectedQuestions([]);
                      setCurrentStep('BUILDER');
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold h-10 rounded-xl border border-white/15 gap-2"
                  >
                    <PlusCircle className="w-4 h-4 text-primary" /> Build Manually
                  </Button>
                  <Button
                    onClick={() => {
                      const t = activeTemplate;
                      setSelectedTemplate(t);
                      setTestCategory(t.category || "full_length");
                      
                      // Auto set exam tag filter for quick gen modal
                      if (selectedExamKey === 'CEED') setQuickGenExamTag('CEED');
                      else if (selectedExamKey === 'UCEED') setQuickGenExamTag('UCEED');
                      else if (selectedExamKey.startsWith('NID')) setQuickGenExamTag('NID');
                      else setQuickGenExamTag('ALL');
                      
                      setQuickGenOpen(true);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold h-10 rounded-xl shadow-lg shadow-primary/25 gap-2"
                  >
                    <Wand2 className="w-4 h-4" /> Quick Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="border-t border-black/5" />

      <div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-medium text-[#262626]">Created Tests ({filteredTests.length})</h3>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Search by Title or Code */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input
                type="text"
                placeholder="Search tests or code..."
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-white border-black/10 rounded-lg"
              />
            </div>

            {/* Focus Batch vs General Filter */}
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-lg text-xs font-semibold">
              <button 
                onClick={() => setTestListFocusFilter('ALL')} 
                className={`px-2.5 py-1 rounded-md transition-all ${testListFocusFilter === 'ALL' ? 'bg-white shadow-sm text-black' : 'text-foreground/60 hover:text-black'}`}
              >
                All Audiences
              </button>
              <button 
                onClick={() => setTestListFocusFilter('FOCUS')} 
                className={`px-2.5 py-1 rounded-md transition-all ${testListFocusFilter === 'FOCUS' ? 'bg-orange-600 text-white shadow-sm font-bold' : 'text-orange-700 hover:bg-orange-50'}`}
              >
                🎯 Focus Batch
              </button>
              <button 
                onClick={() => setTestListFocusFilter('GENERAL')} 
                className={`px-2.5 py-1 rounded-md transition-all ${testListFocusFilter === 'GENERAL' ? 'bg-white shadow-sm text-black' : 'text-foreground/60 hover:text-black'}`}
              >
                General Mocks
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-lg text-xs font-semibold">
              <button 
                onClick={() => setTestListCategoryFilter('ALL')} 
                className={`px-2.5 py-1 rounded-md transition-all ${testListCategoryFilter === 'ALL' ? 'bg-white shadow-sm text-black' : 'text-foreground/60 hover:text-black'}`}
              >
                All Lengths
              </button>
              <button 
                onClick={() => setTestListCategoryFilter('full_length')} 
                className={`px-2.5 py-1 rounded-md transition-all ${testListCategoryFilter === 'full_length' ? 'bg-white shadow-sm text-black' : 'text-foreground/60 hover:text-black'}`}
              >
                Full Length
              </button>
              <button 
                onClick={() => setTestListCategoryFilter('half_length')} 
                className={`px-2.5 py-1 rounded-md transition-all ${testListCategoryFilter === 'half_length' ? 'bg-white shadow-sm text-purple-700 font-bold' : 'text-foreground/60 hover:text-black'}`}
              >
                ⚡ Half Length
              </button>
              <button 
                onClick={() => setTestListCategoryFilter('custom_short')} 
                className={`px-2.5 py-1 rounded-md transition-all ${testListCategoryFilter === 'custom_short' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-foreground/60 hover:text-black'}`}
              >
                ⚡ Custom Short
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-black/5 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-black/5 p-4 bg-background/50 text-xs font-semibold text-foreground/50 uppercase tracking-widest hidden md:grid">
            <div className="col-span-4">Test Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-3">Program Format</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-black/5">
            {filteredTests.map(test => (
              <div key={test.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-background/30 transition-colors text-sm">
                <div className="col-span-4 font-semibold text-[#262626] flex items-center gap-2 flex-wrap">
                  {test.test_code && (
                    <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0">
                      {test.test_code}
                    </span>
                  )}
                  <span className="truncate">{test.title}</span>
                  {Boolean(test.is_focus_batch || test.access_tier === 'focus_batch') && (
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 border border-orange-200">
                      🎯 Focus Batch (1-Wk)
                    </span>
                  )}
                  {test.expires_at && (
                    <span className="bg-amber-50 text-amber-800 text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 border border-amber-200 inline-flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      Exp: {new Date(test.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  {test.category === 'half_length' ? (
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Half Length
                    </span>
                  ) : test.category === 'custom_short' ? (
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Custom Short
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      Full Length
                    </span>
                  )}
                </div>
                <div className="col-span-3 text-foreground/60 font-medium bg-black/5 inline-block px-2 py-1 rounded w-fit text-xs">
                  {test.program_format === 'both' ? 'Both' : test.program_format === 'masters' ? 'Masters (M.Des/CEED)' : test.program_format === 'bachelors' ? 'Bachelors (B.Des/UCEED)' : 'Unknown'}
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${test.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {test.status.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end gap-1.5 flex-wrap">
                  {test.status === 'published' && (
                    <Button variant="outline" size="sm" onClick={() => downloadAnswerKey(test.id, testTitle || test.title)} className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" title="Download Answer Key">
                      <FileDown className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openExtendModal(test)} 
                    className="h-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200 gap-1 text-xs px-2 font-medium" 
                    title="Extend Test Expiry (+1 Week / Custom)"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">+1 Wk</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditTest(test.id)} className="h-8 text-primary hover:text-primary hover:bg-primary/5 border-primary/20">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteTest(test.id)} className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredTests.length === 0 && (
              <div className="p-12 text-center text-foreground/40">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tests found in this category. Select a template above to create one.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={quickGenOpen} onOpenChange={setQuickGenOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wand2 className="w-4 h-4" />
              </span>
              Quick Generate Test
            </DialogTitle>
            <DialogDescription>
              Auto-select questions for <span className="font-semibold text-foreground">{selectedTemplate?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* 1. Target Difficulty */}
            <div>
              <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">
                Target Difficulty
              </Label>
              <select 
                className="w-full h-10 border border-black/10 rounded-xl px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={quickGenDiff} 
                onChange={e => setQuickGenDiff(e.target.value)}
              >
                <option value="ALL">Mixed Difficulty (All tiers)</option>
                <option value="Low">Low Difficulty</option>
                <option value="Medium">Medium Difficulty</option>
                <option value="High">High Difficulty</option>
              </select>
            </div>

            {/* 2. Create from PYQs */}
            <div>
              <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">
                Question Source / PYQs
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickGenSource("all")}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    quickGenSource === "all"
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                      : "border-black/10 bg-white text-foreground/60 hover:bg-black/5"
                  }`}
                >
                  <span className="block font-semibold">All Questions</span>
                  <span className="text-[10px] text-foreground/50">Entire question bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickGenSource("pyq_only")}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    quickGenSource === "pyq_only"
                      ? "border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-xs"
                      : "border-black/10 bg-white text-foreground/60 hover:bg-black/5"
                  }`}
                >
                  <span className="block font-semibold">🎯 Only PYQs</span>
                  <span className="text-[10px] text-foreground/50">Previous year papers</span>
                </button>
              </div>
            </div>

            {/* 3. Exam Tag */}
            <div>
              <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">
                Exam Tag Filter
              </Label>
              <select 
                className="w-full h-10 border border-black/10 rounded-xl px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={quickGenExamTag} 
                onChange={e => setQuickGenExamTag(e.target.value)}
              >
                <option value="ALL">Any Exam Questions</option>
                <option value="NID">NID Questions Only</option>
                <option value="CEED">CEED Questions Only</option>
                <option value="UCEED">UCEED Questions Only</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setQuickGenOpen(false)} className="rounded-xl h-10">
              Cancel
            </Button>
            <Button 
              onClick={handleQuickGenConfirm} 
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-5 shadow-md shadow-primary/20"
            >
              <Wand2 className="w-4 h-4" /> Generate & Load Mock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Extend Test Expiry Dialog */}
      <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <CalendarPlus className="w-4 h-4" />
              </span>
              Extend Test Expiry
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/60">
              Quickly extend or adjust the access window for this test without opening the full builder.
            </DialogDescription>
          </DialogHeader>

          {testToExtend && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-xl border border-black/5 space-y-1">
                <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">Test</p>
                <p className="text-sm font-bold text-[#262626] line-clamp-1">{testToExtend.title}</p>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-foreground/50">Current Expiry:</span>
                  {testToExtend.expires_at ? (
                    <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {new Date(testToExtend.expires_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-medium italic">No expiry set (Open indefinitely)</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground/70">Select Extension</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExtendPresetDays(7)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      extendPresetDays === 7 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-bold text-primary' 
                        : 'border-black/10 hover:border-black/20 text-foreground/80'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>+1 Week</span>
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded">Recommended</span>
                    </div>
                    <div className="text-[11px] text-foreground/50 mt-0.5">+7 calendar days</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExtendPresetDays(14)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      extendPresetDays === 14 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-bold text-primary' 
                        : 'border-black/10 hover:border-black/20 text-foreground/80'
                    }`}
                  >
                    <div className="text-xs font-bold">+2 Weeks</div>
                    <div className="text-[11px] text-foreground/50 mt-0.5">+14 calendar days</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExtendPresetDays(30)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      extendPresetDays === 30 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-bold text-primary' 
                        : 'border-black/10 hover:border-black/20 text-foreground/80'
                    }`}
                  >
                    <div className="text-xs font-bold">+30 Days</div>
                    <div className="text-[11px] text-foreground/50 mt-0.5">+1 full month</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExtendPresetDays('clear')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      extendPresetDays === 'clear' 
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200 font-bold text-red-700' 
                        : 'border-black/10 hover:border-black/20 text-foreground/80'
                    }`}
                  >
                    <div className="text-xs font-bold text-red-600">Clear Expiry</div>
                    <div className="text-[11px] text-foreground/50 mt-0.5">Keep open indefinitely</div>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setExtendPresetDays('custom')}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      extendPresetDays === 'custom' 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-bold text-primary' 
                        : 'border-black/10 hover:border-black/20 text-foreground/80'
                    }`}
                  >
                    <div className="text-xs font-bold">Pick Custom Date & Time</div>
                    <div className="text-[11px] text-foreground/50 mt-0.5">Specify an exact deadline</div>
                  </button>
                </div>

                {extendPresetDays === 'custom' && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <Label className="text-xs font-semibold">Custom Expiry Date</Label>
                    <Input
                      type="datetime-local"
                      value={customExtendDate}
                      onChange={(e) => setCustomExtendDate(e.target.value)}
                      className="mt-1 h-10 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Calculated preview */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs flex items-center justify-between">
                <span className="font-semibold text-amber-900">New Deadline:</span>
                <span className="font-bold text-amber-950">
                  {extendPresetDays === 'clear'
                    ? 'No Expiry (Open Indefinitely)'
                    : extendPresetDays === 'custom'
                    ? (customExtendDate ? new Date(customExtendDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Select Date')
                    : (() => {
                        const base = testToExtend.expires_at ? new Date(testToExtend.expires_at).getTime() : Date.now();
                        const next = new Date(base + (Number(extendPresetDays) || 7) * 24 * 60 * 60 * 1000);
                        return next.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                      })()
                  }
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setExtendModalOpen(false)} disabled={extendingExpiry} className="rounded-xl h-10">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExtendExpiry}
              disabled={extendingExpiry}
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-5 shadow-md shadow-primary/20 font-semibold"
            >
              <CalendarPlus className="w-4 h-4" />
              {extendingExpiry ? "Updating..." : "Save New Expiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    );
  };

  const handleQuestionsImportedFromBulk = (importedQuestions: any[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setSelectedQuestions(importedQuestions);
    } else {
      setSelectedQuestions(prev => [...prev, ...importedQuestions]);
    }
  };

  const renderBuilder = () => (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentStep('LIST')} className="text-foreground/50"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
          <div>
            <h2 className="text-xl font-semibold text-[#262626]">Build {selectedTemplate.name} Test</h2>
            <p className="text-xs text-foreground/50">{selectedTemplate.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setBulkUploadOpen(true)}
            className="gap-2 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/95 hover:to-orange-700 text-white font-bold text-xs h-9 rounded-xl shadow-md shadow-primary/20"
          >
            <Upload className="w-4 h-4" /> Bulk Upload Exam Paper
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/10 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <Label className="text-sm font-semibold">Test Title</Label>
            <Input value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder={`e.g. ${selectedTemplate.name} Mock Test 1`} className="mt-1 h-10" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Paper Code</Label>
              <button 
                type="button" 
                onClick={() => {
                  const batch = isFocusBatch ? 'FB' : 'GEN';
                  const nameLower = (selectedTemplate?.name || testTitle || '').toLowerCase();
                  let prog = 'NID';
                  if (nameLower.includes('uceed')) prog = 'UCEED';
                  else if (nameLower.includes('ceed')) prog = 'CEED';
                  else if (programFormat === 'masters') prog = 'NID-PG';
                  const half = testCategory === 'half_length' ? 'H' : '';
                  const nextNum = String(tests.length + 1).padStart(2, '0');
                  setTestCode(`${batch}-${prog}-${half}${nextNum}`);
                }}
                className="text-[11px] text-primary hover:underline font-bold"
              >
                Auto-fill
              </button>
            </div>
            <Input 
              value={testCode} 
              onChange={(e) => setTestCode(e.target.value.toUpperCase())} 
              placeholder="e.g. FB-NID-01" 
              className="mt-1 h-10 font-mono text-xs uppercase" 
            />
          </div>
          <div>
            <Label className="text-sm font-semibold">Test Category</Label>
            <select 
              className="w-full h-10 mt-1 border border-black/10 rounded-md px-3 bg-white text-sm font-medium"
              value={testCategory}
              onChange={e => setTestCategory(e.target.value)}
            >
              <option value="full_length">Full Length Mock (180 Min)</option>
              <option value="half_length">⚡ Half Length (90 Min)</option>
              <option value="custom_short">⚡ Custom Short (15-90 Min)</option>
            </select>
          </div>
          <div className="md:col-span-2">
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
          {/* Focus Batch Tagging Card */}
          <div className="md:col-span-3 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#262626]">🎯 Focus Batch Exclusive Mock</span>
                {isFocusBatch && (
                  <span className="bg-primary text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Strict 1-Week Deadline
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/60 max-w-xl">
                {isFocusBatch 
                  ? "This mock will strictly be restricted to Focus Batch accounts (and candidates who unlocked the ₹1,000 gateway). Deadlines are strictly enforced to 7 days from release."
                  : "Standard mock accessible by all registered candidates."}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Label htmlFor="focus-batch-builder-toggle" className="text-xs font-semibold cursor-pointer">
                {isFocusBatch ? "Focus Batch Enabled" : "Tag for Focus Batch"}
              </Label>
              <input 
                id="focus-batch-builder-toggle"
                type="checkbox"
                checked={isFocusBatch}
                onChange={(e) => handleFocusBatchToggle(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer rounded"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center justify-between max-w-md">
              <Label className="text-sm font-semibold">
                {isFocusBatch ? "Strict 1-Week Expiry Deadline" : "Expiry Date & Time (Optional)"}
              </Label>
              {isFocusBatch && (
                <span className="text-[11px] text-primary font-bold">Auto-Enforced 7-Day Window</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 max-w-md">
              <Input 
                type="datetime-local" 
                value={expiresAt} 
                onChange={(e) => setExpiresAt(e.target.value)} 
                className="h-10 bg-white flex-1" 
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const base = expiresAt ? new Date(expiresAt).getTime() : Date.now();
                  const next = new Date(base + 7 * 24 * 60 * 60 * 1000);
                  const localIso = new Date(next.getTime() - next.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                  setExpiresAt(localIso);
                  toast({
                    title: "Deadline Extended by 1 Week",
                    description: `New expiry set to ${next.toLocaleDateString('en-IN', { dateStyle: 'medium' })}`,
                  });
                }}
                className="h-10 text-xs font-semibold whitespace-nowrap shrink-0 border-amber-300 text-amber-800 hover:bg-amber-50 gap-1"
                title="Add 7 days from current expiry date"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                +1 Week
              </Button>
            </div>
            {isFocusBatch && (
              <p className="text-[11px] text-foreground/50 mt-1">
                ⏳ Students who do not complete this mock within this 7-day window will be marked as "Missed Deadline" to ensure rigorous cohort accountability.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {testSections.map((sec: any) => {
            const sectionQuestions = selectedQuestions.filter(q => q.part === sec.part);
            let isSectionValid = true;
            for (const [type, requiredCount] of Object.entries(sec.requirements)) {
              if (sectionQuestions.filter(q => q.type === type).length !== requiredCount) isSectionValid = false;
            }

            const isPartB = sec.part === 'B';
            const targetPartBMarks = getTargetPartBMarks(testCategory);
            const partBSum = isPartB ? getPartBTotalMarks(sectionQuestions) : 0;
            const isPartBSumMatched = isPartB ? partBSum === targetPartBMarks : true;

            return (
              <div key={sec.part} className={`border ${isSectionValid && (!isPartB || isPartBSumMatched) ? 'border-green-300' : 'border-black/10'} rounded-xl overflow-hidden`}>
                <div className={`p-4 flex flex-col md:flex-row md:items-center justify-between border-b gap-4 ${isSectionValid && (!isPartB || isPartBSumMatched) ? 'bg-green-50 border-green-200' : 'bg-background border-black/10'}`}>
                  <div>
                    <h3 className="font-semibold text-[#262626] flex items-center gap-2">
                      Part {sec.part} Section {isSectionValid && (!isPartB || isPartBSumMatched) && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-foreground/60 font-medium">
                        <Clock className="w-3.5 h-3.5 text-primary" /> Duration:
                        <Input type="number" min="1" value={sec.duration} onChange={e => updateSectionDuration(sec.part, parseInt(e.target.value) || 1)} className="w-16 h-7 text-xs px-2 text-center bg-white" />
                        Min
                      </div>
                      <span className="text-black/20">|</span>
                      <div className="flex items-center gap-2 text-xs text-foreground/60 font-medium flex-wrap">
                        <span>Requirements:</span>
                        {Object.entries(sec.requirements).map(([t, count]) => (
                          <div key={t} className="flex items-center gap-1 bg-white px-2 py-0.5 border border-black/10 rounded shadow-xs">
                            <span className="font-bold text-primary">{t}:</span>
                            <input 
                              type="number" 
                              min="0" 
                              value={count as number} 
                              onChange={e => updateRequirementCount(sec.part, t, parseInt(e.target.value) || 0)} 
                              className="w-10 h-5 text-xs text-center border-0 focus:outline-none bg-transparent font-semibold"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {isPartB && (
                      <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-black/5 flex-wrap">
                        <span className="text-xs font-semibold text-foreground/70">Part B Marks Total:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black transition-colors ${
                          isPartBSumMatched 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {partBSum} / {targetPartBMarks} Marks
                        </span>
                        {!isPartBSumMatched && (
                          <span className="text-[11px] text-amber-700 font-medium">
                            (Paper requires exactly {targetPartBMarks} marks)
                          </span>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => distributePartBMarks()} 
                          className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10 font-bold ml-auto gap-1"
                          title={`Split ${targetPartBMarks} marks evenly among Part B questions`}
                        >
                          <Sparkles className="w-3 h-3" /> Auto-Distribute Evenly ({targetPartBMarks}M)
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openCreateQuestion(sec.part)} 
                      className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Create Question
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => openPicker(sec)} 
                      className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 h-8 text-xs font-semibold"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> From Bank
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white min-h-[100px]">
                  {sectionQuestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-foreground/30 py-6">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Click "+ Create Question" or "From Bank" to populate this section.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sectionQuestions.map((q, idx) => (
                        <div key={q.id} className="flex items-center justify-between p-3 border border-black/5 rounded-lg text-sm bg-background/50">
                          <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                            <span className="font-semibold text-foreground/40 w-6 shrink-0">{idx + 1}.</span>
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-bold shrink-0">{q.type}</span>
                            <span className="text-foreground/80 line-clamp-1 max-w-xl break-words whitespace-normal [&_p]:inline [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml((q.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>')) }}></span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isPartB && (
                              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-black/10 shadow-xs">
                                <span className="text-[10px] font-bold text-foreground/60 uppercase">Marks:</span>
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={q.marks ?? ''} 
                                  onChange={(e) => { 
                                    const val = parseInt(e.target.value, 10); 
                                    setSelectedQuestions(prev => prev.map(sq => sq.id === q.id ? { ...sq, marks: isNaN(val) ? '' : Math.max(1, val) } : sq)); 
                                  }} 
                                  className="w-12 h-6 text-xs font-bold text-center border-0 focus:outline-none bg-transparent" 
                                  placeholder="Marks"
                                />
                              </div>
                            )}

                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:bg-red-50" onClick={() => toggleQuestionSelection(q)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
              <p className="text-xs text-foreground/50">
                {selectedQuestions.length} Total Questions | {testSections.reduce((acc, s) => acc + s.duration, 0)} Min
                {selectedQuestions.some(q => q.part === 'B') && (
                  <span className="ml-2 font-bold text-primary">
                    • Part B Total: {getPartBTotalMarks()} / {getTargetPartBMarks()} Marks
                  </span>
                )}
              </p>
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

              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">Part {currentQ.part}</span>
                <span className="bg-black/5 text-foreground/70 px-2 py-1 rounded text-xs font-bold">{currentQ.type}</span>
                {currentQ.pyq_tag && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">{currentQ.pyq_tag}</span>}
                {currentQ.part === 'B' && (
                  <div className="flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/20 px-2.5 py-1 rounded text-xs font-bold ml-auto">
                    <span>Marks:</span>
                    <input
                      type="number"
                      min="1"
                      value={currentQ.marks ?? ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setSelectedQuestions(prev => prev.map(sq => sq.id === currentQ.id ? { ...sq, marks: isNaN(val) ? '' : Math.max(1, val) } : sq));
                      }}
                      className="w-14 h-6 text-center font-bold bg-white text-[#262626] border border-primary/30 rounded px-1"
                    />
                  </div>
                )}
              </div>

              <div className="text-lg text-[#262626] font-medium leading-relaxed mb-8 flex items-start w-full overflow-hidden">
                <span className="font-bold mr-2 shrink-0">Q{previewIndex + 1}.</span>
                <div className="break-words whitespace-normal w-full min-w-0 [&_p]:mb-4 last:[&_p]:mb-0 [&_p:empty]:h-6 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml((currentQ.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>')) }}></div>
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
      if (pickerDiffFilter !== "ALL" && q.difficulty !== pickerDiffFilter) return false;
      if (pickerTopicFilter && !q.topics?.some((t: any) => t.toLowerCase().includes(pickerTopicFilter.toLowerCase()))) return false;
      if (pickerPyqOnly && !q.pyq_tag) return false;
      if (pickerExamTagFilter !== "ALL") {
        const tagUpper = pickerExamTagFilter.toUpperCase();
        const hasTagInPyq = (q.pyq_tag || '').toUpperCase().includes(tagUpper);
        const hasTagInTopics = q.topics?.some((t: any) => t.toUpperCase().includes(tagUpper));
        const hasTagInContent = (q.content_text || '').toUpperCase().includes(tagUpper);
        if (!hasTagInPyq && !hasTagInTopics && !hasTagInContent) return false;
      }
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const contentMatch = q.content_text?.toLowerCase().includes(queryLower);
        const topicMatch = q.topics?.some((t: any) => t.toLowerCase().includes(queryLower));
        const pyqMatch = (q.pyq_tag || '').toLowerCase().includes(queryLower);
        if (!contentMatch && !topicMatch && !pyqMatch) return false;
      }
      return true;
    });

    return (
      <Dialog open={pickerOpen} onOpenChange={(open) => !open && setPickerOpen(false)}>
        <DialogContent className="max-w-[85vw] w-[85vw] h-[88vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-6 border-b border-black/5 shrink-0 bg-background/80 backdrop-blur-sm z-10">
            <DialogTitle className="text-2xl font-semibold text-[#262626]">
              {replacingQuestionId ? `Replace Question (Part ${pickerSection?.part})` : `Select Questions for Part ${pickerSection?.part}`}
            </DialogTitle>
            <DialogDescription className="mt-2 text-foreground/60 text-sm">
              {replacingQuestionId ? "Select a new question to swap into this slot. Already selected questions are highlighted in green and disabled." : "Select the exact number of questions required to complete this section."}
            </DialogDescription>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
              {/* Requirements Chips */}
              <div className="flex flex-wrap gap-2.5 items-center">
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
                          className={`cursor-pointer px-3.5 py-1.5 rounded-lg border-2 flex items-center gap-2 transition-all ${pickerTypeFilter === type ? 'ring-2 ring-primary/20 shadow-xs' : 'opacity-85'
                            } ${isMet ? 'border-green-500 bg-green-50 text-green-700 font-bold' :
                              isOver ? 'border-red-400 bg-red-50 text-red-700 font-bold' : 'border-primary/30 bg-white text-[#262626]'
                            }`}
                        >
                          <span className="font-bold text-xs">{type}</span>
                          <span className="text-[11px] bg-white/70 px-2 py-0.5 rounded-full font-bold">{req.selected} / {req.required}</span>
                          {isMet && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                        </div>
                      );
                    })}
                    <Button variant="ghost" size="sm" onClick={() => setPickerTypeFilter("ALL")} className={`h-9 text-xs border ${pickerTypeFilter === 'ALL' ? 'border-black/30 bg-black/5 font-bold' : 'border-transparent'}`}>All Types</Button>
                  </>
                )}
              </div>

              {/* Search, Exam Tag, Difficulty, PYQ & Auto-Fill */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select 
                  className="h-9 text-xs border border-black/10 rounded-lg px-2.5 bg-white font-medium outline-none shadow-xs"
                  value={pickerExamTagFilter}
                  onChange={(e) => setPickerExamTagFilter(e.target.value)}
                >
                  <option value="ALL">All Exams</option>
                  <option value="NID">NID</option>
                  <option value="CEED">CEED</option>
                  <option value="UCEED">UCEED</option>
                </select>

                <Button
                  type="button"
                  variant={pickerPyqOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPickerPyqOnly(!pickerPyqOnly)}
                  className={`h-9 text-xs px-2.5 rounded-lg border font-medium transition-colors ${pickerPyqOnly ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600' : 'bg-white text-foreground/70 border-black/10'}`}
                >
                  {pickerPyqOnly ? '🎯 PYQs Only' : 'All Sources'}
                </Button>

                <select 
                  className="h-9 text-xs border border-black/10 rounded-lg px-2.5 bg-white font-medium outline-none shadow-xs"
                  value={pickerDiffFilter}
                  onChange={(e) => setPickerDiffFilter(e.target.value)}
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <Input 
                  placeholder="Filter topic..." 
                  value={pickerTopicFilter} 
                  onChange={(e) => setPickerTopicFilter(e.target.value)} 
                  className="h-9 text-xs bg-white w-28 shadow-xs" 
                />

                {!replacingQuestionId && (
                  <div className="flex items-center border border-black/10 rounded-lg bg-white px-2 h-9 shadow-xs">
                    <span className="text-[11px] text-foreground/50 mr-1.5 font-medium">Auto-Fill:</span>
                    <select className="text-xs bg-transparent outline-none pr-1 font-semibold text-[#262626]" value={autoDifficulty} onChange={(e) => setAutoDifficulty(e.target.value)}>
                      <option value="ALL">Any Diff</option>
                      <option value="Low">Low Diff</option>
                      <option value="Medium">Medium Diff</option>
                      <option value="High">High Diff</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={autoFillSectionFromPicker} className="h-6 ml-1.5 text-[11px] px-2.5 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20">Fill</Button>
                  </div>
                )}

                <div className="relative w-40 shadow-xs rounded-lg">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <Input placeholder="Search text/PYQ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9 text-xs bg-white" />
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setPickerOpen(false);
                    openCreateQuestion(pickerSection?.part || 'A');
                  }}
                  className="h-9 text-xs px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold gap-1 shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> + New Question
                </Button>
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
                            {cleanPlainText(q.content_text)}
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

  const renderCreateQuestionModal = () => (
    <Dialog open={createQModalOpen} onOpenChange={setCreateQModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="w-4 h-4" />
            </span>
            Create New Question (Part {createQPart})
          </DialogTitle>
          <DialogDescription>
            This question will be saved into the central Question Bank and immediately attached to this test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Section Part & Type Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">Part</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateQPart('A');
                    setCreateQType('MCQ');
                  }}
                  className={`flex-1 h-9 rounded-lg border text-xs font-bold transition-all ${
                    createQPart === 'A' ? 'bg-primary text-white border-primary shadow-xs' : 'bg-background hover:bg-black/5 text-[#262626]'
                  }`}
                >
                  Part A (Objective)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateQPart('B');
                    setCreateQType('SUBJECTIVE');
                  }}
                  className={`flex-1 h-9 rounded-lg border text-xs font-bold transition-all ${
                    createQPart === 'B' ? 'bg-primary text-white border-primary shadow-xs' : 'bg-background hover:bg-black/5 text-[#262626]'
                  }`}
                >
                  Part B (Subjective)
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">Question Type</Label>
              {createQPart === 'B' ? (
                <div className="h-9 px-3 rounded-lg border border-black/10 bg-black/5 text-xs font-bold flex items-center text-[#262626]">
                  SUBJECTIVE (Design / Sketching Prompt)
                </div>
              ) : (
                <select
                  value={createQType}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setCreateQType(t);
                    if (t === 'NAT') {
                      setCreateQOptions([{ content_text: '', is_correct: true }]);
                    } else if (createQOptions.length < 4) {
                      setCreateQOptions([
                        { content_text: '', is_correct: false },
                        { content_text: '', is_correct: false },
                        { content_text: '', is_correct: false },
                        { content_text: '', is_correct: false }
                      ]);
                    }
                  }}
                  className="w-full h-9 rounded-lg border border-black/10 px-3 bg-white text-xs font-semibold outline-none"
                >
                  <option value="MCQ">MCQ (Multiple Choice - 1 Correct)</option>
                  <option value="MSQ">MSQ (Multiple Select - Multiple Correct)</option>
                  <option value="NAT">NAT (Numerical Answer Type)</option>
                </select>
              )}
            </div>
          </div>

          {/* Difficulty & PYQ Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">Difficulty</Label>
              <select
                value={createQDifficulty}
                onChange={(e) => setCreateQDifficulty(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-black/10 px-3 bg-white text-xs font-semibold outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">PYQ / Exam Tag (Optional)</Label>
              <Input
                placeholder="e.g. CEED 2024 or Practice"
                value={createQPyqTag}
                onChange={(e) => setCreateQPyqTag(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Part B Marks Allotment */}
          {createQPart === 'B' && (
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Marks Allotted for this Question:
                </Label>
                <span className="text-[11px] text-foreground/60">
                  Target Total: {getTargetPartBMarks()} Marks
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  value={createQMarks}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCreateQMarks(isNaN(val) ? ('' as any) : Math.max(1, val));
                  }}
                  className="h-9 text-sm font-bold bg-white text-center w-28 border-primary/30"
                  placeholder="20"
                />
                <p className="text-[11px] text-foreground/60 leading-tight">
                  Must be strictly greater than 0. The total for all Part B questions will sum to {getTargetPartBMarks()} marks.
                </p>
              </div>
            </div>
          )}

          {/* Content Textarea */}
          <div>
            <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">
              {createQPart === 'B' ? "Subjective Question Prompt / Brief" : "Question Text"}
            </Label>
            <Textarea
              placeholder={createQPart === 'B' ? "Describe the design problem, user scenario, sketching requirements..." : "Type the question statement here..."}
              value={createQContent}
              onChange={(e) => setCreateQContent(e.target.value)}
              className="min-h-[90px] text-xs font-medium"
            />
          </div>

          {/* Media / Diagram Upload */}
          <div>
            <Label className="text-xs font-bold text-foreground/70 mb-1.5 block flex items-center justify-between">
              <span>Reference Diagram / Media (Optional)</span>
              {createQMediaFile && (
                <button
                  type="button"
                  onClick={() => {
                    setCreateQMediaFile(null);
                    setCreateQMediaPreview(null);
                  }}
                  className="text-red-500 hover:underline text-[11px]"
                >
                  Remove Image
                </button>
              )}
            </Label>
            {createQMediaPreview ? (
              <div className="relative border rounded-xl overflow-hidden p-2 bg-background/50 flex items-center gap-3">
                <img src={createQMediaPreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border" />
                <span className="text-xs text-foreground/60 truncate">{createQMediaFile?.name}</span>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-black/10 rounded-xl p-3 bg-background/30 hover:bg-black/5 cursor-pointer text-xs text-foreground/60 transition-colors">
                <Upload className="w-4 h-4 text-primary" />
                <span>Upload sketch or question diagram (PNG, JPG)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setCreateQMediaFile(f);
                      setCreateQMediaPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Topics */}
          <div>
            <Label className="text-xs font-bold text-foreground/70 mb-1.5 block">Topics (Comma separated)</Label>
            <Input
              placeholder="e.g. Sketching, Spatial Design, Perspective"
              value={createQTopics}
              onChange={(e) => setCreateQTopics(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Part A Options Section */}
          {createQPart === 'A' && (
            <div className="pt-2 border-t border-black/10 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground/80">
                  {createQType === 'NAT' ? "Numerical Answer Key" : "Options (Check the correct answer)"}
                </Label>
                <span className="text-[11px] text-foreground/50">
                  {createQType === 'MCQ' ? "Select exactly 1 correct" : createQType === 'MSQ' ? "Select all correct options" : "Exact match or range"}
                </span>
              </div>

              {createQType === 'NAT' ? (
                <div>
                  <Input
                    placeholder="e.g. 14.5 or 14-16"
                    value={createQOptions[0]?.content_text || ''}
                    onChange={(e) => {
                      setCreateQOptions([{ content_text: e.target.value, is_correct: true }]);
                    }}
                    className="h-9 text-xs font-bold"
                  />
                  <p className="text-[10px] text-foreground/50 mt-1">
                    Enter the numerical value (e.g. 24) or range (e.g. 23.5-24.5).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {createQOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type={createQType === 'MCQ' ? 'radio' : 'checkbox'}
                        name="correct_option"
                        checked={opt.is_correct}
                        onChange={(e) => {
                          if (createQType === 'MCQ') {
                            setCreateQOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === idx })));
                          } else {
                            setCreateQOptions(prev => prev.map((o, i) => i === idx ? { ...o, is_correct: e.target.checked } : o));
                          }
                        }}
                        className="w-4 h-4 text-primary cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <span className="text-xs font-bold text-foreground/60 w-5">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
                        value={opt.content_text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCreateQOptions(prev => prev.map((o, i) => i === idx ? { ...o, content_text: val } : o));
                        }}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/10">
          <Button variant="outline" onClick={() => setCreateQModalOpen(false)} disabled={createQSaving} className="rounded-xl h-9 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleCreateQuestionSubmit}
            disabled={createQSaving}
            className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-9 px-5 text-xs shadow-md shadow-primary/20"
          >
            {createQSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save to Bank & Add to Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {currentStep === 'LIST' && renderList()}
      {currentStep === 'BUILDER' && (
        <>
          {renderBuilder()}
          {renderCreateQuestionModal()}
        </>
      )}
      {currentStep === 'PREVIEW' && (
        <>
          {renderPreview()}
          {renderPickerModal()}
          {renderCreateQuestionModal()}
        </>
      )}

      {/* Bulk Exam Paper Uploader */}
      <BulkExamUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        testSections={testSections}
        testCategory={testCategory}
        selectedTemplate={selectedTemplate}
        onQuestionsImported={handleQuestionsImportedFromBulk}
      />
    </>
  );
}
