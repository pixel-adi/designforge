import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileQuestion, Trash2, PlusCircle, Save, Loader2, Image as ImageIcon, X, CheckCircle2, Download, Upload, Filter, Settings, Sparkles, AlertCircle } from "lucide-react";
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
  exam_options?: any[];
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
  const [newQuestionTopics, setNewQuestionTopics] = useState<string[]>([]);
  const [currentTopicInput, setCurrentTopicInput] = useState<string>("");

  const addTopicTag = (val: string) => {
    const tagsToAdd = val.split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0 && !newQuestionTopics.includes(t));
    if (tagsToAdd.length > 0) {
      setNewQuestionTopics([...newQuestionTopics, ...tagsToAdd]);
    }
    setCurrentTopicInput("");
  };

  const removeTopicTag = (tag: string) => {
    setNewQuestionTopics(newQuestionTopics.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTopicTag(currentTopicInput);
    }
  };

  const handleTagBlur = () => {
    if (currentTopicInput.trim()) {
      addTopicTag(currentTopicInput);
    }
  };
  
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
  const [filterPyq, setFilterPyq] = useState<string>("ALL");
  const [searchTopic, setSearchTopic] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterInvalidOnly, setFilterInvalidOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const [hideSample, setHideSample] = useState<boolean>(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterPart, filterType, filterPyq, searchTopic, searchQuery, filterInvalidOnly]);

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [bulkImagesMap, setBulkImagesMap] = useState<Map<string, File>>(new Map());
  const [bulkImagesPreviewMap, setBulkImagesPreviewMap] = useState<Map<string, string>>(new Map());
  const [bulkQuestions, setBulkQuestions] = useState<any[]>([]);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkFilterType, setBulkFilterType] = useState<string>("ALL");

  // AI Importer State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-flash-latest");
  const [aiImporterOpen, setAiImporterOpen] = useState(false);
  const [questionPdfFile, setQuestionPdfFile] = useState<File | null>(null);
  const [answerKeyPdfFile, setAnswerKeyPdfFile] = useState<File | null>(null);
  const [aiPyqTag, setAiPyqTag] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiProcessingStatus, setAiProcessingStatus] = useState("");
  const [aiProcessingProgress, setAiProcessingProgress] = useState(0);

  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number | null>(null);


  useEffect(() => { 
    fetchQuestions(); 
    checkAdminRole();
    fetchGeminiKey();
  }, []);

  const checkAdminRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const email = session.user?.email || "";
    if (email.toLowerCase().endsWith("@designforge.co.in")) {
      setIsAdmin(true);
      return;
    }
    const { data: staff } = await supabase
      .from("staff_users")
      .select("role")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();
    if (staff && staff.role === "admin") {
      setIsAdmin(true);
    }
  };

  const fetchGeminiKey = async () => {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value");
      if (data) {
        const keyItem = data.find(d => d.key === "gemini_api_key");
        const modelItem = data.find(d => d.key === "gemini_api_model");
        if (keyItem) setGeminiKey(keyItem.value);
        if (modelItem) setGeminiModel(modelItem.value);
      }
    } catch (err) {
      console.error("Failed to fetch API key:", err);
    }
  };

  const saveGeminiKey = async () => {
    try {
      const { error: err1 } = await supabase
        .from("system_settings")
        .upsert({ key: "gemini_api_key", value: geminiKey });
      const { error: err2 } = await supabase
        .from("system_settings")
        .upsert({ key: "gemini_api_model", value: geminiModel });
      if (err1 || err2) throw err1 || err2;
      toast({ title: "Settings Saved", description: "Gemini API configurations updated successfully." });
      setShowSettings(false);
    } catch (err: any) {
      toast({ title: "Failed to save settings", description: err.message, variant: "destructive" });
    }
  };

  const testApiKey = async () => {
    if (!geminiKey) {
      setTestResult("❌ Please enter an API key first.");
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
      if (!response.ok) {
        const errorText = await response.text();
        setTestResult(`❌ Connection Failed: ${response.status} - ${errorText}`);
        return;
      }
      const data = await response.json();
      const models = data.models || [];
      if (models.length === 0) {
        setTestResult("⚠️ Connected, but no generative models are available for this key.");
      } else {
        const modelNames = models.map((m: any) => m.name.replace("models/", "")).join(", ");
        setTestResult(`✅ Success! Available Models: ${modelNames}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Connection Failed: ${err.message}`);
    } finally {
      setTestingKey(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const fetchGeminiSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("key, value");
    const key = data?.find(d => d.key === "gemini_api_key")?.value || "";
    let model = data?.find(d => d.key === "gemini_api_model")?.value || "gemini-flash-latest";
    if (model.startsWith("gemini-1.5") || model === "gemini-2.5-flash") {
      model = "gemini-flash-latest";
    }
    return { key, model };
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 2000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.status === 429 || response.status === 503) {
          console.warn(`Request failed with status ${response.status}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
          setAiProcessingStatus(`Server busy (${response.status}). Retrying attempt ${i + 1} of ${retries}...`);
          await sleep(delay);
          delay *= 1.5;
          continue;
        }
        return response;
      } catch (err) {
        if (i === retries - 1) throw err;
        console.warn(`Fetch error occurred. Retrying in ${delay}ms...`, err);
        await sleep(delay);
        delay *= 1.5;
      }
    }
    throw new Error("API call failed after maximum retries.");
  };

  const renderPageToImageBase64 = async (pdfDoc: any, pageNum: number): Promise<string> => {
    const page = await pdfDoc.getPage(pageNum);
    const scale = 1.5; 
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Fill canvas background with white to prevent black background transparency issues
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: context, viewport }).promise;
    return new Promise<string>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error(`Failed to render page ${pageNum} to blob`));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.85);
    });
  };

  const processAIImporter = async () => {
    if (!questionPdfFile || !answerKeyPdfFile) {
      toast({ title: "Files required", description: "Please upload both the Question Paper and Answer Key PDFs.", variant: "destructive" });
      return;
    }

    setAiProcessingStatus("Fetching API credentials...");
    setAiProcessingProgress(2);
    const { key, model } = await fetchGeminiSettings();
    if (!key) {
      toast({ title: "API Key Missing", description: "Please click the gear icon to set your Gemini API key first.", variant: "destructive" });
      return;
    }

    setIsProcessingAI(true);
    try {
      setAiProcessingStatus("Loading PDF documents...");
      setAiProcessingProgress(5);

      // Load PDFJS doc for rendering pages
      const arrayBuffer = await questionPdfFile.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      const aPdfBase64 = await fileToBase64(answerKeyPdfFile);

      const actualEndPage = Math.min(endPage, pdfDoc.numPages);
      const actualStartPage = Math.max(1, Math.min(startPage, actualEndPage));
      const totalPagesToProcess = actualEndPage - actualStartPage + 1;

      const BATCH_SIZE = 3;
      const allRawQuestions: any[] = [];

      // Calculate number of batches
      const totalBatches = Math.ceil(totalPagesToProcess / BATCH_SIZE);
      let batchIndex = 0;

      for (let batchStart = actualStartPage; batchStart <= actualEndPage; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, actualEndPage);
        const batchProgressStart = 10 + Math.floor((batchIndex / totalBatches) * 70);
        const batchProgressEnd = 10 + Math.floor(((batchIndex + 1) / totalBatches) * 70);

        setAiProcessingStatus(`Rendering pages ${batchStart} to ${batchEnd}...`);
        setAiProcessingProgress(batchProgressStart);

        // Render each page in the batch
        const pageImageParts: any[] = [];
        for (let p = batchStart; p <= batchEnd; p++) {
          const stepProgress = batchProgressStart + Math.floor(((p - batchStart) / (batchEnd - batchStart + 1)) * (batchProgressEnd - batchProgressStart) * 0.3);
          setAiProcessingProgress(stepProgress);
          
          const base64Image = await renderPageToImageBase64(pdfDoc, p);
          pageImageParts.push({ text: `This image represents Page ${p} of the Question Paper PDF:` });
          pageImageParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          });
        }

        const currentPrompt = `You are an expert exam extraction AI. Your task is to extract all questions (Part A and Part B) and their corresponding correct answers from the provided Question Paper page images and the Answer Key PDF.
        
        CRITICAL PAGE RANGE RULE:
        We are providing you with page images representing Page ${batchStart} to Page ${batchEnd} of the Question Paper PDF.
        You must ONLY extract questions that are located on these pages. Do not extract questions from any other pages. If no questions are found on these pages, return an empty array.
        For any question extracted, make sure the "diagram_page" or options "diagram_page" is set to the correct original page number (between ${batchStart} and ${batchEnd}) where that diagram is located.
        
        CRITICAL SEGREGATION & FORMATTING RULES:
        * MCQ: If a question has EXACTLY ONE correct option in the Answer Key, type MUST be "MCQ".
        * MSQ: If a question has MORE THAN ONE correct option in the Answer Key, type MUST be "MSQ".
        * NAT: If the question requires a numerical input (no options are shown in the paper), type MUST be "NAT". The options array MUST contain exactly one option, where content_text is the correct numerical answer (value or range, e.g., "14.5" or "14-15") resolved from the Answer Key PDF, and is_correct MUST be true.
        * SUBJECTIVE: If the question is a drawing, sketching, or design-based descriptive question (Part B), type MUST be "SUBJECTIVE". Options array MUST be empty [].
        
        For each question, extract:
        1. part: "A" or "B"
        2. type: "MCQ", "MSQ", "NAT", or "SUBJECTIVE"
        3. difficulty: Make a reasonable guess of "Low", "Medium", or "High"
        4. content_text: The complete question text.
           * Output clean plain text.
           * DO NOT include any HTML tags (such as <p>, <b>, <i>, <ul>, <li>, span, etc.).
           * Strip off any question numbering or index prefix (e.g. strip "Q1.", "Question 1:", "12.", "15.", etc. from the beginning so the question text starts directly with the content). If a question spans across page boundaries, merge the text completely.
        5. topics: Guess relevant design/theory topics (array of strings, e.g. ["Perspective", "Color Theory", "Visualization"])
        6. pyq_tag: Use the provided PYQ Tag: "${aiPyqTag}"
        7. has_diagram: true if the question body contains a diagram, sketch, drawing, photo, table, or visual illustration. Otherwise false.
        8. diagram_page: The 1-based page number (must be between ${batchStart} and ${batchEnd}) where the diagram is located. If has_diagram is false, this MUST be -1.
        9. diagram_bbox: Bounding box coordinates [ymin, xmin, ymax, xmax] normalized from 0 to 1000. If has_diagram is false, this MUST be an empty array [].
        10. options: MCQ and MSQ questions MUST have exactly 4 options. NAT questions MUST have exactly 1 option (the correct answer key/value where is_correct is true). SUBJECTIVE questions MUST have 0 options (empty array []).
            Each option has:
            - content_text: Option text.
              * Output clean plain text.
              * DO NOT include any HTML tags.
              * Strip option prefix labels (e.g. strip "A.", "B.", "a)", "b)", "(a)", "(b)", etc. from the beginning so only the option content remains).
            - is_correct: true or false (resolve correctness strictly from the Answer Key PDF!)
            - has_diagram: true if the option itself is an image/diagram. Otherwise false.
            - diagram_page: The page number (between ${batchStart} and ${batchEnd}) where the option diagram is located. If has_diagram is false, this MUST be -1.
            - diagram_bbox: Bounding box coordinates [ymin, xmin, ymax, xmax] for the option image, normalized 0 to 1000. If has_diagram is false, this MUST be an empty array [].
            
        Ensure the output is valid JSON matching the specified schema. Output ONLY the JSON block. Do not include markdown code block quotes.`;

        let success = false;
        let attempts = 0;
        const maxAttempts = 2;
        let batchQuestions: any[] = [];

        while (!success && attempts < maxAttempts) {
          attempts++;
          setAiProcessingStatus(`Analyzing pages ${batchStart}-${batchEnd} (Attempt ${attempts} of ${maxAttempts})...`);
          setAiProcessingProgress(batchProgressStart + Math.floor((batchProgressEnd - batchProgressStart) * 0.4));

          try {
            let response;
            try {
              response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { text: currentPrompt },
                        ...pageImageParts,
                        { text: "Here is the Answer Key PDF:" },
                        {
                          inlineData: {
                            mimeType: "application/pdf",
                            data: aPdfBase64
                          }
                        }
                      ]
                    }
                  ],
                  generationConfig: {
                    temperature: 0.0,
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: "OBJECT",
                      properties: {
                        questions: {
                          type: "ARRAY",
                          items: {
                            type: "OBJECT",
                            properties: {
                              part: { type: "STRING", enum: ["A", "B"] },
                              type: { type: "STRING", enum: ["MCQ", "MSQ", "NAT", "SUBJECTIVE"] },
                              difficulty: { type: "STRING", enum: ["Low", "Medium", "High"] },
                              content_text: { type: "STRING" },
                              topics: { type: "ARRAY", items: { type: "STRING" } },
                              pyq_tag: { type: "STRING" },
                              has_diagram: { type: "BOOLEAN" },
                              diagram_page: { type: "INTEGER" },
                              diagram_bbox: { type: "ARRAY", items: { type: "NUMBER" } },
                              options: {
                                type: "ARRAY",
                                items: {
                                  type: "OBJECT",
                                  properties: {
                                    content_text: { type: "STRING" },
                                    is_correct: { type: "BOOLEAN" },
                                    has_diagram: { type: "BOOLEAN" },
                                    diagram_page: { type: "INTEGER" },
                                    diagram_bbox: { type: "ARRAY", items: { type: "NUMBER" } }
                                  },
                                  required: ["content_text", "is_correct", "has_diagram", "diagram_page", "diagram_bbox"]
                                }
                              }
                            },
                            required: ["part", "type", "difficulty", "content_text", "topics", "has_diagram", "diagram_page", "diagram_bbox", "options"]
                          }
                        }
                      },
                      required: ["questions"]
                    }
                  },
                  safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                  ]
                })
              });
            } catch (e) {
              console.error("First fetch failed for batch", batchStart, e);
            }

            if ((!response || !response.ok) && model !== "gemini-flash-latest") {
              console.warn(`Model ${model} failed for batch ${batchStart}, trying fallback to gemini-flash-latest...`);
              try {
                response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [
                          { text: currentPrompt },
                          ...pageImageParts,
                          { text: "Here is the Answer Key PDF:" },
                          {
                            inlineData: {
                              mimeType: "application/pdf",
                              data: aPdfBase64
                            }
                          }
                        ]
                      }
                    ],
                    generationConfig: {
                      temperature: 0.0,
                      responseMimeType: "application/json",
                      responseSchema: {
                        type: "OBJECT",
                        properties: {
                          questions: {
                            type: "ARRAY",
                            items: {
                              type: "OBJECT",
                              properties: {
                                part: { type: "STRING", enum: ["A", "B"] },
                                type: { type: "STRING", enum: ["MCQ", "MSQ", "NAT", "SUBJECTIVE"] },
                                difficulty: { type: "STRING", enum: ["Low", "Medium", "High"] },
                                content_text: { type: "STRING" },
                                topics: { type: "ARRAY", items: { type: "STRING" } },
                                pyq_tag: { type: "STRING" },
                                has_diagram: { type: "BOOLEAN" },
                                diagram_page: { type: "INTEGER" },
                                diagram_bbox: { type: "ARRAY", items: { type: "NUMBER" } },
                                options: {
                                  type: "ARRAY",
                                  items: {
                                    type: "OBJECT",
                                    properties: {
                                      content_text: { type: "STRING" },
                                      is_correct: { type: "BOOLEAN" },
                                      has_diagram: { type: "BOOLEAN" },
                                      diagram_page: { type: "INTEGER" },
                                      diagram_bbox: { type: "ARRAY", items: { type: "NUMBER" } }
                                    },
                                    required: ["content_text", "is_correct", "has_diagram", "diagram_page", "diagram_bbox"]
                                  }
                                }
                              },
                              required: ["part", "type", "difficulty", "content_text", "topics", "has_diagram", "diagram_page", "diagram_bbox", "options"]
                            }
                          }
                        },
                        required: ["questions"]
                      }
                    },
                    safetySettings: [
                      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                  })
                });
              } catch (fallbackErr) {
                console.error("Fallback fetch failed for batch", batchStart, fallbackErr);
              }
            }

            if (!response || !response.ok) {
              const errorText = response ? await response.text() : "Network Error";
              throw new Error(`Gemini API Error: ${response ? response.status : 'Fetch Failed'} - ${errorText}`);
            }

            const resData = await response.json();
            const extractedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!extractedText) {
              console.error("Gemini Response Data:", resData);
              const candidate = resData.candidates?.[0];
              const finishReason = candidate?.finishReason;
              const safetyRatings = candidate?.safetyRatings;
              const blockReason = resData.promptFeedback?.blockReason;
              
              let details = "";
              if (finishReason) details += ` Finish reason: ${finishReason}.`;
              if (blockReason) details += ` Prompt block reason: ${blockReason}.`;
              if (safetyRatings) {
                const triggered = safetyRatings.filter((r: any) => r.blocked || r.probability === "HIGH" || r.probability === "MEDIUM");
                if (triggered.length > 0) {
                  details += ` Blocked safety categories: ${triggered.map((t: any) => t.category).join(", ")}.`;
                }
              }
              
              throw new Error(`No data returned from Gemini AI.${details || " Check browser console for full API response."}`);
            }

            const extractedJson = JSON.parse(extractedText);
            batchQuestions = extractedJson.questions || [];
            success = true;
          } catch (batchErr: any) {
            console.error(`Batch ${batchStart}-${batchEnd} error:`, batchErr);
            if (attempts >= maxAttempts) {
              throw new Error(`Failed to extract pages ${batchStart}-${batchEnd}: ${batchErr.message}`);
            }
            await sleep(2000);
          }
        }

        allRawQuestions.push(...batchQuestions);
        batchIndex++;
        setAiProcessingProgress(batchProgressEnd);
      }

      setAiProcessingStatus(`Deduplicating questions...`);
      setAiProcessingProgress(82);

      // Deduplicate questions from batches on content_text
      const seenContents = new Set<string>();
      const uniqueRawQuestions: any[] = [];
      for (const q of allRawQuestions) {
        const norm = normalizeText(q.content_text || "");
        if (!seenContents.has(norm)) {
          seenContents.add(norm);
          uniqueRawQuestions.push(q);
        }
      }

      setAiProcessingStatus(`Extracted ${uniqueRawQuestions.length} unique questions. Cropping diagrams...`);
      setAiProcessingProgress(85);

      // Crop diagrams using our already loaded pdfDoc to avoid double loading
      const processedQuestions = await cropDiagramsFromPDF(uniqueRawQuestions, pdfDoc);

      setAiProcessingProgress(100);
      setBulkQuestions(processedQuestions);
      setBulkPreviewOpen(true);
      setAiImporterOpen(false);
      toast({ title: "AI Extraction Complete", description: `Successfully processed ${uniqueRawQuestions.length} questions.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "AI Importer Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessingAI(false);
      setAiProcessingProgress(0);
    }
  };

  const fetchAllExistingQuestions = async (): Promise<Map<string, string>> => {
    const existingMap = new Map<string, string>();
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("exam_questions")
        .select("id, content_text")
        .range(from, from + step - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(q => {
          existingMap.set(normalizeText(q.content_text || ""), q.id);
        });
        if (data.length < step) {
          hasMore = false;
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }
    return existingMap;
  };

  const cropDiagramsFromPDF = async (rawQuestions: any[], existingPdfDoc?: any) => {
    if (!questionPdfFile) return rawQuestions;

    let pdfDoc = existingPdfDoc;
    if (!pdfDoc) {
      const arrayBuffer = await questionPdfFile.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      pdfDoc = await loadingTask.promise;
    }

    const imageMap = new Map<string, File>();
    const processed = [];

    for (let index = 0; index < rawQuestions.length; index++) {
      const q = rawQuestions[index];
      const opts = [];

      const cropProgress = 85 + Math.floor((index / rawQuestions.length) * 13);
      setAiProcessingProgress(cropProgress);

      let qMediaFilename = "";
      let qMediaExists = true;

      // Crop Question Image
      if (q.has_diagram && q.diagram_page && q.diagram_bbox && q.diagram_page <= pdfDoc.numPages) {
        try {
          const filename = `ai_q_${index}_main.png`;
          const file = await extractRegionAsFile(pdfDoc, q.diagram_page, q.diagram_bbox, filename);
          if (file) {
            imageMap.set(filename, file);
            qMediaFilename = filename;
            qMediaExists = true;
          }
        } catch (err) {
          console.error("Failed to crop question diagram:", err);
          qMediaExists = false;
        }
      }

      // Crop Option Images
      if (q.options && q.options.length > 0) {
        for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
          const opt = q.options[oIdx];
          let optMediaFilename = "";
          let optMediaExists = true;

          if (opt.has_diagram && opt.diagram_page && opt.diagram_bbox && opt.diagram_page <= pdfDoc.numPages) {
            try {
              const filename = `ai_q_${index}_opt_${oIdx}.png`;
              const file = await extractRegionAsFile(pdfDoc, opt.diagram_page, opt.diagram_bbox, filename);
              if (file) {
                imageMap.set(filename, file);
                optMediaFilename = filename;
                optMediaExists = true;
              }
            } catch (err) {
              console.error("Failed to crop option diagram:", err);
              optMediaExists = false;
            }
          }

          opts.push({
            content_text: opt.content_text,
            is_correct: opt.is_correct,
            media_filename: optMediaFilename,
            media_exists: optMediaExists
          });
        }
      }

      processed.push({
        _tempId: `bulk-ai-${index}`,
        part: q.part,
        type: q.type,
        difficulty: q.difficulty,
        content_text: q.content_text,
        topics: q.topics || [],
        pyq_tag: q.pyq_tag || "",
        options: opts,
        media_filename: qMediaFilename,
        media_exists: qMediaExists,
        is_duplicate: false,
        existing_id: null as string | null,
        duplicate_action: 'create',
        status: 'pending'
      });
    }

    // Merge generated images into bulkImagesMap
    setBulkImagesMap(prev => {
      const next = new Map(prev);
      imageMap.forEach((v, k) => next.set(k, v));
      return next;
    });

    // Generate object URLs for previewing and merge them
    const previewUrlsMap = new Map<string, string>();
    imageMap.forEach((file, filename) => {
      previewUrlsMap.set(filename, URL.createObjectURL(file));
    });

    setBulkImagesPreviewMap(prev => {
      const next = new Map(prev);
      previewUrlsMap.forEach((v, k) => next.set(k, v));
      return next;
    });

    // Run duplicate check on the processed questions
    let existingMap = new Map<string, string>();
    try {
      existingMap = await fetchAllExistingQuestions();
    } catch (err) {
      console.error("Failed to check duplicates in cropDiagramsFromPDF:", err);
    }

    processed.forEach(q => {
      const norm = normalizeText(q.content_text || "");
      const existingId = existingMap.get(norm);
      if (existingId) {
        q.is_duplicate = true;
        q.existing_id = existingId;
        q.duplicate_action = 'skip';
      }
    });

    return processed;
  };

  const clearBulkState = () => {
    bulkImagesPreviewMap.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Failed to revoke URL:", e);
      }
    });
    setBulkQuestions([]);
    setBulkImagesMap(new Map());
    setBulkImagesPreviewMap(new Map());
    setBulkSelectedIds([]);
    setBulkPreviewOpen(false);
  };

  const extractRegionAsFile = async (pdfDoc: any, pageNum: number, bbox: number[], filename: string): Promise<File | null> => {
    const page = await pdfDoc.getPage(pageNum);
    const scale = 2.0; 
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Fill canvas background with white to prevent black background transparency issues
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: context, viewport }).promise;

    const yMinPx = (bbox[0] / 1000) * canvas.height;
    const xMinPx = (bbox[1] / 1000) * canvas.width;
    const yMaxPx = (bbox[2] / 1000) * canvas.height;
    const xMaxPx = (bbox[3] / 1000) * canvas.width;

    let width = xMaxPx - xMinPx;
    let height = yMaxPx - yMinPx;

    // Apply 5% padding to each side to avoid cuts (10% extra space overall)
    const padX = width * 0.05;
    const padY = height * 0.05;

    const xMinFinal = Math.max(0, xMinPx - padX);
    const yMinFinal = Math.max(0, yMinPx - padY);
    const xMaxFinal = Math.min(canvas.width, xMaxPx + padX);
    const yMaxFinal = Math.min(canvas.height, yMaxPx + padY);

    const finalWidth = xMaxFinal - xMinFinal;
    const finalHeight = yMaxFinal - yMinFinal;

    if (finalWidth <= 0 || finalHeight <= 0) return null;

    const cropCanvas = document.createElement("canvas");
    const cropCtx = cropCanvas.getContext("2d")!;
    cropCanvas.width = finalWidth;
    cropCanvas.height = finalHeight;
    
    // Fill crop canvas with white to be safe
    cropCtx.fillStyle = "#ffffff";
    cropCtx.fillRect(0, 0, finalWidth, finalHeight);
    cropCtx.drawImage(canvas, xMinFinal, yMinFinal, finalWidth, finalHeight, 0, 0, finalWidth, finalHeight);

    const blob = await new Promise<Blob>((res) => cropCanvas.toBlob((b) => res(b!), "image/png"));
    return new File([blob], filename, { type: "image/png" });
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      let allData: Question[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("exam_questions")
          .select("*, exam_options(id, is_correct)")
          .order("created_at", { ascending: false })
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData.push(...data);
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }
      setQuestions(allData);
    } catch (error: any) {
      toast({ title: "Error fetching questions", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

  const handleQuestionPdfChange = async (file: File | null) => {
    setQuestionPdfFile(file);
    if (!file) {
      setTotalPages(null);
      return;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      setTotalPages(pdfDoc.numPages);
      setStartPage(1);
      setEndPage(pdfDoc.numPages);
    } catch (err) {
      console.error("Failed to parse PDF pages:", err);
    }
  };

  const handleQuestionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQuestionMediaFile(file);
      setQuestionMediaPreview(URL.createObjectURL(file));
    }
  };

  const uploadFileToSupabase = async (file: File, pyqPrefix?: string, customFileName?: string) => {
    const fileExt = file.name.split('.').pop();
    const cleanPrefix = pyqPrefix ? pyqPrefix.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
    const prefixSegment = cleanPrefix ? `${cleanPrefix}_` : "";
    const fileName = customFileName || `${prefixSegment}${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
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
        finalQuestionMediaUrl = await uploadFileToSupabase(questionMediaFile, newQuestion.pyq_tag);
      }

      const questionToSave = { 
        ...newQuestion, 
        topics: newQuestionTopics,
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
            optMediaUrl = await uploadFileToSupabase(opt.file, newQuestion.pyq_tag);
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
    setNewQuestionTopics(q.topics || []);
    setCurrentTopicInput("");
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
    setNewQuestionTopics([]);
    setCurrentTopicInput("");
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
      existingMap = await fetchAllExistingQuestions();
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
    const lookupMap = new Map<string, string>(); // lowercase base filename -> original file.name

    fileArray.forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || "";
      if (allowedExtensions.includes(ext)) {
        imageMap.set(f.name, f);
        lookupMap.set(f.name.toLowerCase().trim(), f.name);
      }
    });

    setBulkImagesMap(imageMap);

    // Generate object URLs for previewing and merge them
    const previewUrlsMap = new Map<string, string>();
    imageMap.forEach((file, filename) => {
      previewUrlsMap.set(filename, URL.createObjectURL(file));
    });
    setBulkImagesPreviewMap(previewUrlsMap);

    // Fetch existing questions to check for duplicates
    let existingMap = new Map<string, string>();
    try {
      existingMap = await fetchAllExistingQuestions();
    } catch (err: any) {
      toast({ title: "Failed to check duplicates", description: err.message, variant: "destructive" });
    }

    const getBaseName = (path: string) => {
      if (!path) return "";
      return path.replace(/\\/g, "/").split("/").pop() || "";
    };

    const getValueIgnoreCase = (row: any, keys: string[]) => {
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const matchedKey = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
        if (matchedKey) return row[matchedKey];
      }
      return undefined;
    };

    // Parse the folder's CSV file
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any, index) => {
          const opts = [];
          
          const checkImage = (filename?: string) => {
            if (!filename) return { name: "", exists: true }; // blank is fine (no image)
            const baseName = getBaseName(filename).toLowerCase().trim();
            if (!baseName) return { name: "", exists: true };
            
            const originalName = lookupMap.get(baseName);
            const exists = !!originalName;
            return { name: originalName || baseName, exists };
          };

          const qImageVal = getValueIgnoreCase(row, ['Question Image', 'QuestionImage', 'Image', 'Media']);
          const qImage = checkImage(qImageVal);
          
          for (let i = 1; i <= 4; i++) {
            const optVal = getValueIgnoreCase(row, [`Option ${i}`, `Option${i}`]);
            if (optVal) {
              const optImageVal = getValueIgnoreCase(row, [`Option Image ${i}`, `OptionImage${i}`, `Option ${i} Image`]);
              const optImage = checkImage(optImageVal);
              const isCorrectVal = getValueIgnoreCase(row, [`Is Correct ${i}`, `IsCorrect${i}`, `Correct ${i}`]);
              
              opts.push({
                content_text: optVal,
                is_correct: isCorrectVal?.toString().toUpperCase() === 'TRUE',
                media_filename: optImage.name,
                media_exists: optImage.exists
              });
            }
          }
          const diffVal = getValueIgnoreCase(row, ['Difficulty']) || 'Medium';
          const rawDiff = diffVal.toLowerCase().trim();
          let finalDiff = 'Medium';
          if (rawDiff === 'easy' || rawDiff === 'low') finalDiff = 'Low';
          if (rawDiff === 'hard' || rawDiff === 'high') finalDiff = 'High';
          
          const content = getValueIgnoreCase(row, ['Content Text', 'Question', 'ContentText', 'Text']) || '';
          const norm = normalizeText(content);
          const existingId = existingMap.get(norm);
          const isDuplicate = !!existingId;

          const partVal = getValueIgnoreCase(row, ['Part']) || 'A';
          const typeVal = getValueIgnoreCase(row, ['Type']) || 'MCQ';
          const topicsVal = getValueIgnoreCase(row, ['Topics (comma separated)', 'Topics', 'Topic']);
          const pyqVal = getValueIgnoreCase(row, ['PYQ Tag', 'PYQTag', 'Tag']) || '';

          return {
            _tempId: `bulk-${index}`,
            part: partVal,
            type: typeVal,
            difficulty: finalDiff,
            content_text: content,
            topics: topicsVal ? topicsVal.split(',').map((t:string) => t.trim()) : [],
            pyq_tag: pyqVal,
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

  const setAllDuplicateActions = (action: 'skip' | 'overwrite' | 'create') => {
    setBulkQuestions(bulkQuestions.map(q => q.is_duplicate ? { ...q, duplicate_action: action } : q));
    toast({ 
      title: `Bulk Resolution Updated`, 
      description: `All duplicate questions have been set to "${action === 'skip' ? 'Skip Import' : action === 'overwrite' ? 'Overwrite & Replace' : 'Create New Copy'}"` 
    });
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
        const customFileNamesMap = new Map<string, string>();
        const prefixCounters = new Map<string, number>();

        Array.from(filesToUpload).forEach((filename) => {
          const fileExt = filename.split('.').pop() || "png";

          // Find PYQ tag for this file from the approved questions referencing it
          const refQ = approved.find(q => 
            q.media_filename === filename || 
            q.options.some((opt: any) => opt.media_filename === filename)
          );
          
          const pyqTag = refQ?.pyq_tag || "IMG";
          const cleanPrefix = pyqTag.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "IMG";
          
          const currentCount = (prefixCounters.get(cleanPrefix) || 0) + 1;
          prefixCounters.set(cleanPrefix, currentCount);

          // Format: CEED2020_img_1_abcd.png
          const uniqueSuffix = Math.random().toString(36).substring(2, 6);
          const customName = `${cleanPrefix}_img_${currentCount}_${uniqueSuffix}.${fileExt}`;
          customFileNamesMap.set(filename, customName);
        });

        const uploadPromises = Array.from(filesToUpload).map(async (filename) => {
          const file = bulkImagesMap.get(filename)!;
          const customName = customFileNamesMap.get(filename);
          const publicUrl = await uploadFileToSupabase(file, undefined, customName);
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

      // Deduplicate the list by db_id to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
      const uniqueApprovedMap = new Map<string, any>();
      approvedWithIds.forEach(q => {
        if (q.db_id) {
          // In case of duplicates in the batch, the later one in the list wins
          uniqueApprovedMap.set(q.db_id, q);
        }
      });
      const uniqueApproved = Array.from(uniqueApprovedMap.values());

      const idsToOverwrite = uniqueApproved
        .filter(q => q.duplicate_action === 'overwrite')
        .map(q => q.db_id);

      // 4. Delete old options for overridden questions (1 DB call)
      if (idsToOverwrite.length > 0) {
        const { error: optDelErr } = await supabase.from('exam_options').delete().in('question_id', idsToOverwrite);
        if (optDelErr) throw optDelErr;
      }

      const questionsToUpsert = uniqueApproved.map(q => ({
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
      uniqueApproved.forEach(q => {
        if ((q.type === 'MCQ' || q.type === 'MSQ' || q.type === 'NAT') && q.options && q.options.length > 0) {
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
      clearBulkState();
      fetchQuestions();
    } catch (err: any) {
      toast({ title: "Bulk Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const uniquePyqTags = useMemo(() => {
    const tags = new Set<string>();
    questions.forEach(q => {
      if (q.pyq_tag) tags.add(q.pyq_tag.trim());
    });
    return Array.from(tags).sort();
  }, [questions]);

  const isQuestionInvalid = (q: Question) => {
    if (q.part === 'B' || q.type === 'SUBJECTIVE') return false;
    const opts = q.exam_options || [];
    if (opts.length === 0) return true;
    if (q.type === 'MCQ' || q.type === 'MSQ' || q.type === 'NAT') {
      const hasCorrect = opts.some(opt => opt.is_correct);
      if (!hasCorrect) return true;
    }
    return false;
  };

  const invalidQuestionsCount = useMemo(() => {
    return questions.filter(isQuestionInvalid).length;
  }, [questions]);

  const filteredQuestions = questions.filter(q => {
    if (filterInvalidOnly && !isQuestionInvalid(q)) return false;
    if (filterPart !== "ALL" && q.part !== filterPart) return false;
    if (filterType !== "ALL" && q.type !== filterType) return false;
    if (filterPyq !== "ALL" && q.pyq_tag !== filterPyq) return false;
    if (searchTopic && !q.topics?.some(t => t.toLowerCase().includes(searchTopic.toLowerCase()))) return false;
    if (searchQuery && !q.content_text?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalQuestionPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const displayQuestions = filteredQuestions.length > 0 
    ? filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : (hideSample ? [] : [sampleQuestion]);

  if (loading) return <div className="flex items-center justify-center py-20 text-foreground/40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 pb-8">
      {/* COMPACT HEADER AND ACTIONS IN SAME ROW */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#262626] tracking-tight">Exam Questions Repository</h1>
          <p className="text-xs text-[#262626]/50">Manage Part A & B questions, media, and bulk uploads.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Standard Bulk Upload Pills */}
          <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-black/5">
            <Button variant="ghost" size="sm" onClick={downloadSampleCSV} className="text-[11px] h-7 px-2.5 gap-1 hover:bg-white rounded text-muted-foreground hover:text-foreground">
              <Download className="w-3 h-3" /> Sample CSV
            </Button>
            <div className="w-[1px] h-3 bg-border/60" />
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-[11px] h-7 px-2.5 gap-1 hover:bg-white rounded">
              <Upload className="w-3 h-3" /> CSV Upload
            </Button>
            <input 
              type="file" 
              accept=".csv,image/*" 
              {...{ webkitdirectory: "", directory: "" }} 
              ref={folderInputRef} 
              onChange={handleFolderUpload} 
              className="hidden" 
            />
            <Button variant="ghost" size="sm" onClick={() => folderInputRef.current?.click()} className="text-[11px] h-7 px-2.5 gap-1 hover:bg-white rounded">
              <Upload className="w-3 h-3" /> Folder Upload
            </Button>
          </div>

          {/* Premium AI Actions */}
          <div className="flex items-center gap-1.5">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setAiImporterOpen(true)} 
              className="gap-1.5 text-[11px] h-7.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-sm shadow-indigo-100/50 rounded-lg"
            >
              <Sparkles className="w-3 h-3" /> AI Importer
            </Button>
            {isAdmin && (
              <Button variant="outline" size="icon" onClick={() => setShowSettings(true)} className="h-7.5 w-7.5 rounded-lg border-primary/20 text-muted-foreground hover:text-foreground hover:bg-muted">
                <Settings className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>


      {/* Audit Warning for Questions Missing Answers */}
      {invalidQuestionsCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-semibold leading-relaxed animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm mb-0.5">Audit Warning: Missing Answers Detected ⚠️</span>
              There are <span className="font-black text-red-950 underline">{invalidQuestionsCount}</span> questions in your repository that lack options or correct answers. Candidates will receive 0/empty marks for these items.
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilterInvalidOnly(!filterInvalidOnly)}
            className={`border-red-200 text-red-800 hover:bg-red-100/50 shrink-0 font-bold h-8 text-[11px] rounded-lg transition-colors ${filterInvalidOnly ? 'bg-red-100 border-red-300 hover:bg-red-200/50' : 'bg-white'}`}
          >
            {filterInvalidOnly ? "Show All Questions" : "Filter Invalid Questions"}
          </Button>
        </div>
      )}

      {/* COMPACT TOP SECTION: ADD/EDIT */}
      <div className={`bg-white rounded-2xl border ${editingId ? 'border-orange-200 shadow-md ring-1 ring-orange-100' : 'border-primary/10 shadow-sm'} p-4 space-y-4 transition-all duration-300`}>
        <div className="flex items-center justify-between border-b border-black/5 pb-2">
          <h2 className="text-sm font-semibold text-[#262626] flex items-center gap-1.5">
            {editingId ? <FileQuestion className="w-4 h-4 text-orange-500" /> : <PlusCircle className="w-4 h-4 text-primary" />} 
            {editingId ? "Edit Question" : "Add New Question"}
          </h2>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-foreground/50 hover:text-foreground h-7 px-2 text-xs">
              Cancel Edit
            </Button>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left Column / Sidebar (Selection, Tag Options, Save) - Smaller width */}
          <div className="w-full lg:w-[26%] bg-background/30 p-4 rounded-xl border border-black/5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/55 border-b border-black/5 pb-1.5">Parameters</h3>
              
              <div>
                <Label className="text-[10px] text-[#262626]/60 font-semibold">Part</Label>
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
                  <SelectTrigger className="h-8 text-xs bg-white mt-1"><SelectValue placeholder="Select Part" /></SelectTrigger>
                  <SelectContent className="max-h-52 overflow-y-auto">
                    <SelectItem value="A">Part A (Objective)</SelectItem>
                    <SelectItem value="B">Part B (Subjective)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] text-[#262626]/60 font-semibold">Type</Label>
                <Select 
                  value={newQuestion.type} 
                  onValueChange={(val: any) => setNewQuestion({...newQuestion, type: val})}
                  disabled={newQuestion.part === 'B'}
                >
                  <SelectTrigger className="h-8 text-xs bg-white mt-1"><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent className="max-h-52 overflow-y-auto">
                    {newQuestion.part === 'A' ? (
                      <>
                        <SelectItem value="MCQ">MCQ</SelectItem>
                        <SelectItem value="MSQ">MSQ</SelectItem>
                        <SelectItem value="NAT">NAT</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="SUBJECTIVE">Subjective</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] text-[#262626]/60 font-semibold">Difficulty</Label>
                <Select value={newQuestion.difficulty} onValueChange={(val: any) => setNewQuestion({...newQuestion, difficulty: val})}>
                  <SelectTrigger className="h-8 text-xs bg-white mt-1"><SelectValue placeholder="Select Difficulty" /></SelectTrigger>
                  <SelectContent className="max-h-52 overflow-y-auto">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] text-[#262626]/60 font-semibold">PYQ Tag</Label>
                <Input 
                  value={newQuestion.pyq_tag || ''} 
                  onChange={(e) => setNewQuestion({...newQuestion, pyq_tag: e.target.value})}
                  placeholder="e.g. CEED 2022"
                  className="h-8 text-xs mt-1 bg-white" 
                />
              </div>

              <div>
                <Label className="text-[10px] text-[#262626]/60 font-semibold">Topics / Tags</Label>
                <div className="mt-1 flex flex-wrap gap-1 p-1.5 bg-white rounded-lg border border-black/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/10 transition-all min-h-[34px]">
                  {newQuestionTopics.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-md font-medium border border-primary/20">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => removeTopicTag(tag)} 
                        className="text-primary/70 hover:text-primary hover:bg-primary/20 rounded-full p-0.5 transition-colors shrink-0"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={newQuestionTopics.length === 0 ? "Type tag & Enter..." : ""}
                    value={currentTopicInput}
                    onChange={(e) => setCurrentTopicInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={handleTagBlur}
                    className="flex-1 bg-transparent border-0 outline-none text-[11px] px-0.5 min-w-[80px] h-5 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-black/5 mt-3">
              <Button 
                variant="default" 
                onClick={triggerPreview} 
                disabled={savingNew} 
                className={`w-full h-9 gap-1.5 font-medium text-xs transition-all shadow-sm ${editingId ? 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white' : 'bg-primary hover:bg-primary/95 text-white'}`}
              >
                {editingId ? "Save Changes" : "Save Question"}
              </Button>
            </div>
          </div>

          {/* Right Column (Main Form Content & Options) - Larger width */}
          <div className="w-full lg:w-[74%] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Question Content */}
              <div className="md:col-span-2">
                <Label className="text-xs text-[#262626]/60 font-semibold mb-1 block">Question Content</Label>
                <div className="bg-white rounded-md border border-black/10 overflow-hidden">
                  <ReactQuill 
                    theme="snow" 
                    value={newQuestion.content_text} 
                    onChange={(content) => setNewQuestion({...newQuestion, content_text: content})}
                    placeholder="Enter the question text here..."
                    className="h-[90px] mb-[45px]"
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{'list': 'bullet'}, {'list': 'ordered'}],
                      ],
                    }}
                  />
                </div>
              </div>

              {/* Question Media */}
              <div className="md:col-span-1">
                <Label className="text-xs text-[#262626]/60 font-semibold mb-1 block">Question Media (Optional)</Label>
                <div className="border border-dashed border-black/10 rounded-xl p-3 flex flex-col items-center justify-center text-center h-[135px] relative overflow-hidden bg-background/50 hover:bg-background transition-colors mt-0.5">
                  {questionMediaPreview ? (
                    <>
                      <img src={questionMediaPreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2 z-0" />
                      <button onClick={() => { setQuestionMediaFile(null); setQuestionMediaPreview(null); setNewQuestion({...newQuestion, media_url: undefined}); }} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50 text-red-500 z-10 border">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 text-foreground/40 mb-1" />
                      <span className="text-[11px] text-foreground/60">Click to upload image</span>
                      <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleQuestionFileChange} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Options Management (Only for MCQ/MSQ/NAT) */}
            {(newQuestion.type === 'MCQ' || newQuestion.type === 'MSQ' || newQuestion.type === 'NAT') && (
              <div className="border border-black/5 rounded-xl p-4 bg-background/45">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                    {newQuestion.type === 'NAT' ? "Acceptable Answers (Exact Matches)" : "Answer Options"}
                  </Label>
                  <Button size="sm" variant="outline" onClick={addOption} className="h-7 gap-1 bg-white border-black/10 hover:bg-muted text-[10px]">
                    <PlusCircle className="w-3 h-3 text-primary" /> 
                    {newQuestion.type === 'NAT' ? "Add Answer" : "Add Option"}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${opt.is_correct ? 'border-green-300 bg-green-50/30' : 'border-black/5 bg-white'}`}>
                      {/* Correct Checkbox (Hidden for NAT) */}
                      {newQuestion.type !== 'NAT' && (
                        <button 
                          onClick={() => {
                            if (newQuestion.type === 'MCQ') {
                              const newOpts = options.map((o, i) => ({ ...o, is_correct: i === idx ? !o.is_correct : false }));
                              setOptions(newOpts);
                            } else {
                              updateOption(idx, 'is_correct', !opt.is_correct);
                            }
                          }}
                          className={`mt-1 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${opt.is_correct ? 'bg-green-500 border-green-600 text-white' : 'border-black/20 text-transparent hover:border-black/35'}`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                      )}
                      
                      {/* NAT specific icon indicator */}
                      {newQuestion.type === 'NAT' && (
                        <div className="mt-1 shrink-0 w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-1.5">
                        <Input 
                          value={opt.content_text} 
                          onChange={(e) => updateOption(idx, 'content_text', e.target.value)} 
                          placeholder={newQuestion.type === 'NAT' ? `Answer ${idx + 1}` : `Option ${idx + 1}...`}
                          className="h-7 bg-transparent text-[11px]"
                        />
                        {/* Option Media Upload (Hide for NAT) */}
                        {newQuestion.type !== 'NAT' && (
                          <div className="flex items-center gap-1.5">
                            <Label className="text-[8px] text-foreground/50 border border-dashed border-black/20 rounded px-1.5 py-0.5 cursor-pointer hover:bg-black/5 flex items-center gap-0.5">
                              <ImageIcon className="w-2 h-2" /> 
                              {opt.file ? opt.file.name : (opt.media_url ? "Attached" : "Attach Image")}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => updateOptionFile(idx, e.target.files ? e.target.files[0] : null)} />
                            </Label>
                            {(opt.file || opt.media_url) && (
                              <button onClick={() => { updateOptionFile(idx, null); updateOption(idx, 'media_url', undefined); }} className="text-[8px] text-red-500 hover:underline font-medium">Remove</button>
                            )}
                          </div>
                        )}
                      </div>

                      <button onClick={() => removeOption(idx)} className="mt-1 shrink-0 p-0.5 text-foreground/30 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {options.length === 0 && (
                  <div className="text-[11px] text-foreground/40 italic text-center py-2.5 bg-white/50 rounded-lg border border-dashed border-black/5 mt-1">
                    {newQuestion.type === 'NAT' ? 'No acceptable answers added. Click "Add Answer".' : 'No options added yet. Click "Add Option".'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    <div className="border-t border-[#262626]/10 pt-8" />

      {/* BOTTOM SECTION: EXISTING LIST & FILTERS */}
      <div>
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {/* COMBINED MINIMAL TOOLBAR & FILTER HEADER */}
          <div className="p-3.5 bg-muted/40 border-b border-black/5 flex flex-col xl:flex-row items-center justify-between gap-3.5">
            <div className="flex items-center gap-2 shrink-0 self-start xl:self-auto">
              <h3 className="text-sm font-semibold text-[#262626]">Question Bank</h3>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                {filteredQuestions.length} of {questions.length}
              </span>
            </div>
            
            {/* Integrated Compact Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
              <Input 
                placeholder="Search text..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs bg-white border-black/10 rounded-lg w-full sm:w-48"
              />
              <Input 
                placeholder="Search topics..." 
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                className="h-8 text-xs bg-white border-black/10 rounded-lg w-full sm:w-40"
              />
              <Select value={filterPyq} onValueChange={(val) => setFilterPyq(val)}>
                <SelectTrigger className="h-8 text-xs bg-white border-black/10 rounded-lg min-w-[140px] w-full sm:w-auto"><SelectValue placeholder="All PYQs" /></SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto min-w-[180px] whitespace-nowrap">
                  <SelectItem value="ALL">All PYQs</SelectItem>
                  {uniquePyqTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPart} onValueChange={(val) => setFilterPart(val)}>
                <SelectTrigger className="h-8 text-xs bg-white border-black/10 rounded-lg w-full sm:w-28"><SelectValue placeholder="Part" /></SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto min-w-[130px] whitespace-nowrap">
                  <SelectItem value="ALL">Part (All)</SelectItem>
                  <SelectItem value="A">Part A</SelectItem>
                  <SelectItem value="B">Part B</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(val) => setFilterType(val)}>
                <SelectTrigger className="h-8 text-xs bg-white border-black/10 rounded-lg w-full sm:w-32"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto min-w-[140px] whitespace-nowrap">
                  <SelectItem value="ALL">Type (All)</SelectItem>
                  <SelectItem value="MCQ">MCQ</SelectItem>
                  <SelectItem value="MSQ">MSQ</SelectItem>
                  <SelectItem value="NAT">NAT</SelectItem>
                  <SelectItem value="SUBJECTIVE">SUB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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

            {/* Pagination Controls */}
            {totalQuestionPages > 1 && (
              <div className="flex items-center justify-between border-t border-black/5 p-4 bg-background/30">
                <span className="text-xs text-foreground/50">
                  Showing {Math.min(filteredQuestions.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredQuestions.length, currentPage * itemsPerPage)} of {filteredQuestions.length} questions
                </span>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 text-xs gap-1 border-black/10"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalQuestionPages }).map((_, i) => {
                    const page = i + 1;
                    // Show only pages close to currentPage if totalQuestionPages is large
                    if (totalQuestionPages > 6 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalQuestionPages) {
                      if (page === 2 || page === totalQuestionPages - 1) {
                        return <span key={page} className="px-1 text-foreground/30 text-xs">...</span>;
                      }
                      return null;
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 text-xs border-black/10 ${currentPage === page ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.min(totalQuestionPages, prev + 1))}
                    disabled={currentPage === totalQuestionPages}
                    className="h-8 text-xs gap-1 border-black/10"
                  >
                    Next
                  </Button>
                </div>
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
      <Dialog open={bulkPreviewOpen} onOpenChange={(open) => { if (!open) clearBulkState(); }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 border-b border-black/5 shrink-0">
            <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Bulk Upload Preview</DialogTitle>
            <DialogDescription>Review the parsed questions. Select questions to approve or reject them.</DialogDescription>
            
            {/* Filters & Bulk Actions */}
            <div className="flex flex-col gap-4 pt-4 border-t mt-4 border-black/5">
              <div className="flex flex-col md:flex-row justify-between gap-4">
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

              {/* Global Duplicate Actions */}
              {bulkQuestions.some(q => q.is_duplicate) && (
                <div className="flex items-center gap-2 border-t pt-3 border-black/5 flex-wrap">
                  <span className="text-xs text-foreground/60 font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md">
                    ⚠️ Duplicate Resolution for All:
                  </span>
                  <Button size="sm" variant="outline" className="text-xs border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-800 h-8" onClick={() => setAllDuplicateActions('skip')}>
                    Skip All
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-800 h-8" onClick={() => setAllDuplicateActions('overwrite')}>
                    Overwrite & Replace All
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-800 h-8" onClick={() => setAllDuplicateActions('create')}>
                    Create Copy All
                  </Button>
                </div>
              )}
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
                  
                  <div className="mt-2 space-y-1">
                    <Label className="text-[10px] font-semibold text-foreground/40">Question Text (Editable)</Label>
                    <Textarea 
                      value={bq.content_text} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setBulkQuestions(prev => prev.map(q => q._tempId === bq._tempId ? { ...q, content_text: val } : q));
                      }}
                      className="text-sm font-medium w-full min-h-[60px] bg-background border border-black/10 rounded-xl p-2.5 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

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
                      {bq.media_exists && bulkImagesPreviewMap.has(bq.media_filename) ? (
                        <div className="inline-block border rounded-lg overflow-hidden bg-background">
                          <img 
                            src={bulkImagesPreviewMap.get(bq.media_filename)} 
                            alt="Question Image Preview" 
                            className="max-h-32 object-contain" 
                          />
                        </div>
                      ) : bq.media_exists ? (
                        <div className="text-xs text-foreground/40">Loading image...</div>
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
                          <div className="flex items-center gap-2 w-full">
                            {opt.is_correct ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" /> : <div className="w-3.5 h-3.5 shrink-0 border rounded-full border-black/20" />}
                            <Input
                              value={opt.content_text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkQuestions(prev => prev.map(q => {
                                  if (q._tempId !== bq._tempId) return q;
                                  const newOpts = [...q.options];
                                  newOpts[oIdx] = { ...newOpts[oIdx], content_text: val };
                                  return { ...q, options: newOpts };
                                }));
                              }}
                              className="h-8 text-xs bg-background border border-black/10 rounded-lg px-2.5 py-1 w-full"
                            />
                            {opt.media_filename && !opt.media_exists && (
                              <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 font-mono ml-2 shrink-0">
                                ⚠️ Missing image: {opt.media_filename}
                              </span>
                            )}
                          </div>
                          {opt.media_filename && opt.media_exists && bulkImagesPreviewMap.has(opt.media_filename) && (
                            <div className="pl-5">
                              <div className="inline-block border rounded-md overflow-hidden bg-background">
                                <img 
                                  src={bulkImagesPreviewMap.get(opt.media_filename)} 
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
             <Button variant="outline" onClick={clearBulkState} disabled={isUploadingBulk}>Cancel</Button>
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

      {/* SETTINGS MODAL FOR GEMINI KEY */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[480px] w-[90vw] flex flex-col p-6 gap-0 shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> AI Importer Settings</DialogTitle>
            <DialogDescription>Configure the Google Gemini API key and model selection.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Google Gemini API Key</Label>
              <Input 
                id="gemini-key"
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <p className="text-xs text-foreground/40 leading-normal">
                You can obtain a free API key by visiting <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google AI Studio</a>. No billing setup or credit cards are required.
              </p>
            </div>
 
            <div className="space-y-2">
              <Label htmlFor="gemini-model">Gemini Model Selection</Label>
              <Select value={geminiModel} onValueChange={setGeminiModel}>
                <SelectTrigger id="gemini-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto">
                  <SelectItem value="gemini-flash-latest">Gemini Flash Latest (Recommended — Always Active & Free)</SelectItem>
                  <SelectItem value="gemini-pro-latest">Gemini Pro Latest (Best Quality — Free with limits)</SelectItem>
                  <SelectItem value="gemini-3.5-flash">Gemini 3.5 Flash (Newest Release)</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Fast Alternative)</SelectItem>
                </SelectContent>
              </Select>
            </div>
 
            <div className="pt-2 flex flex-col gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={testApiKey} 
                disabled={testingKey}
                className="w-full text-xs"
              >
                {testingKey ? "Testing..." : "Test API Key Connection"}
              </Button>
              {testResult && (
                <div className="text-[11px] p-3 rounded-xl border border-black/5 bg-black/5 leading-relaxed break-words whitespace-pre-wrap font-mono max-h-[150px] overflow-y-auto text-foreground/80 w-full">
                  {testResult}
                </div>
              )}
            </div>
          </div>
 
          <DialogFooter className="border-t border-black/5 pt-4 mt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button onClick={saveGeminiKey} className="bg-primary hover:bg-primary/90">Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI IMPORTER MODAL */}
      <Dialog open={aiImporterOpen} onOpenChange={setAiImporterOpen}>
        <DialogContent className="max-w-xl shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Paper Importer</DialogTitle>
            <DialogDescription>Extract text, options, correct answers, and diagrams automatically using Google Gemini 1.5 Pro.</DialogDescription>
          </DialogHeader>
          
          {!isProcessingAI ? (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-pyq-tag">PYQ Tag / Exam Label</Label>
                <Input 
                  id="ai-pyq-tag"
                  placeholder="e.g. CEED 2024"
                  value={aiPyqTag}
                  onChange={(e) => setAiPyqTag(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Paper PDF</Label>
                  <div className="border border-dashed border-black/10 rounded-xl p-4 text-center hover:bg-black/5 cursor-pointer relative transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleQuestionPdfChange(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-foreground/30 mx-auto mb-2" />
                    <span className="text-xs font-medium block truncate">
                      {questionPdfFile ? questionPdfFile.name : "Select PDF"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Answer Key PDF</Label>
                  <div className="border border-dashed border-black/10 rounded-xl p-4 text-center hover:bg-black/5 cursor-pointer relative transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setAnswerKeyPdfFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-foreground/30 mx-auto mb-2" />
                    <span className="text-xs font-medium block truncate">
                      {answerKeyPdfFile ? answerKeyPdfFile.name : "Select PDF"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 border-black/5">
                <div className="space-y-2">
                  <Label htmlFor="start-page">Start Page to Parse</Label>
                  <Input 
                    id="start-page"
                    type="number"
                    min={1}
                    max={totalPages || 100}
                    value={startPage}
                    onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-page">End Page to Parse {totalPages ? `(of ${totalPages})` : ""}</Label>
                  <Input 
                    id="end-page"
                    type="number"
                    min={startPage}
                    max={totalPages || 100}
                    value={endPage}
                    onChange={(e) => setEndPage(Math.max(startPage, parseInt(e.target.value) || startPage))}
                  />
                </div>
              </div>
              <p className="text-[10px] text-foreground/40 leading-normal">
                💡 <b>Tip:</b> Parsing page ranges (e.g. 5-10 pages at a time) prevents hitting AI response size limits and ensures no questions get missed.
              </p>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center space-y-6">
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary absolute opacity-20" />
                <span className="text-xs font-bold text-primary">{aiProcessingProgress}%</span>
              </div>
              
              <div className="w-full space-y-2 px-4">
                <div className="w-full bg-black/5 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out rounded-full" 
                    style={{ width: `${aiProcessingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-foreground/40 font-medium">
                  <span>{aiProcessingStatus}</span>
                  <span>{aiProcessingProgress}%</span>
                </div>
              </div>
              
              <p className="text-xs text-foreground/40 text-center max-w-sm">
                Processing pages in small batches to ensure 100% extraction completeness and crop diagrams accurately. Please keep this modal open.
              </p>
            </div>
          )}

          {!isProcessingAI && (
            <DialogFooter className="border-t border-black/5 pt-4">
              <Button variant="outline" onClick={() => setAiImporterOpen(false)}>Cancel</Button>
              <Button 
                onClick={processAIImporter} 
                disabled={!questionPdfFile || !answerKeyPdfFile || !aiPyqTag}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Sparkles className="w-4 h-4" /> Start Extraction
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
