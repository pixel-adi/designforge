import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit, Trash2, PlusCircle, ChevronLeft, ChevronRight, Upload, X, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const PAGE_SIZE = 50;

interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  content_text: string | null;
  file_url: string | null;
  external_url: string | null;
  category: string;
  target_exam: string;
  target_level: string;
  is_focus_batch_exclusive: boolean;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

interface MaterialForm {
  title: string;
  description: string;
  content_text: string;
  file_url: string;
  external_url: string;
  category: string;
  target_exam: string;
  target_level: string;
  is_focus_batch_exclusive: boolean;
  display_order: number;
  is_visible: boolean;
}

const emptyForm: MaterialForm = {
  title: "",
  description: "",
  content_text: "",
  file_url: "",
  external_url: "",
  category: "",
  target_exam: "all",
  target_level: "both",
  is_focus_batch_exclusive: false,
  display_order: 0,
  is_visible: true,
};

export default function AdminStudyMaterials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterExam, setFilterExam] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MaterialForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<StudyMaterial | null>(null);

  // Fetch materials
  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin-study-materials", page, search, filterCategory, filterExam],
    queryFn: async () => {
      let query = supabase
        .from("study_materials")
        .select("*", { count: "exact" })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.ilike("title", `%${search}%`);
      }
      if (filterCategory !== "ALL") {
        query = query.eq("category", filterCategory);
      }
      if (filterExam !== "ALL") {
        query = query.or(`target_exam.eq.${filterExam},target_exam.eq.all`);
      }

      const { data, error, count } = await query;
      if (error) {
        toast({ title: "Error loading materials", description: error.message, variant: "destructive" });
        throw error;
      }
      return { materials: (data || []) as StudyMaterial[], total: count || 0 };
    },
    placeholderData: (prev) => prev,
  });

  // Fetch distinct categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-study-materials-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("category");
      if (error) throw error;
      const unique = Array.from(new Set((data || []).map((d: any) => d.category).filter(Boolean)));
      return unique.sort() as string[];
    },
  });

  const categories = categoriesData || [];
  const materials = data?.materials || [];
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  // Upload file to Supabase Storage
  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from("content-uploads").upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("content-uploads").getPublicUrl(fileName);
    return publicUrl;
  };

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title is required.");
      if (!form.category.trim()) throw new Error("Category is required.");

      let fileUrl = form.file_url;

      // Upload new file if selected
      if (uploadFile) {
        setUploading(true);
        try {
          fileUrl = await uploadFileToSupabase(uploadFile);
        } finally {
          setUploading(false);
        }
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        content_text: form.content_text || null,
        file_url: fileUrl || null,
        external_url: form.external_url.trim() || null,
        category: form.category.trim(),
        target_exam: form.target_exam,
        target_level: form.target_level,
        is_focus_batch_exclusive: form.is_focus_batch_exclusive,
        display_order: form.display_order,
        is_visible: form.is_visible,
      };

      if (editingId) {
        const { error } = await supabase.from("study_materials").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("study_materials").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: editingId ? "Material updated successfully." : "Material created successfully." });
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["admin-study-materials"] });
      queryClient.invalidateQueries({ queryKey: ["admin-study-materials-categories"] });
    },
    onError: (err: any) => {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Study material has been deleted." });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-study-materials"] });
      queryClient.invalidateQueries({ queryKey: ["admin-study-materials-categories"] });
    },
    onError: (err: any) => {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  // Visibility toggle mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from("study_materials").update({ is_visible }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-study-materials"] });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setUploadFile(null);
    setDialogOpen(true);
  };

  const openEdit = (material: StudyMaterial) => {
    setEditingId(material.id);
    setForm({
      title: material.title || "",
      description: material.description || "",
      content_text: material.content_text || "",
      file_url: material.file_url || "",
      external_url: material.external_url || "",
      category: material.category || "",
      target_exam: material.target_exam || "all",
      target_level: material.target_level || "both",
      is_focus_batch_exclusive: material.is_focus_batch_exclusive || false,
      display_order: material.display_order || 0,
      is_visible: material.is_visible ?? true,
    });
    setUploadFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setUploadFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const examBadgeColor = (exam: string) => {
    switch (exam) {
      case "UCEED": return "bg-blue-100 text-blue-800";
      case "CEED": return "bg-purple-100 text-purple-800";
      case "NID": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const isBusy = saveMutation.isPending || uploading;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Study Materials</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Manage study content, resources, and reference materials for students.</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-2 h-9">
          <PlusCircle className="w-4 h-4" /> New Material
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); setPage(0); }}>
          <SelectTrigger className="h-9 w-48 text-sm bg-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterExam} onValueChange={(val) => { setFilterExam(val); setPage(0); }}>
          <SelectTrigger className="h-9 w-40 text-sm bg-white">
            <SelectValue placeholder="All Exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Exams</SelectItem>
            <SelectItem value="UCEED">UCEED</SelectItem>
            <SelectItem value="CEED">CEED</SelectItem>
            <SelectItem value="NID">NID</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by title…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="h-9 w-64 text-sm"
        />

        {data?.total !== undefined && (
          <span className="text-xs text-foreground/50 whitespace-nowrap">{data.total} materials</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Exam</th>
              <th className="p-4 font-semibold text-center">Exclusive</th>
              <th className="p-4 font-semibold text-center">Visibility</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {materials.map(material => (
              <tr key={material.id} className="hover:bg-black/5 transition-colors">
                <td className="p-4">
                  <div className="flex flex-col">
                    <div className="font-semibold text-sm text-[#262626]">{material.title}</div>
                    {material.description && (
                      <div className="text-xs text-foreground/50 mt-0.5 line-clamp-1">{material.description}</div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    {material.category}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${examBadgeColor(material.target_exam)}`}>
                    {material.target_exam === "all" ? "All Exams" : material.target_exam}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {material.is_focus_batch_exclusive && (
                    <span title="Focus Batch Exclusive" className="text-lg">🌟</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => toggleVisibilityMutation.mutate({ id: material.id, is_visible: !material.is_visible })}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      material.is_visible
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                    title={material.is_visible ? "Click to hide" : "Click to show"}
                  >
                    {material.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {material.is_visible ? "Visible" : "Hidden"}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(material)} className="h-8 w-8 p-0 text-primary hover:bg-primary/10" title="Edit Material">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(material)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10" title="Delete Material">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {materials.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-foreground/50 text-sm">
                  No study materials found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-foreground/50">
            Page {page + 1} of {totalPages} &mdash; {data?.total} total
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage(p => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage(p => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Study Material" : "Create Study Material"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the material details below." : "Fill in the details to create a new study material."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div>
              <Label className="text-xs text-[#262626]/60">Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Introduction to Color Theory"
                className="h-10 mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-[#262626]/60">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="A brief summary of this material..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            {/* Rich Text Content */}
            <div>
              <Label className="text-xs text-[#262626]/60 mb-1 block">Content (Rich Text)</Label>
              <div className="bg-white rounded-md border-0">
                <ReactQuill
                  theme="snow"
                  value={form.content_text}
                  onChange={(content) => setForm({ ...form, content_text: content })}
                  placeholder="Enter detailed content here..."
                  className="h-[200px] mb-12"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'bullet' }, { 'list': 'ordered' }],
                      ['blockquote', 'link', 'image'],
                      ['clean'],
                    ],
                  }}
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label className="text-xs text-[#262626]/60 mb-1 block">File Upload</Label>
              <div className="border-2 border-dashed border-black/10 rounded-xl p-4 flex items-center gap-4 bg-background/50 hover:bg-background transition-colors">
                {form.file_url && !uploadFile ? (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Upload className="w-5 h-5 text-primary shrink-0" />
                    <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate hover:underline">
                      {form.file_url.split("/").pop()}
                    </a>
                    <button onClick={() => setForm({ ...form, file_url: "" })} className="shrink-0 text-red-500 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : uploadFile ? (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Upload className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground/70 truncate">{uploadFile.name}</span>
                    <button onClick={() => { setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="shrink-0 text-red-500 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <Upload className="w-5 h-5 text-foreground/40" />
                    <span className="text-sm text-foreground/60">Click to upload a file (PDF, image, etc.)</span>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>

            {/* External URL */}
            <div>
              <Label className="text-xs text-[#262626]/60">External URL (YouTube / Drive link)</Label>
              <Input
                value={form.external_url}
                onChange={e => setForm({ ...form, external_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="h-10 mt-1"
              />
            </div>

            {/* Category & Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-[#262626]/60">Category *</Label>
                <Input
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Color Theory"
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#262626]/60">Target Exam</Label>
                <Select value={form.target_exam} onValueChange={val => setForm({ ...form, target_exam: val })}>
                  <SelectTrigger className="h-10 bg-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    <SelectItem value="UCEED">UCEED</SelectItem>
                    <SelectItem value="CEED">CEED</SelectItem>
                    <SelectItem value="NID">NID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#262626]/60">Target Level</Label>
                <Select value={form.target_level} onValueChange={val => setForm({ ...form, target_level: val })}>
                  <SelectTrigger className="h-10 bg-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="bachelors">Bachelors (B.Des)</SelectItem>
                    <SelectItem value="masters">Masters (M.Des)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#262626]/60">Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  className="h-10 mt-1"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_focus_batch_exclusive}
                  onChange={e => setForm({ ...form, is_focus_batch_exclusive: e.target.checked })}
                  className="rounded border-black/20 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-[#262626]">🌟 Focus Batch Exclusive</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={e => setForm({ ...form, is_visible: e.target.checked })}
                  className="rounded border-black/20 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-[#262626]">Visible to students</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isBusy} className="gap-2">
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update Material" : "Create Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Study Material</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
