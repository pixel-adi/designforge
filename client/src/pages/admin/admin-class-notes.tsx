import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Edit, Trash2, Save, X, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const PAGE_SIZE = 50;

interface ClassNote {
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

type ClassNoteForm = Omit<ClassNote, "id" | "created_at">;

const emptyForm: ClassNoteForm = {
  title: "",
  description: "",
  content_text: "",
  file_url: null,
  external_url: "",
  category: "",
  target_exam: "all",
  target_level: "both",
  is_focus_batch_exclusive: false,
  display_order: 0,
  is_visible: true,
};

const EXAM_OPTIONS = ["all", "UCEED", "CEED", "NID"] as const;
const LEVEL_OPTIONS = ["bachelors", "masters", "both"] as const;

export default function AdminClassNotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterExam, setFilterExam] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClassNoteForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // ── Fetch notes ──────────────────────────────────────────────
  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin-class-notes", page, search, filterCategory, filterExam],
    queryFn: async () => {
      let query = supabase
        .from("class_notes")
        .select("*", { count: "exact" })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.ilike("title", `%${search}%`);
      }
      if (filterCategory) {
        query = query.eq("category", filterCategory);
      }
      if (filterExam) {
        query = query.eq("target_exam", filterExam);
      }

      const { data, error, count } = await query;
      if (error) {
        toast({ title: "Error loading class notes", description: error.message, variant: "destructive" });
        throw error;
      }
      return { notes: data || [], total: count || 0 };
    },
    placeholderData: (prev) => prev,
  });

  const notes = data?.notes || [];
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  // ── Fetch distinct categories for filter ─────────────────────
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-class-notes-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_notes")
        .select("category")
        .order("category");
      if (error) throw error;
      const unique = Array.from(new Set((data || []).map((d: any) => d.category).filter(Boolean)));
      return unique as string[];
    },
  });

  const categories = categoriesData || [];

  // ── Dialog helpers ───────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (note: ClassNote) => {
    setEditingId(note.id);
    setForm({
      title: note.title,
      description: note.description || "",
      content_text: note.content_text || "",
      file_url: note.file_url,
      external_url: note.external_url || "",
      category: note.category,
      target_exam: note.target_exam,
      target_level: note.target_level,
      is_focus_batch_exclusive: note.is_focus_batch_exclusive,
      display_order: note.display_order,
      is_visible: note.is_visible,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  // ── File upload ──────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `class-notes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("content-uploads")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("content-uploads")
        .getPublicUrl(path);

      setForm((prev) => ({ ...prev, file_url: urlData.publicUrl }));
      toast({ title: "File uploaded", description: file.name });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Save (create / update) ──────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) {
      return toast({ title: "Validation Error", description: "Title is required.", variant: "destructive" });
    }
    if (!form.category.trim()) {
      return toast({ title: "Validation Error", description: "Category is required.", variant: "destructive" });
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        content_text: form.content_text || null,
        file_url: form.file_url || null,
        external_url: form.external_url?.trim() || null,
        category: form.category.trim(),
        target_exam: form.target_exam,
        target_level: form.target_level,
        is_focus_batch_exclusive: form.is_focus_batch_exclusive,
        display_order: form.display_order,
        is_visible: form.is_visible,
      };

      if (editingId) {
        const { error } = await supabase.from("class_notes").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Success", description: "Class note updated successfully." });
      } else {
        const { error } = await supabase.from("class_notes").insert(payload);
        if (error) throw error;
        toast({ title: "Success", description: "Class note created successfully." });
      }

      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["admin-class-notes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-class-notes-categories"] });
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("class_notes").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast({ title: "Deleted", description: `"${deleteTarget.title}" has been removed.` });
      queryClient.invalidateQueries({ queryKey: ["admin-class-notes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-class-notes-categories"] });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Class Notes</h1>
          <p className="text-sm text-[#262626]/50 mt-1">
            Manage class notes for paid students — Apprenticeship &amp; Focus Batch content.
          </p>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] transition-all"
        >
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
          className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filterExam}
          onChange={(e) => { setFilterExam(e.target.value); setPage(0); }}
          className="h-9 px-3 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Exams</option>
          {EXAM_OPTIONS.map((ex) => (
            <option key={ex} value={ex}>{ex === "all" ? "All Exams (target)" : ex}</option>
          ))}
        </select>

        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="h-9 w-64 text-sm"
        />

        {data?.total !== undefined && (
          <span className="text-xs text-foreground/50 whitespace-nowrap">{data.total} notes</span>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Target Exam</th>
              <th className="p-4 font-semibold">Exclusive</th>
              <th className="p-4 font-semibold">Visibility</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {notes.map((note: ClassNote) => (
              <tr key={note.id} className="hover:bg-black/5 transition-colors">
                {/* Title */}
                <td className="p-4">
                  <div className="font-semibold text-sm text-foreground">{note.title}</div>
                  {note.description && (
                    <div className="text-xs text-foreground/40 mt-0.5 line-clamp-1">{note.description}</div>
                  )}
                </td>

                {/* Category badge */}
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {note.category}
                  </span>
                </td>

                {/* Target exam badge */}
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    note.target_exam === "UCEED" ? "bg-indigo-100 text-indigo-800" :
                    note.target_exam === "CEED" ? "bg-purple-100 text-purple-800" :
                    note.target_exam === "NID" ? "bg-teal-100 text-teal-800" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {note.target_exam === "all" ? "All Exams" : note.target_exam}
                  </span>
                </td>

                {/* Focus batch exclusive */}
                <td className="p-4">
                  {note.is_focus_batch_exclusive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      🌟 Focus Batch
                    </span>
                  ) : (
                    <span className="text-xs text-foreground/30">—</span>
                  )}
                </td>

                {/* Visibility */}
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    note.is_visible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                  }`}>
                    {note.is_visible ? "Visible" : "Hidden"}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(note)}
                      className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                      title="Edit Note"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: note.id, title: note.title })}
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {notes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-foreground/50 text-sm">
                  No class notes found. Click &quot;+ New Note&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-foreground/50">
            Page {page + 1} of {totalPages} &mdash; {data?.total} total
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create / Edit Dialog ────────────────────────────────── */}
      {dialogOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
          onClick={closeDialog}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h3 className="text-xl font-heading text-foreground">
                {editingId ? "Edit Class Note" : "Create New Class Note"}
              </h3>
              <button
                onClick={closeDialog}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-foreground/40" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-12 mt-1 bg-background"
                  placeholder="e.g. Color Theory — Module 3"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Description</Label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this note…"
                  className="w-full mt-1 rounded-xl border border-input px-4 py-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                />
              </div>

              {/* Rich text content */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Content (Rich Text)</Label>
                <div className="mt-1 rounded-xl overflow-hidden border border-input">
                  <ReactQuill
                    theme="snow"
                    value={form.content_text || ""}
                    onChange={(val: string) => setForm({ ...form, content_text: val })}
                    placeholder="Write detailed note content here…"
                    style={{ minHeight: 200 }}
                  />
                </div>
              </div>

              {/* File upload */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">File Attachment</Label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-xl gap-2"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Uploading…" : "Upload File"}
                  </Button>
                  {form.file_url && (
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <a
                        href={form.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary hover:text-primary/80 truncate max-w-[200px]"
                      >
                        View uploaded file
                      </a>
                      <button
                        onClick={() => setForm({ ...form, file_url: null })}
                        className="text-red-400 hover:text-red-600"
                        title="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* External URL */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">External URL (YouTube / Loom)</Label>
                <Input
                  value={form.external_url || ""}
                  onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                  className="h-12 mt-1 bg-background"
                  placeholder="https://youtube.com/watch?v=... or https://loom.com/..."
                />
              </div>

              {/* Category + Target Exam */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Category *</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="h-12 mt-1 bg-background"
                    placeholder="e.g. Design Fundamentals"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Target Exam</Label>
                  <select
                    value={form.target_exam}
                    onChange={(e) => setForm({ ...form, target_exam: e.target.value })}
                    className="w-full h-12 mt-1 px-4 rounded-xl border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {EXAM_OPTIONS.map((ex) => (
                      <option key={ex} value={ex}>{ex === "all" ? "All Exams" : ex}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Level + Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Target Level</Label>
                  <select
                    value={form.target_level}
                    onChange={(e) => setForm({ ...form, target_level: e.target.value })}
                    className="w-full h-12 mt-1 px-4 rounded-xl border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="both">Both (B.Des + M.Des)</option>
                    <option value="bachelors">Bachelors (B.Des)</option>
                    <option value="masters">Masters (M.Des)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Display Order</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="h-12 mt-1 bg-background"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-4 pt-4 border-t border-black/5 mt-4">
                <label className="flex items-start gap-3 text-sm font-medium text-foreground cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.is_focus_batch_exclusive}
                    onChange={(e) => setForm({ ...form, is_focus_batch_exclusive: e.target.checked })}
                    className="w-5 h-5 rounded border-black/20 text-primary focus:ring-primary/20 mt-0.5"
                  />
                  <div>
                    <span className="group-hover:text-primary transition-colors">Focus Batch Exclusive</span>
                    <p className="text-xs text-orange-600/70 mt-0.5 font-normal">
                      ⚠️ Only Focus Batch students will see this note
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.is_visible}
                    onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                    className="w-5 h-5 rounded border-black/20 text-primary focus:ring-primary/20"
                  />
                  <span className="group-hover:text-primary transition-colors">Visible to Students</span>
                </label>
              </div>
            </div>

            {/* Dialog footer */}
            <div className="flex gap-3 pt-6 border-t border-black/5">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] text-base font-bold transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving…" : editingId ? "Update Note" : "Create Note"}
              </Button>
              <Button variant="outline" className="h-12 px-6 rounded-xl" onClick={closeDialog}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 md:p-8 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-heading text-foreground">Delete Class Note?</h3>
              <p className="text-sm text-foreground/50">
                Are you sure you want to delete <strong>&quot;{deleteTarget.title}&quot;</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold"
              >
                Yes, Delete
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
