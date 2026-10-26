import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download, Folder, RefreshCw, Sparkles, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkExamUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  testSections: any[];
  testCategory: string;
  selectedTemplate: any;
  onQuestionsImported: (importedQuestions: any[], mode: 'replace' | 'append') => void;
}

export default function BulkExamUploadModal({
  isOpen,
  onClose,
  testSections,
  testCategory,
  selectedTemplate,
  onQuestionsImported
}: BulkExamUploadModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [imagesMap, setImagesMap] = useState<Map<string, File>>(new Map());
  const [fileName, setFileName] = useState<string>("");
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: "" });

  const resetState = () => {
    setParsedQuestions([]);
    setImagesMap(new Map());
    setFileName("");
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleClose = () => {
    if (uploading) return;
    resetState();
    onClose();
  };

  // -------------------------------------------------------------
  // SAMPLE CSV DOWNLOAD
  // -------------------------------------------------------------
  const handleDownloadSampleCsv = () => {
    const headers = [
      "Part",
      "Type",
      "Content Text",
      "Marks",
      "Difficulty",
      "Option 1",
      "Is Correct 1",
      "Option 2",
      "Is Correct 2",
      "Option 3",
      "Is Correct 3",
      "Option 4",
      "Is Correct 4",
      "Topics (comma separated)",
      "PYQ Tag",
      "media_filename"
    ];

    const sampleRows = [
      [
        "A",
        "NAT",
        "Calculate the total number of surfaces in the truncated prism shown in the figure.",
        "4",
        "Medium",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Geometry, 3D Visualization",
        "CEED 2024",
        ""
      ],
      [
        "A",
        "MSQ",
        "Which of the following color schemes utilize complementary pairings? (Select all that apply)",
        "4",
        "Medium",
        "Blue and Orange",
        "TRUE",
        "Red and Green",
        "TRUE",
        "Yellow and Purple",
        "TRUE",
        "Red and Blue",
        "FALSE",
        "Color Theory, Fundamentals",
        "UCEED 2023",
        ""
      ],
      [
        "A",
        "MCQ",
        "Which printing process relies on the principle of oil and water repulsion?",
        "3",
        "Low",
        "Lithography",
        "TRUE",
        "Gravure",
        "FALSE",
        "Screen Printing",
        "FALSE",
        "Flexography",
        "FALSE",
        "Printing Technology, Materials",
        "NID 2022",
        ""
      ],
      [
        "B",
        "SUBJECTIVE",
        "Design a compact portable emergency stretcher for rescue operations in flooded urban areas. Show user ergonomics and key deployment steps.",
        "50",
        "High",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Product Design, Ergonomics, Problem Solving",
        "CEED 2024 Part B",
        ""
      ]
    ];

    const csvContent = [headers.join(","), ...sampleRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `exam_paper_template_${(selectedTemplate?.id || "mock").toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // PARSE CSV DATA
  // -------------------------------------------------------------
  const parseRows = (rows: any[], imageFilesMap: Map<string, File> = new Map()) => {
    const parsed = rows.map((row: any, index: number) => {
      const part = (row["Part"] || "A").trim().toUpperCase() === "B" ? "B" : "A";
      const rawType = (row["Type"] || (part === "B" ? "SUBJECTIVE" : "MCQ")).trim().toUpperCase();
      let type = "MCQ";
      if (rawType === "NAT" || rawType === "MSQ" || rawType === "SUBJECTIVE") {
        type = rawType;
      }

      const opts: any[] = [];
      if (type !== "NAT" && type !== "SUBJECTIVE") {
        for (let i = 1; i <= 4; i++) {
          const optText = row[`Option ${i}`];
          if (optText !== undefined && optText !== null && String(optText).trim() !== "") {
            opts.push({
              content_text: String(optText).trim(),
              is_correct: String(row[`Is Correct ${i}`] || "").trim().toUpperCase() === "TRUE"
            });
          }
        }
      } else if (type === "NAT") {
        const natAns = row["Option 1"] || row["Answer"] || "";
        if (natAns) {
          opts.push({
            content_text: String(natAns).trim(),
            is_correct: true
          });
        }
      }

      const rawDiff = (row["Difficulty"] || "Medium").toLowerCase().trim();
      let difficulty = "Medium";
      if (rawDiff === "low" || rawDiff === "easy") difficulty = "Low";
      if (rawDiff === "high" || rawDiff === "hard") difficulty = "High";

      const rawMarks = parseFloat(row["Marks"]);
      let marks = !isNaN(rawMarks) && rawMarks > 0 ? rawMarks : (part === "B" ? 50 : 2);

      const mediaFilename = (row["media_filename"] || "").trim();
      const hasLocalImage = mediaFilename && imageFilesMap.has(mediaFilename.toLowerCase());

      return {
        _tempId: `bulk-exam-q-${index}-${Date.now()}`,
        part,
        type,
        content_text: row["Content Text"] || row["Question"] || "",
        marks,
        difficulty,
        options: opts,
        topics: row["Topics (comma separated)"]
          ? row["Topics (comma separated)"].split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
        pyq_tag: (row["PYQ Tag"] || "").trim(),
        media_filename: mediaFilename,
        has_local_image: hasLocalImage
      };
    }).filter(q => q.content_text.trim() !== "");

    setParsedQuestions(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        parseRows(results.data);
      },
      error: (err) => {
        toast({ title: "Failed to parse CSV", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const csvFile = fileList.find(f => f.name.toLowerCase().endsWith(".csv"));
    if (!csvFile) {
      toast({
        title: "CSV Not Found in Folder",
        description: "Please make sure your folder contains a .csv question file.",
        variant: "destructive"
      });
      return;
    }

    setFileName(`${csvFile.name} (+ ${fileList.length - 1} media files)`);

    // Build image files map
    const imageMap = new Map<string, File>();
    fileList.forEach(f => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) {
        imageMap.set(f.name.toLowerCase(), f);
      }
    });
    setImagesMap(imageMap);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        parseRows(results.data, imageMap);
      },
      error: (err) => {
        toast({ title: "Failed to parse CSV", description: err.message, variant: "destructive" });
      }
    });
  };

  // -------------------------------------------------------------
  // TEMPLATE REQUIREMENTS COMPARISON
  // -------------------------------------------------------------
  const rubricStats = testSections.map(sec => {
    const sectionQs = parsedQuestions.filter(q => q.part === sec.part);
    const typeBreakdown: Record<string, { required: number; found: number; matched: boolean }> = {};
    let allTypesMatched = true;

    for (const [type, requiredCount] of Object.entries(sec.requirements)) {
      const found = sectionQs.filter(q => q.type === type).length;
      const matched = found === requiredCount;
      typeBreakdown[type] = { required: requiredCount as number, found, matched };
      if (!matched) allTypesMatched = false;
    }

    const partBMarksTotal = sec.part === "B" ? sectionQs.reduce((acc, q) => acc + (q.marks || 0), 0) : null;

    return {
      part: sec.part,
      duration: sec.duration,
      types: typeBreakdown,
      allMatched: allTypesMatched,
      partBMarksTotal,
      totalFound: sectionQs.length
    };
  });

  const allRequirementsMatched = rubricStats.every(s => s.allMatched);

  // -------------------------------------------------------------
  // CONFIRM & INSERT QUESTIONS INTO EXAM PAPER
  // -------------------------------------------------------------
  const handleConfirmImport = async () => {
    if (parsedQuestions.length === 0) return;
    setUploading(true);
    setUploadProgress({ current: 0, total: parsedQuestions.length, status: "Uploading media assets..." });

    try {
      const createdQuestions: any[] = [];

      for (let i = 0; i < parsedQuestions.length; i++) {
        const q = parsedQuestions[i];
        setUploadProgress({
          current: i + 1,
          total: parsedQuestions.length,
          status: `Creating question ${i + 1} of ${parsedQuestions.length} (${q.type})...`
        });

        // 1. Upload local media image if present
        let finalMediaUrl: string | null = null;
        if (q.media_filename && imagesMap.has(q.media_filename.toLowerCase())) {
          const imgFile = imagesMap.get(q.media_filename.toLowerCase())!;
          const fileExt = imgFile.name.split(".").pop() || "jpg";
          const uniquePath = `exam-media/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

          const { error: upErr } = await supabase.storage
            .from("question-media")
            .upload(uniquePath, imgFile, { upsert: true, contentType: imgFile.type || "image/jpeg" });

          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage
              .from("question-media")
              .getPublicUrl(uniquePath);
            finalMediaUrl = publicUrl;
          }
        }

        // 2. Insert into exam_questions
        const { data: qData, error: qErr } = await supabase
          .from("exam_questions")
          .insert({
            type: q.type,
            part: q.part,
            difficulty: q.difficulty,
            content_text: q.content_text,
            media_url: finalMediaUrl,
            topics: q.topics || [],
            pyq_tag: q.pyq_tag || null
          })
          .select()
          .single();

        if (qErr) throw qErr;

        // 3. Insert options if non-subjective
        if (q.options && q.options.length > 0) {
          const optsPayload = q.options.map((opt: any) => ({
            question_id: qData.id,
            content_text: opt.content_text,
            is_correct: opt.is_correct
          }));

          const { error: optErr } = await supabase.from("exam_options").insert(optsPayload);
          if (optErr) console.warn("Failed inserting options for question:", optErr);
        }

        createdQuestions.push({
          ...qData,
          marks: q.marks,
          options: q.options || []
        });
      }

      onQuestionsImported(createdQuestions, importMode);
      toast({
        title: "Paper Questions Imported!",
        description: `Successfully attached ${createdQuestions.length} questions to this exam paper.`
      });

      handleClose();
    } catch (err: any) {
      console.error("Bulk upload into exam failed:", err);
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const filteredPreview = parsedQuestions.filter(q => q.part === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6 rounded-2xl overflow-hidden">
        <DialogHeader className="border-b border-black/5 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Upload className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold text-[#262626]">
                  Bulk Upload Questions for this Exam
                </DialogTitle>
                <DialogDescription className="text-xs text-foreground/50">
                  Import a complete question set directly into {selectedTemplate?.name || "this exam paper"}.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSampleCsv}
              className="text-xs font-semibold gap-1.5 border-black/10 hover:bg-black/5"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV Format
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-6">
          {/* Upload Dropzones */}
          {parsedQuestions.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CSV Upload */}
              <label className="border-2 border-dashed border-black/10 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <FileText className="w-10 h-10 text-primary mb-3" />
                <span className="font-bold text-sm text-[#262626]">Upload Question CSV</span>
                <span className="text-xs text-foreground/50 mt-1">Single spreadsheet with Part A & B questions</span>
                <span className="mt-4 px-3 py-1 bg-white border border-black/10 rounded-lg text-xs font-semibold text-primary shadow-xs">
                  Choose .csv file
                </span>
              </label>

              {/* Folder Upload */}
              <label className="border-2 border-dashed border-black/10 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                <input
                  type="file"
                  ref={folderInputRef}
                  // @ts-ignore
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  className="hidden"
                  onChange={handleFolderUpload}
                />
                <Folder className="w-10 h-10 text-amber-600 mb-3" />
                <span className="font-bold text-sm text-[#262626]">Upload Folder (CSV + Images)</span>
                <span className="text-xs text-foreground/50 mt-1">Contains CSV and diagram / reference images</span>
                <span className="mt-4 px-3 py-1 bg-white border border-black/10 rounded-lg text-xs font-semibold text-amber-700 shadow-xs">
                  Select Folder
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3.5 bg-black/[0.02] border border-black/10 rounded-xl">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-[#262626]">{fileName}</span>
                  <span className="text-foreground/50">({parsedQuestions.length} total questions parsed)</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="h-7 text-xs text-foreground/60 hover:text-red-600"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-upload
                </Button>
              </div>

              {/* Template Rubric Matcher Breakdown */}
              <div className="p-4 rounded-xl border border-black/10 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                    Template Rubric Compliance ({selectedTemplate?.name})
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    allRequirementsMatched 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {allRequirementsMatched ? "✓ Exact Template Match" : "⚠️ Requirement Discrepancy"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {rubricStats.map(stat => (
                    <div key={stat.part} className="p-3 rounded-lg border border-black/5 bg-[#F8F9FA] space-y-2">
                      <div className="flex items-center justify-between font-bold text-xs text-[#262626]">
                        <span>Part {stat.part} Section</span>
                        <span className="text-foreground/50">{stat.totalFound} Questions</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stat.types).map(([type, counts]) => (
                          <div 
                            key={type} 
                            className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1.5 ${
                              counts.matched 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <span>{type}:</span>
                            <span className="font-bold">{counts.found} / {counts.required} req</span>
                            {counts.matched ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-amber-600" />}
                          </div>
                        ))}
                      </div>
                      {stat.part === "B" && stat.partBMarksTotal !== null && (
                        <div className="text-[11px] font-semibold text-foreground/60 pt-1 border-t border-black/5">
                          Part B Marks: <span className="font-bold text-primary">{stat.partBMarksTotal} Total</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="flex items-center justify-between p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-[#262626] block">Import Mode</span>
                  <span className="text-[11px] text-foreground/60">Choose how to handle existing questions in this builder</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      importMode === 'replace' ? 'bg-primary text-white shadow-xs' : 'bg-white text-foreground/70 border border-black/10'
                    }`}
                  >
                    Replace Current ({parsedQuestions.length} Qs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      importMode === 'append' ? 'bg-primary text-white shadow-xs' : 'bg-white text-foreground/70 border border-black/10'
                    }`}
                  >
                    Append to Existing
                  </button>
                </div>
              </div>

              {/* Question Preview Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5 bg-black/5 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveTab('A')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        activeTab === 'A' ? 'bg-white text-primary shadow-xs' : 'text-foreground/60'
                      }`}
                    >
                      Part A ({parsedQuestions.filter(q => q.part === 'A').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('B')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        activeTab === 'B' ? 'bg-white text-primary shadow-xs' : 'text-foreground/60'
                      }`}
                    >
                      Part B ({parsedQuestions.filter(q => q.part === 'B').length})
                    </button>
                  </div>

                  <span className="text-xs text-foreground/50 font-medium">
                    Reviewing {filteredPreview.length} questions in Part {activeTab}
                  </span>
                </div>

                <div className="border border-black/10 rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#262626]/5 border-b border-black/10 uppercase text-foreground/60 sticky top-0 bg-[#FAFAFA]">
                      <tr>
                        <th className="p-3 w-16">#</th>
                        <th className="p-3 w-24">Type</th>
                        <th className="p-3 w-16">Marks</th>
                        <th className="p-3">Content Snippet</th>
                        <th className="p-3 w-28">Media</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredPreview.map((q, idx) => (
                        <tr key={q._tempId} className="hover:bg-black/[0.02]">
                          <td className="p-3 font-bold text-foreground/50">{idx + 1}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded font-bold bg-black/5 text-[#262626] border border-black/10 text-[10px]">
                              {q.type}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-primary">{q.marks}M</td>
                          <td className="p-3 font-medium text-foreground/80 line-clamp-1">
                            {q.content_text}
                          </td>
                          <td className="p-3">
                            {q.has_local_image ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Image Linked
                              </span>
                            ) : q.media_filename ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                Missing File
                              </span>
                            ) : (
                              <span className="text-foreground/30">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-black/5 pt-4 shrink-0 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={uploading}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={parsedQuestions.length === 0 || uploading}
            onClick={handleConfirmImport}
            className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadProgress.status || "Importing Questions..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Add {parsedQuestions.length} Questions to Exam
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
