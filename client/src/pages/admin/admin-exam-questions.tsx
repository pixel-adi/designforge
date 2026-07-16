import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileQuestion, Trash2, PlusCircle, Save, Loader2, Image as ImageIcon, X, CheckCircle2, Download, Upload, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Papa from "papaparse";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface Question {
  id: string;
  type: 'MCQ' | 'MSQ' | 'NAT' | 'SUBJECTIVE';
  part: 'A' | 'B';
  difficulty: 'Low' | 'Medium' | 'High';
  content_text: string;
  media_url?: string;
  topics: string[];
  pyq_tag?: string;
}

interface OptionInput {
  id?: string;
  content_text: string;
  media_url?: string;
  is_correct: boolean;
  file?: File | null;
}

const emptyQuestion: Omit<Question, "id"> = {
  type: 'MCQ',
  part: 'A',
  difficulty: 'Medium',
  content_text: '',
  topics: [],
  pyq_tag: ''
};

const sampleQuestion: Question = {
  id: 'sample-123',
  part: 'A',
  type: 'MCQ',
  difficulty: 'High',
  content_text: '[SAMPLE PREVIEW] Identify the perspective used in the given drawing. Which vanishing points apply?',
  topics: ['Perspective', 'Spatial Ability'],
  pyq_tag: 'CEED 2023',
};

function LocalImagePreview({ file, alt, className }: { file: File; alt: string; className?: string }) {
  const [src, setSrc] = useState<string>("");
  
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  
  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
}

const normalizeText = (text: string) => {
  return text.replace(/<[^>]*>/g, '').replace(/(?:&nbsp;|\u00A0|\s)+/g, ' ').trim().toLowerCase();
};

export default function AdminExamQuestions() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newQuestion, setNewQuestion] = useState<Omit<Question, "id">>(emptyQuestion);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);
  const [topicsInput, setTopicsInput] = useState("");
  
  // Media State
  const [questionMediaFile, setQuestionMediaFile] = useState<File | null>(null);
  const [questionMediaPreview, setQuestionMediaPreview] = useState<string | null>(null);

  // Options State
  const [options, setOptions] = useState<OptionInput[]>([]);

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);

  // Filters & State
  const [filterPart, setFilterPart] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTopic, setSearchTopic] = useState<string>("");
  const [hideSample, setHideSample] = useState<boolean>(false);

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [bulkImagesMap, setBulkImagesMap] = useState<Map<string, File>>(new Map());
  const [bulkQuestions, setBulkQuestions] = useState<any[]>([]);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkFilterType, setBulkFilterType] = useState<string>("ALL");

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase.from("exam_questions").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error fetching questions", description: error.message, variant: "destructive" });
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  };

  const fetchOptionsForEdit = async (questionId: string) => {
    const { data } = await supabase.from("exam_options").select("*").eq("question_id", questionId);
    if (data) {
      setOptions(data.map(opt => ({
        id: opt.id,
        content_text: opt.content_text || '',
        media_url: opt.media_url,
        is_correct: opt.is_correct
      })));
    }
  };

  const handleQuestionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQuestionMediaFile(file);
      setQuestionMediaPreview(URL.createObjectURL(file));
    }
  };

  const uploadFileToSupabase = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('question-media').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('question-media').getPublicUrl(fileName);
    return publicUrl;
  };

  const addOption = () => {
    setOptions([...options, { content_text: '', is_correct: newQuestion.type === 'NAT' ? true : false }]);
  };

  const updateOption = (index: number, field: keyof OptionInput, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const updateOptionFile = (index: number, file: File | null) => {
    const newOptions = [...options];
    newOptions[index].file = file;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const triggerPreview = () => {
    if (!newQuestion.content_text.trim()) {
      toast({ title: "Validation Error", description: "Question content is required.", variant: "destructive" });
      return;
    }
    if ((newQuestion.type === 'MCQ' || newQuestion.type === 'MSQ') && options.length < 2) {
      toast({ title: "Validation Error", description: "MCQ/MSQ requires at least 2 options.", variant: "destructive" });
      return;
    }
    if (newQuestion.type === 'MCQ' && options.filter(o => o.is_correct).length !== 1) {
      toast({ title: "Validation Error", description: "MCQ requires exactly 1 correct option.", variant: "destructive" });
      return;
    }
    if (newQuestion.type === 'NAT' && options.length < 1) {
      toast({ title: "Validation Error", description: "NAT requires at least 1 acceptable answer.", variant: "destructive" });
      return;
    }
    setPreviewOpen(true);
  };

  const confirmAndSave = async () => {
    setSavingNew(true);
    try {
      let finalQuestionMediaUrl = newQuestion.media_url;

      if (questionMediaFile) {
        finalQuestionMediaUrl = await uploadFileToSupabase(questionMediaFile);
      }

      const formattedTopics = topicsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const questionToSave = { 
        ...newQuestion, 
        topics: formattedTopics,
        media_url: finalQuestionMediaUrl
      };
      
      let finalQuestionId = editingId;

      if (editingId) {
        const { error } = await supabase.from("exam_questions").update(questionToSave).eq("id", editingId);
        if (error) throw error;
        
        await supabase.from("exam_options").delete().eq("question_id", editingId);
      } else {
        const { data, error } = await supabase.from("exam_questions").insert(questionToSave).select().single();
        if (error) throw error;
        finalQuestionId = data.id;
      }

      if ((newQuestion.type === 'MCQ' || newQuestion.type === 'MSQ' || newQuestion.type === 'NAT') && finalQuestionId) {
        for (const opt of options) {
          let optMediaUrl = opt.media_url;
          if (opt.file) {
            optMediaUrl = await uploadFileToSupabase(opt.file);
          }
          await supabase.from("exam_options").insert({
            question_id: finalQuestionId,
            content_text: opt.content_text,
            media_url: optMediaUrl,
            is_correct: opt.is_correct
          });
        }
      }
      
      toast({ title: "Success", description: "Question saved successfully!" });
      cancelEdit();
      await fetchQuestions();
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } finally {
      setSavingNew(false);
      setPreviewOpen(false);
    }
  };

  const editQuestion = (q: Question) => {
    setEditingId(q.id === 'sample-123' ? null : q.id); // Sample edits become a new question
    setNewQuestion({
      type: q.type,
      part: q.part,
      difficulty: q.difficulty,
      content_text: q.content_text,
      media_url: q.media_url,
      topics: q.topics,
      pyq_tag: q.pyq_tag
    });
    setTopicsInput(q.topics ? q.topics.join(', ') : '');
    setQuestionMediaPreview(q.media_url || null);
    setQuestionMediaFile(null);
    if (q.id !== 'sample-123') {
      fetchOptionsForEdit(q.id);
    } else {
      setOptions([]); // Or you could mock options for the sample here if you wanted
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewQuestion(emptyQuestion);
    setTopicsInput("");
    setOptions([]);
    setQuestionMediaFile(null);
    setQuestionMediaPreview(null);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    if (id === 'sample-123') {
      setHideSample(true);
      toast({ title: "Sample removed" });
      return;
    }
    
    const { error } = await supabase.from("exam_questions").delete().eq("id", id);
    if (error) {
      toast({ title: "Deletion failed", description: error.message, variant: "destructive" });
    } else {
      setQuestions(questions.filter(q => q.id !== id));
      toast({ title: "Question deleted" });
    }
  };

  // Bulk Upload Logic
  const downloadSampleCSV = () => {
    const headers = "Part,Type,Difficulty,Content Text,Topics (comma separated),PYQ Tag,Question Image,Option 1,Is Correct 1,Option Image 1,Option 2,Is Correct 2,Option Image 2,Option 3,Is Correct 3,Option Image 3,Option 4,Is Correct 4,Option Image 4\n";
    const row1 = 'A,MCQ,Medium,"What perspective is shown here?","Perspective, Spatial Theory",CEED 2024,perspective_q1.png,"Option A",FALSE,, "Option B",TRUE,opt_b.jpg,"Option C",FALSE,,"Option D",FALSE,\n';
    const row2 = 'B,SUBJECTIVE,High,"Sketch a traditional kitchen scene showing perspective.","Sketching, Drawing",NID 2023,,,,,,,,,,,,,\n';
    const csvContent = "data:text/csv;charset=utf-8," + headers + row1 + row2;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "designforge_questions_sample.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkImagesMap(new Map()); // Reset images map since this is text-only CSV upload

    // Fetch existing questions to check for duplicates
    let existingMap = new Map<string, string>();
    try {
      const { data, error } = await supabase.from("exam_questions").select("id, content_text");
      if (error) throw error;
      if (data) {
        data.forEach(q => {
          existingMap.set(normalizeText(q.content_text || ""), q.id);
        });
      }
    } catch (err: any) {
      toast({ title: "Failed to check duplicates", description: err.message, variant: "destructive" });
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any, index) => {
          const opts = [];
          for (let i = 1; i <= 4; i++) {
            if (row[`Option ${i}`]) {
              opts.push({
                content_text: row[`Option ${i}`],
                is_correct: row[`Is Correct ${i}`]?.toUpperCase() === 'TRUE',
                media_filename: "",
                media_exists: true
              });
            }
          }
          const rawDiff = (row['Difficulty'] || 'Medium').toLowerCase().trim();
          let finalDiff = 'Medium';
          if (rawDiff === 'easy' || rawDiff === 'low') finalDiff = 'Low';
          if (rawDiff === 'hard' || rawDiff === 'high') finalDiff = 'High';
          
          const content = row['Content Text'] || '';
          const norm = normalizeText(content);
          const existingId = existingMap.get(norm);
          const isDuplicate = !!existingId;

          return {
            _tempId: `bulk-${index}`,
            part: row['Part'] || 'A',
            type: row['Type'] || 'MCQ',
            difficulty: finalDiff,
            content_text: content,
            topics: row['Topics (comma separated)'] ? row['Topics (comma separated)'].split(',').map((t:string) => t.trim()) : [],
            pyq_tag: row['PYQ Tag'] || '',
            options: opts,
            media_filename: "",
            media_exists: true,
            is_duplicate: isDuplicate,
            existing_id: existingId || null,
            duplicate_action: isDuplicate ? 'skip' : 'create', // 'skip', 'overwrite', 'create'
            status: 'pending' // 'pending', 'approved', 'rejected'
          };
        });
        setBulkQuestions(parsed);
        setBulkPreviewOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Find the single CSV file inside the folder
    const csvFile = fileArray.find(f => f.name.toLowerCase().endsWith(".csv"));
    if (!csvFile) {
      toast({ 
        title: "CSV File Not Found", 
        description: "Please make sure your folder contains a single .csv file with the question data.", 
        variant: "destructive" 
      });
      if (folderInputRef.current) folderInputRef.current.value = '';
      return;
    }

    // Build the strictly matched images map (png, jpg, jpeg, webp, gif)
    const allowedExtensions = ["png", "jpg", "jpeg", "webp", "gif"];
    const imageMap = new Map<string, File>();
    fileArray.forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || "";
      if (allowedExtensions.includes(ext)) {
        imageMap.set(f.name, f);
      }
    });

    setBulkImagesMap(imageMap);

    // Fetch existing questions to check for duplicates
    let existingMap = new Map<string, string>();
    try {
      const { data, error } = await supabase.from("exam_questions").select("id, content_text");
      if (error) throw error;
      if (data) {
        data.forEach(q => {
          existingMap.set(normalizeText(q.content_text || ""), q.id);
        });
      }
    } catch (err: any) {
      toast({ title: "Failed to check duplicates", description: err.message, variant: "destructive" });
    }

    // Parse the folder's CSV file
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any, index) => {
          const opts = [];
          
          const checkImage = (filename?: string) => {
            if (!filename) return { name: "", exists: true }; // blank is fine (no image)
            const cleanName = filename.trim();
            if (!cleanName) return { name: "", exists: true };
            const exists = imageMap.has(cleanName);
            return { name: cleanName, exists };
          };

          const qImage = checkImage(row['Question Image']);
          
          for (let i = 1; i <= 4; i++) {
            if (row[`Option ${i}`]) {
              const optImage = checkImage(row[`Option Image ${i}`]);
              opts.push({
                content_text: row[`Option ${i}`],
                is_correct: row[`Is Correct ${i}`]?.toUpperCase() === 'TRUE',
                media_filename: optImage.name,
                media_exists: optImage.exists
              });
            }
          }
          const rawDiff = (row['Difficulty'] || 'Medium').toLowerCase().trim();
          let finalDiff = 'Medium';
          if (rawDiff === 'easy' || rawDiff === 'low') finalDiff = 'Low';
          if (rawDiff === 'hard' || rawDiff === 'high') finalDiff = 'High';
          
          const content = row['Content Text'] || '';
          const norm = normalizeText(content);
          const existingId = existingMap.get(norm);
          const isDuplicate = !!existingId;

          return {
            _tempId: `bulk-${index}`,
            part: row['Part'] || 'A',
            type: row['Type'] || 'MCQ',
            difficulty: finalDiff,
            content_text: content,
            topics: row['Topics (comma separated)'] ? row['Topics (comma separated)'].split(',').map((t:string) => t.trim()) : [],
            pyq_tag: row['PYQ Tag'] || '',
            options: opts,
            media_filename: qImage.name,
            media_exists: qImage.exists,
            is_duplicate: isDuplicate,
            existing_id: existingId || null,
            duplicate_action: isDuplicate ? 'skip' : 'create', // 'skip', 'overwrite', 'create'
            status: 'pending' // 'pending', 'approved', 'rejected'
          };
        });
        setBulkQuestions(parsed);
        setBulkPreviewOpen(true);
        if (folderInputRef.current) folderInputRef.current.value = '';
      }
    });
  };

  const toggleBulkStatus = (id: string, newStatus: 'approved' | 'rejected') => {
    setBulkQuestions(bulkQuestions.map(q => q._tempId === id ? { ...q, status: newStatus } : q));
  };

  const toggleBulkSelection = (id: string) => {
    setBulkSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAction = (action: 'approved' | 'rejected') => {
    setBulkQuestions(bq => bq.map(q => bulkSelectedIds.includes(q._tempId) ? { ...q, status: action } : q));
    setBulkSelectedIds([]); // clear selection after action
  };

  const updateDuplicateAction = (id: string, action: 'skip' | 'overwrite' | 'create') => {
    setBulkQuestions(bulkQuestions.map(q => q._tempId === id ? { ...q, duplicate_action: action } : q));
  };

  const filteredBulkQuestions = bulkQuestions.filter(q => bulkFilterType === "ALL" || q.type === bulkFilterType);

  const saveApprovedBulkQuestions = async () => {
    setIsUploadingBulk(true);
    // Filter questions that are approved AND NOT marked as duplicate-skip
    const approved = bulkQuestions.filter(q => q.status === 'approved' && q.duplicate_action !== 'skip');
    if (approved.length === 0) {
      toast({ title: "Nothing to save", description: "No approved questions to save (or duplicates were skipped)." });
      setIsUploadingBulk(false);
      return;
    }

    // Block saving if any approved question contains referenced but missing images
    const hasMissingImages = approved.some(q => 
      (!q.media_exists) || 
      q.options.some((opt: any) => !opt.media_exists)
    );

    if (hasMissingImages) {
      toast({ 
        title: "Validation Error", 
        description: "Some approved questions reference missing images. Please reject them or upload the correct files before saving.", 
        variant: "destructive" 
      });
      setIsUploadingBulk(false);
      return;
    }
    
    try {
      // 1. Gather all unique files that need to be uploaded
      const filesToUpload = new Set<string>();
      approved.forEach(q => {
        if (q.media_filename && bulkImagesMap.has(q.media_filename)) {
          filesToUpload.add(q.media_filename);
        }
        q.options.forEach((opt: any) => {
          if (opt.media_filename && bulkImagesMap.has(opt.media_filename)) {
            filesToUpload.add(opt.media_filename);
          }
        });
      });

      // 2. Upload all files in parallel
      const uploadedUrls = new Map<string, string>();
      if (filesToUpload.size > 0) {
        const uploadPromises = Array.from(filesToUpload).map(async (filename) => {
          const file = bulkImagesMap.get(filename)!;
          const publicUrl = await uploadFileToSupabase(file);
          return { filename, publicUrl };
        });
        const uploadResults = await Promise.all(uploadPromises);
        uploadResults.forEach(r => uploadedUrls.set(r.filename, r.publicUrl));
      }

      // 3. Separate questions into inserts and overwrites (upserts)
      const approvedWithIds = approved.map(q => {
        const dbId = q.duplicate_action === 'overwrite' ? q.existing_id : crypto.randomUUID();
        return {
          ...q,
          db_id: dbId
        };
      });

      const idsToOverwrite = approvedWithIds
        .filter(q => q.duplicate_action === 'overwrite')
        .map(q => q.db_id);

      // 4. Delete old options for overridden questions (1 DB call)
      if (idsToOverwrite.length > 0) {
        const { error: optDelErr } = await supabase.from('exam_options').delete().in('question_id', idsToOverwrite);
        if (optDelErr) throw optDelErr;
      }

      const questionsToUpsert = approvedWithIds.map(q => ({
        id: q.db_id,
        part: q.part,
        type: q.type,
        difficulty: q.difficulty,
        content_text: q.content_text,
        topics: q.topics,
        pyq_tag: q.pyq_tag,
        media_url: q.media_filename ? (uploadedUrls.get(q.media_filename) || null) : null
      }));

      // 5. Bulk upsert questions (inserts new ones and updates overwriting ones in 1 DB call)
      const { error: qErr } = await supabase.from('exam_questions').upsert(questionsToUpsert);
      if (qErr) throw qErr;

      // 6. Flatten new options with matched question_id and prepare for insert
      const optionsToInsert: any[] = [];
      approvedWithIds.forEach(q => {
        if ((q.type === 'MCQ' || q.type === 'MSQ') && q.options.length > 0) {
          q.options.forEach((opt: any) => {
            optionsToInsert.push({
              question_id: q.db_id,
              content_text: opt.content_text,
              is_correct: opt.is_correct,
              media_url: opt.media_filename ? (uploadedUrls.get(opt.media_filename) || null) : null
            });
          });
        }
      });

      // 7. Bulk insert options (1 DB call)
      if (optionsToInsert.length > 0) {
        const { error: optErr } = await supabase.from('exam_options').insert(optionsToInsert);
        if (optErr) throw optErr;
      }

      toast({ title: "Bulk Upload Successful", description: `${approved.length} questions saved.` });
      setBulkPreviewOpen(false);
      setBulkQuestions([]);
      setBulkImagesMap(new Map());
      fetchQuestions();
    } catch (err: any) {
      toast({ title: "Bulk Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (filterPart !== "ALL" && q.part !== filterPart) return false;
    if (filterType !== "ALL" && q.type !== filterType) return false;
    if (searchTopic && !q.topics?.some(t => t.toLowerCase().includes(searchTopic.toLowerCase()))) return false;
    return true;
  });

  const displayQuestions = questions.length > 0 ? filteredQuestions : (hideSample ? [] : [sampleQuestion]);

  if (loading) return <div className="flex items-center justify-center py-20 text-foreground/40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Exam Questions Repository</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Manage Part A and Part B questions, media, and bulk uploads.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSampleCSV} className="gap-2 text-xs h-9">
            <Download className="w-4 h-4" /> Sample CSV
          </Button>
          <div className="relative">
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs h-9 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
              <Upload className="w-4 h-4" /> Bulk Upload CSV
            </Button>
          </div>
          <div className="relative">
            <input 
              type="file" 
              accept=".csv,image/*" 
              webkitdirectory="" 
              directory="" 
              ref={folderInputRef} 
              onChange={handleFolderUpload} 
              className="hidden" 
            />
            <Button variant="outline" size="sm" onClick={() => folderInputRef.current?.click()} className="gap-2 text-xs h-9 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
              <Upload className="w-4 h-4" /> Bulk Upload Folder
            </Button>
          </div>
        </div>
      </div>

      {/* FIXED TOP SECTION: ADD/EDIT */}
      <div className={`bg-white rounded-xl border ${editingId ? 'border-orange-200 shadow-md ring-1 ring-orange-100' : 'border-primary/20 shadow-sm'} p-6 space-y-6 transition-all duration-300`}>
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <h2 className="text-lg font-medium text-[#262626] flex items-center gap-2">
            {editingId ? <FileQuestion className="w-5 h-5 text-orange-500" /> : <PlusCircle className="w-5 h-5 text-primary" />} 
            {editingId ? "Edit Question" : "Add New Question"}
          </h2>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-foreground/50 hover:text-foreground h-8 px-3">
              Cancel Edit
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metadata Row */}
          <div>
            <Label className="text-xs text-[#262626]/60">Part</Label>
            <Select 
              value={newQuestion.part} 
              onValueChange={(val: any) => {
                if (val === 'B') {
                  setNewQuestion({...newQuestion, part: val, type: 'SUBJECTIVE'});
                } else if (val === 'A' && newQuestion.type === 'SUBJECTIVE') {
                  setNewQuestion({...newQuestion, part: val, type: 'MCQ'});
                } else {
                  setNewQuestion({...newQuestion, part: val});
                }
              }}
            >
              <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Select Part" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Part A (Objective)</SelectItem>
                <SelectItem value="B">Part B (Subjective/Sketching)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#262626]/60">Type</Label>
            <Select 
              value={newQuestion.type} 
              onValueChange={(val: any) => setNewQuestion({...newQuestion, type: val})}
              disabled={newQuestion.part === 'B'}
            >
              <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Select Type" /></SelectTrigger>
              <SelectContent>
                {newQuestion.part === 'A' ? (
                  <>
                    <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
                    <SelectItem value="MSQ">Multiple Select (MSQ)</SelectItem>
                    <SelectItem value="NAT">Numerical Answer (NAT)</SelectItem>
                  </>
                ) : (
                  <SelectItem value="SUBJECTIVE">Subjective</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#262626]/60">Difficulty</Label>
            <Select value={newQuestion.difficulty} onValueChange={(val: any) => setNewQuestion({...newQuestion, difficulty: val})}>
              <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Select Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#262626]/60">PYQ Tag (Optional)</Label>
            <Input 
              value={newQuestion.pyq_tag || ''} 
              onChange={(e) => setNewQuestion({...newQuestion, pyq_tag: e.target.value})}
              placeholder="e.g. CEED 2022"
              className="h-10" 
            />
          </div>
          
          {/* Content & Media Row */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label className="text-xs text-[#262626]/60 mb-1 block">Question Content</Label>
            <div className="bg-white rounded-md border-0">
              <ReactQuill 
                theme="snow" 
                value={newQuestion.content_text} 
                onChange={(content) => setNewQuestion({...newQuestion, content_text: content})}
                placeholder="Enter the question text here..."
                className="h-[140px] mb-12"
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{'list': 'bullet'}, {'list': 'ordered'}],
                  ],
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <Label className="text-xs text-[#262626]/60 mb-1 block">Question Media (Optional)</Label>
            <div className="border-2 border-dashed border-black/10 rounded-xl p-4 flex flex-col items-center justify-center text-center h-[140px] relative overflow-hidden bg-background/50 hover:bg-background transition-colors">
              {questionMediaPreview ? (
                <>
                  <img src={questionMediaPreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                  <button onClick={() => { setQuestionMediaFile(null); setQuestionMediaPreview(null); setNewQuestion({...newQuestion, media_url: undefined}); }} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50 text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 text-foreground/40 mb-2" />
                  <span className="text-xs text-foreground/60">Click to upload image</span>
                  <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleQuestionFileChange} />
                </>
              )}
            </div>
          </div>

          {/* Options Management (Only for MCQ/MSQ/NAT) */}
          {(newQuestion.type === 'MCQ' || newQuestion.type === 'MSQ' || newQuestion.type === 'NAT') && (
            <div className="md:col-span-2 lg:col-span-4 border rounded-xl p-4 bg-background/30">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-medium text-[#262626]">
                  {newQuestion.type === 'NAT' ? "Acceptable Answers (Exact Matches)" : "Answer Options"}
                </Label>
                <Button size="sm" variant="outline" onClick={addOption} className="h-8 gap-2">
                  <PlusCircle className="w-4 h-4" /> 
                  {newQuestion.type === 'NAT' ? "Add Answer" : "Add Option"}
                </Button>
              </div>
              
              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${opt.is_correct ? 'border-green-300 bg-green-50' : 'border-black/5 bg-white'}`}>
                    {/* Correct Checkbox (Hidden for NAT) */}
                    {newQuestion.type !== 'NAT' && (
                      <button 
                        onClick={() => {
                          if (newQuestion.type === 'MCQ') {
                            // Uncheck all others
                            const newOpts = options.map((o, i) => ({ ...o, is_correct: i === idx ? !o.is_correct : false }));
                            setOptions(newOpts);
                          } else {
                            updateOption(idx, 'is_correct', !opt.is_correct);
                          }
                        }}
                        className={`mt-2 shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${opt.is_correct ? 'bg-green-500 border-green-600 text-white' : 'border-black/20 text-transparent hover:border-black/40'}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* NAT specific icon indicator */}
                    {newQuestion.type === 'NAT' && (
                      <div className="mt-2 shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <Input 
                        value={opt.content_text} 
                        onChange={(e) => updateOption(idx, 'content_text', e.target.value)} 
                        placeholder={newQuestion.type === 'NAT' ? `Valid answer ${idx + 1} (e.g., 14.5 or 14)` : `Option ${idx + 1} text...`}
                        className="h-9 bg-transparent"
                      />
                      {/* Option Media Upload (Hide for NAT) */}
                      {newQuestion.type !== 'NAT' && (
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px] text-foreground/50 border border-dashed border-black/20 rounded px-2 py-1 cursor-pointer hover:bg-black/5 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> 
                            {opt.file ? opt.file.name : (opt.media_url ? "Media Attached" : "Attach Media")}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => updateOptionFile(idx, e.target.files ? e.target.files[0] : null)} />
                          </Label>
                          {(opt.file || opt.media_url) && (
                            <button onClick={() => { updateOptionFile(idx, null); updateOption(idx, 'media_url', undefined); }} className="text-[10px] text-red-500 hover:underline">Remove Media</button>
                          )}
                        </div>
                      )}
                    </div>

                    <button onClick={() => removeOption(idx)} className="mt-2 shrink-0 p-1 text-foreground/30 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {options.length === 0 && <div className="text-xs text-foreground/40 italic">
                  {newQuestion.type === 'NAT' ? 'No acceptable answers added. Click "Add Answer".' : 'No options added yet. Click "Add Option".'}
                </div>}
              </div>
            </div>
          )}

          {/* Topics & Save */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label className="text-xs text-[#262626]/60">Topics (Comma separated)</Label>
            <Input 
              value={topicsInput} 
              onChange={(e) => setTopicsInput(e.target.value)}
              placeholder="e.g. Color Theory, Perspective, Spatial Ability"
              className="h-10" 
            />
          </div>

          <div className="flex items-end lg:col-span-1">
            <Button variant="outline" onClick={triggerPreview} disabled={savingNew} className={`w-full h-10 gap-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : ''}`}>
               Preview & Save
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#262626]/10 pt-8" />

      {/* BOTTOM SECTION: EXISTING LIST & FILTERS */}
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <h3 className="text-lg font-medium text-[#262626]">Question Bank ({questions.length})</h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border border-black/10 rounded-md bg-white px-2 h-9">
              <Filter className="w-3 h-3 text-foreground/40 mr-2" />
              <select className="text-xs bg-transparent outline-none pr-2" value={filterPart} onChange={(e) => setFilterPart(e.target.value)}>
                <option value="ALL">All Parts</option>
                <option value="A">Part A</option>
                <option value="B">Part B</option>
              </select>
            </div>
            
            <div className="flex items-center border border-black/10 rounded-md bg-white px-2 h-9">
              <Filter className="w-3 h-3 text-foreground/40 mr-2" />
              <select className="text-xs bg-transparent outline-none pr-2" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="MCQ">MCQ</option>
                <option value="MSQ">MSQ</option>
                <option value="NAT">NAT</option>
                <option value="SUBJECTIVE">SUBJECTIVE</option>
              </select>
            </div>

            <Input 
              placeholder="Search topics..." 
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              className="h-9 w-40 text-xs bg-white"
            />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-black/5 overflow-hidden shadow-sm">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-black/5 p-4 bg-background/50 text-xs font-semibold text-foreground/50 uppercase tracking-widest hidden md:grid">
            <div className="col-span-1">Part</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-4">Content Snippet</div>
            <div className="col-span-1">Media</div>
            <div className="col-span-2">Tags / PYQ</div>
            <div className="col-span-1 text-center">Diff</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List Body */}
          <div className="divide-y divide-black/5">
            {displayQuestions.map((q) => (
              <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-background/30 transition-colors text-sm">
                
                <div className="col-span-1 font-bold text-foreground/70">
                   Part {q.part}
                </div>

                <div className="col-span-1">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">{q.type}</span>
                </div>

                <div className="col-span-1 md:col-span-4 text-foreground/80 line-clamp-2 pr-4 break-words whitespace-normal [&_p]:inline [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4" dangerouslySetInnerHTML={{ __html: (q.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>') }}>
                </div>

                <div className="col-span-1">
                  {q.media_url ? <ImageIcon className="w-4 h-4 text-primary" /> : <span className="text-foreground/30">-</span>}
                </div>

                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                  {q.pyq_tag && <span className="text-xs font-medium text-orange-600">{q.pyq_tag}</span>}
                  {q.topics && q.topics.length > 0 && (
                    <span className="text-[10px] text-foreground/50 truncate" title={q.topics.join(', ')}>
                      {q.topics.join(', ')}
                    </span>
                  )}
                </div>

                <div className="col-span-1 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    q.difficulty === 'High' ? 'bg-red-100 text-red-700' : 
                    q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center gap-2 md:justify-end mt-4 md:mt-0 pt-4 md:pt-0 border-t border-black/5 md:border-t-0">
                  <Button variant="outline" size="sm" onClick={() => editQuestion(q)} className="w-full md:w-auto text-xs hover:bg-black/5 border-black/10 h-8">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteQuestion(q.id)} className="w-full md:w-auto text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 h-8">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {displayQuestions.length === 0 && (
              <div className="p-12 text-center text-[#262626]/30 text-sm">
                No questions found matching the filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[75vw] w-[75vw] max-h-[75vh] overflow-y-auto shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileQuestion className="w-5 h-5 text-primary" /> Question Preview</DialogTitle>
            <DialogDescription>Review the question details before saving to the database.</DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="flex gap-2">
               <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">{newQuestion.type}</span>
               <span className="bg-black/5 text-foreground/70 px-2 py-1 rounded text-xs font-bold">Part {newQuestion.part}</span>
               <span className="bg-black/5 text-foreground/70 px-2 py-1 rounded text-xs font-bold">{newQuestion.difficulty} Diff</span>
               {newQuestion.pyq_tag && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">{newQuestion.pyq_tag}</span>}
            </div>

            <div className="p-4 bg-background rounded-xl border border-black/5 shadow-sm text-[#262626] overflow-hidden">
              <div className="w-full break-words whitespace-normal leading-relaxed [&_p]:mb-4 last:[&_p]:mb-0 [&_p:empty]:h-6 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4" dangerouslySetInnerHTML={{ __html: (newQuestion.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>') }}></div>
              {questionMediaPreview && (
                <div className="mt-4 rounded-lg overflow-hidden border border-black/10 inline-block max-w-full">
                  <img src={questionMediaPreview} alt="Question Media" className="max-h-64 object-contain" />
                </div>
              )}
            </div>

            {(newQuestion.type === 'MCQ' || newQuestion.type === 'MSQ' || newQuestion.type === 'NAT') && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">{newQuestion.type === 'NAT' ? 'Acceptable Answers' : 'Options Preview'}</Label>
                {options.map((opt, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${opt.is_correct ? 'border-green-500 bg-green-50' : 'border-black/10 bg-white'}`}>
                    {newQuestion.type !== 'NAT' && (
                      <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full border border-black/20 flex items-center justify-center font-semibold text-xs text-foreground/50">
                        {String.fromCharCode(65 + idx)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{opt.content_text}</p>
                      {(opt.file || opt.media_url) && newQuestion.type !== 'NAT' && (
                        <div className="mt-2 text-xs text-primary flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image attached</div>
                      )}
                    </div>
                    {opt.is_correct && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-black/5 pt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={savingNew}>Continue Editing</Button>
            <Button onClick={confirmAndSave} disabled={savingNew} className="bg-primary hover:bg-primary/90 gap-2">
              {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingNew ? "Saving..." : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK UPLOAD PREVIEW MODAL */}
      <Dialog open={bulkPreviewOpen} onOpenChange={setBulkPreviewOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 border-b border-black/5 shrink-0">
            <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Bulk Upload Preview</DialogTitle>
            <DialogDescription>Review the parsed questions. Select questions to approve or reject them.</DialogDescription>
            
            {/* Filters & Bulk Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 pt-4 border-t mt-4 border-black/5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-foreground/50 mr-2">Filter:</span>
                {['ALL', 'MCQ', 'MSQ', 'NAT', 'SUBJECTIVE'].map(type => (
                  <button
                    key={type}
                    onClick={() => setBulkFilterType(type)}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${bulkFilterType === type ? 'bg-primary text-white border-primary' : 'bg-white border-black/10 text-foreground/70 hover:bg-black/5'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground/50 mr-2">{bulkSelectedIds.length} selected</span>
                <Button size="sm" variant="outline" onClick={() => setBulkSelectedIds(bulkSelectedIds.length === filteredBulkQuestions.length ? [] : filteredBulkQuestions.map(q => q._tempId))}>
                  {bulkSelectedIds.length === filteredBulkQuestions.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('approved')} disabled={bulkSelectedIds.length === 0} className="bg-green-600 hover:bg-green-700 text-white">
                  Approve Selected
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('rejected')} disabled={bulkSelectedIds.length === 0}>
                  Reject Selected
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredBulkQuestions.map((bq, idx) => (
              <div key={bq._tempId} className={`p-4 rounded-xl border flex gap-4 ${bq.status === 'approved' ? 'border-green-400 bg-green-50/50' : bq.status === 'rejected' ? 'border-red-200 bg-red-50/50 opacity-60' : 'border-black/10 bg-white'}`}>
                <div className="pt-1">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-primary rounded border-black/20 focus:ring-primary accent-primary cursor-pointer"
                    checked={bulkSelectedIds.includes(bq._tempId)}
                    onChange={() => toggleBulkSelection(bq._tempId)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Part {bq.part}</span>
                      <span className="text-xs font-bold bg-black/5 text-foreground/70 px-2 py-1 rounded">{bq.type}</span>
                      <span className="text-xs font-bold bg-black/5 text-foreground/70 px-2 py-1 rounded capitalize">{bq.difficulty}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant={bq.status === 'approved' ? 'default' : 'outline'} className={bq.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''} onClick={() => toggleBulkStatus(bq._tempId, 'approved')}>
                        Approve
                      </Button>
                      <Button size="sm" variant={bq.status === 'rejected' ? 'destructive' : 'outline'} onClick={() => toggleBulkStatus(bq._tempId, 'rejected')}>
                        Reject
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground/80 font-medium">{bq.content_text}</p>

                  {/* Duplicate warning and conflict resolution selection */}
                  {bq.is_duplicate && (
                    <div className="mt-2 text-xs border border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span>⚠️ Existing duplicate detected in repository.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/60">Resolve conflict:</span>
                        <select
                          value={bq.duplicate_action}
                          onChange={(e) => updateDuplicateAction(bq._tempId, e.target.value as any)}
                          className="bg-white border border-amber-300 rounded px-2 py-0.5 text-xs text-foreground/80 outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
                        >
                          <option value="skip">Skip Import</option>
                          <option value="overwrite">Overwrite & Replace</option>
                          <option value="create">Create New Copy</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {/* Inline Question Image Preview & Warning */}
                  {bq.media_filename && (
                    <div className="mt-2">
                      {bq.media_exists ? (
                        <div className="inline-block border rounded-lg overflow-hidden bg-background">
                          <LocalImagePreview 
                            file={bulkImagesMap.get(bq.media_filename)!} 
                            alt="Question Image Preview" 
                            className="max-h-32 object-contain" 
                          />
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 flex items-center gap-1.5 w-fit">
                          <span>⚠️ Missing question image file:</span>
                          <code className="bg-red-100 px-1 py-0.5 rounded font-mono">{bq.media_filename}</code>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Options List with Option Images & Warnings */}
                  {bq.options && bq.options.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-black/10 space-y-2">
                      {bq.options.map((opt: any, oIdx: number) => (
                        <div key={oIdx} className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            {opt.is_correct ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <div className="w-3 h-3" />}
                            <span className={opt.is_correct ? 'font-bold text-green-700' : 'text-foreground/60'}>
                              {opt.content_text || "(No text)"}
                            </span>
                            {opt.media_filename && !opt.media_exists && (
                              <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 font-mono ml-2">
                                ⚠️ Missing image: {opt.media_filename}
                              </span>
                            )}
                          </div>
                          {opt.media_filename && opt.media_exists && (
                            <div className="pl-5">
                              <div className="inline-block border rounded-md overflow-hidden bg-background">
                                <LocalImagePreview 
                                  file={bulkImagesMap.get(opt.media_filename)!} 
                                  alt="Option Image Preview" 
                                  className="max-h-20 object-contain" 
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="p-6 border-t border-black/5 shrink-0 flex items-center justify-end gap-2">
             <Button variant="outline" onClick={() => setBulkPreviewOpen(false)} disabled={isUploadingBulk}>Cancel</Button>
             <Button 
               onClick={saveApprovedBulkQuestions} 
               disabled={
                 isUploadingBulk || 
                 !bulkQuestions.some(q => q.status === 'approved' && q.duplicate_action !== 'skip') ||
                 bulkQuestions.some(q => q.status === 'approved' && q.duplicate_action !== 'skip' && ((!q.media_exists) || q.options.some((opt: any) => !opt.media_exists)))
               } 
               className="bg-primary hover:bg-primary/90 gap-2"
             >
               {isUploadingBulk && <Loader2 className="w-4 h-4 animate-spin" />}
               Save Approved Questions
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
