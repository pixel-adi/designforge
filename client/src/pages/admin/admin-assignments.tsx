import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, Edit, Trash2, Plus, ChevronLeft, ChevronRight,
  ArrowLeft, Eye, EyeOff, FileText, Upload, ExternalLink,
  MessageSquare, CheckCircle2, Video, ClipboardList, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const PAGE_SIZE = 20;

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────

interface ClassAssignment {
  id: string;
  title: string;
  description: string | null;
  content_text: string | null;
  file_url: string | null;
  target_exam: string;
  target_level: string;
  due_date: string | null;
  is_visible: boolean;
  display_order: number | null;
  created_at: string;
  submission_count?: number;
}

interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  candidate_id: string;
  file_url: string;
  answer_text: string | null;
  status: string;
  mentor_comments: string | null;
  mentor_improvements: string | null;
  mentor_loom_link: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  exam_candidates: {
    name: string;
    unique_id: string;
    access_level: string;
  };
}

const EMPTY_FORM = {
  title: "",
  description: "",
  content_text: "",
  file_url: "",
  target_exam: "all",
  target_level: "both",
  due_date: "",
  is_visible: true,
  display_order: 0,
};

export default function AdminAssignments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ─── View State ───
  const [view, setView] = useState<"list" | "submissions">("list");
  const [selectedAssignment, setSelectedAssignment] = useState<ClassAssignment | null>(null);

  // ─── Assignment List State ───
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ClassAssignment | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Submission Review State ───
  const [subPage, setSubPage] = useState(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<AssignmentSubmission | null>(null);
  const [reviewForm, setReviewForm] = useState({
    mentor_comments: "",
    mentor_improvements: "",
    mentor_loom_link: "",
    status: "submitted",
  });
  const [reviewSaving, setReviewSaving] = useState(false);

  // ───────────────────────────────────────────
  // Data: Assignments list
  // ───────────────────────────────────────────

  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["admin-assignments", page, search, examFilter],
    queryFn: async () => {
      let query = supabase
        .from("class_assignments")
        .select("*", { count: "exact" })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.ilike("title", `%${search}%`);
      }
      if (examFilter !== "all") {
        query = query.or(`target_exam.eq.${examFilter},target_exam.eq.all`);
      }

      const { data, error, count } = await query;
      if (error) {
        toast({ title: "Error loading assignments", description: error.message, variant: "destructive" });
        throw error;
      }

      // Fetch submission counts for each assignment
      const ids = (data || []).map((a: any) => a.id);
      let countsMap: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: countData } = await supabase
          .from("assignment_submissions")
          .select("assignment_id", { count: "exact", head: false })
          .in("assignment_id", ids);

        if (countData) {
          countData.forEach((row: any) => {
            countsMap[row.assignment_id] = (countsMap[row.assignment_id] || 0) + 1;
          });
        }
      }

      const enriched = (data || []).map((a: any) => ({
        ...a,
        submission_count: countsMap[a.id] || 0,
      }));

      return { assignments: enriched as ClassAssignment[], total: count || 0 };
    },
    placeholderData: (prev) => prev,
  });

  const assignments = assignmentsData?.assignments || [];
  const totalPages = Math.ceil((assignmentsData?.total || 0) / PAGE_SIZE);

  // ───────────────────────────────────────────
  // Data: Submissions for selected assignment
  // ───────────────────────────────────────────

  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["admin-assignment-submissions", selectedAssignment?.id, subPage],
    queryFn: async () => {
      if (!selectedAssignment) return { submissions: [], total: 0 };

      const { data, error, count } = await supabase
        .from("assignment_submissions")
        .select("*, exam_candidates(name, unique_id, access_level)", { count: "exact" })
        .eq("assignment_id", selectedAssignment.id)
        .order("submitted_at", { ascending: false })
        .range(subPage * PAGE_SIZE, (subPage + 1) * PAGE_SIZE - 1);

      if (error) {
        toast({ title: "Error loading submissions", description: error.message, variant: "destructive" });
        throw error;
      }
      return { submissions: (data || []) as AssignmentSubmission[], total: count || 0 };
    },
    enabled: view === "submissions" && !!selectedAssignment,
    placeholderData: (prev) => prev,
  });

  const submissions = submissionsData?.submissions || [];
  const subTotalPages = Math.ceil((submissionsData?.total || 0) / PAGE_SIZE);

  // ───────────────────────────────────────────
  // Handlers: Assignment CRUD
  // ───────────────────────────────────────────

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("content-uploads").upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("content-uploads").getPublicUrl(fileName);
    return publicUrl;
  };

  const openCreateDialog = () => {
    setEditingAssignment(null);
    setForm({ ...EMPTY_FORM });
    setFileToUpload(null);
    setDialogOpen(true);
  };

  const openEditDialog = (assignment: ClassAssignment) => {
    setEditingAssignment(assignment);
    setForm({
      title: assignment.title,
      description: assignment.description || "",
      content_text: assignment.content_text || "",
      file_url: assignment.file_url || "",
      target_exam: assignment.target_exam,
      target_level: assignment.target_level,
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : "",
      is_visible: assignment.is_visible,
      display_order: assignment.display_order || 0,
    });
    setFileToUpload(null);
    setDialogOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!form.title.trim()) {
      return toast({ title: "Error", description: "Title is required.", variant: "destructive" });
    }

    setSaving(true);
    try {
      let fileUrl = form.file_url;
      if (fileToUpload) {
        fileUrl = await uploadFile(fileToUpload);
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        content_text: form.content_text || null,
        file_url: fileUrl || null,
        target_exam: form.target_exam,
        target_level: form.target_level,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        is_visible: form.is_visible,
        display_order: form.display_order || 0,
      };

      if (editingAssignment) {
        const { error } = await supabase
          .from("class_assignments")
          .update(payload)
          .eq("id", editingAssignment.id);
        if (error) throw error;
        toast({ title: "Success", description: "Assignment updated successfully." });
      } else {
        const { error } = await supabase
          .from("class_assignments")
          .insert(payload);
        if (error) throw error;
        toast({ title: "Success", description: "Assignment created successfully." });
      }

      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-assignments"] });
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the assignment "${title}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase.from("class_assignments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Assignment has been deleted." });
      queryClient.invalidateQueries({ queryKey: ["admin-assignments"] });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleVisibility = async (assignment: ClassAssignment) => {
    try {
      const { error } = await supabase
        .from("class_assignments")
        .update({ is_visible: !assignment.is_visible })
        .eq("id", assignment.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-assignments"] });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  // ───────────────────────────────────────────
  // Handlers: Submission Review
  // ───────────────────────────────────────────

  const openReviewDialog = (submission: AssignmentSubmission) => {
    setReviewingSubmission(submission);
    setReviewForm({
      mentor_comments: submission.mentor_comments || "",
      mentor_improvements: submission.mentor_improvements || "",
      mentor_loom_link: submission.mentor_loom_link || "",
      status: submission.status || "submitted",
    });
    setReviewDialogOpen(true);
  };

  const handleSaveReview = async () => {
    if (!reviewingSubmission) return;
    setReviewSaving(true);

    try {
      const { error } = await supabase
        .from("assignment_submissions")
        .update({
          mentor_comments: reviewForm.mentor_comments || null,
          mentor_improvements: reviewForm.mentor_improvements || null,
          mentor_loom_link: reviewForm.mentor_loom_link || null,
          status: reviewForm.status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reviewingSubmission.id);

      if (error) throw error;

      toast({ title: "Review Saved", description: "Submission review has been saved." });
      setReviewDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-assignment-submissions"] });
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setReviewSaving(false);
    }
  };

  // ───────────────────────────────────────────
  // Status badge helper
  // ───────────────────────────────────────────

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      reviewed: "bg-green-100 text-green-800",
      needs_revision: "bg-orange-100 text-orange-800",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-800"}`}>
        {status === "needs_revision" ? "Needs Revision" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const examBadge = (exam: string) => {
    const map: Record<string, string> = {
      UCEED: "bg-blue-100 text-blue-800",
      CEED: "bg-purple-100 text-purple-800",
      NID: "bg-amber-100 text-amber-800",
      all: "bg-gray-100 text-gray-700",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[exam] || "bg-gray-100 text-gray-800"}`}>
        {exam === "all" ? "All Exams" : exam}
      </span>
    );
  };

  // ───────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────

  if (isLoadingAssignments && view === "list") {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // ═══════════════════════════════════════════
  // VIEW 2: SUBMISSION REVIEW
  // ═══════════════════════════════════════════

  if (view === "submissions" && selectedAssignment) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setView("list"); setSelectedAssignment(null); setSubPage(0); }}
            className="text-foreground/60"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
          </Button>
          <div className="h-6 w-px bg-black/10" />
          <div>
            <h1 className="text-2xl font-semibold text-[#262626]">{selectedAssignment.title}</h1>
            <p className="text-sm text-[#262626]/50 mt-0.5">
              {selectedAssignment.due_date
                ? `Due: ${new Date(selectedAssignment.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                : "No due date set"}
              {submissionsData?.total !== undefined && (
                <span className="ml-3">• {submissionsData.total} submissions</span>
              )}
            </p>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
          {isLoadingSubmissions ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5 border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50">
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Unique ID</th>
                  <th className="p-4 font-semibold">Submitted At</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-black/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm">{sub.exam_candidates?.name}</div>
                        {sub.exam_candidates?.access_level === "focus_batch" && (
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold border border-primary/20">
                            Focus Batch
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-[10px] uppercase font-bold tracking-widest text-foreground/40">
                      {sub.exam_candidates?.unique_id}
                    </td>
                    <td className="p-4 text-sm text-foreground/60">
                      {new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4">{statusBadge(sub.status)}</td>
                    <td className="p-4 text-right">
                      <Button
                        variant={sub.status === "reviewed" ? "outline" : "default"}
                        size="sm"
                        onClick={() => openReviewDialog(sub)}
                        className={`h-7 px-3 font-bold text-xs rounded-md ${sub.status !== "reviewed" ? "bg-primary text-white hover:bg-primary/90 shadow-sm" : ""}`}
                      >
                        {sub.status === "reviewed" ? "Edit Review" : "Review"}
                      </Button>
                    </td>
                  </tr>
                ))}

                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-foreground/40">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No submissions received for this assignment yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Submissions Pagination */}
        {subTotalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-foreground/50">
              Page {subPage + 1} of {subTotalPages} &mdash; {submissionsData?.total} total
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={subPage === 0} onClick={() => setSubPage((p) => p - 1)} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={subPage >= subTotalPages - 1} onClick={() => setSubPage((p) => p + 1)} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Review Dialog ─── */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#262626]">Review Submission</DialogTitle>
              <DialogDescription className="text-foreground/70 font-medium pt-1">
                {reviewingSubmission?.exam_candidates?.name}
                {reviewingSubmission?.exam_candidates?.access_level === "focus_batch" && (
                  <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold border border-primary/20">
                    Focus Batch
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {reviewingSubmission && (
              <div className="space-y-5 py-4">
                {/* Submitted File */}
                {reviewingSubmission.file_url && (
                  <div>
                    <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                      Submitted File
                    </label>
                    <div className="bg-[#F8F9FA] border border-black/10 rounded-xl p-4">
                      {reviewingSubmission.file_url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                        <img
                          src={reviewingSubmission.file_url}
                          alt="Submission"
                          className="max-h-[300px] w-auto object-contain rounded-lg border border-black/10 mx-auto"
                        />
                      ) : (
                        <a
                          href={reviewingSubmission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Uploaded File
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Answer Text */}
                {reviewingSubmission.answer_text && (
                  <div>
                    <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                      Answer Text
                    </label>
                    <div className="bg-[#F8F9FA] border border-black/10 rounded-xl p-4 text-sm leading-relaxed">
                      {reviewingSubmission.answer_text}
                    </div>
                  </div>
                )}

                {/* Mentor Comments */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5" /> Mentor Comments
                  </label>
                  <textarea
                    value={reviewForm.mentor_comments}
                    onChange={(e) => setReviewForm({ ...reviewForm, mentor_comments: e.target.value })}
                    className="w-full h-24 border border-black/10 rounded-xl p-3 bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                    placeholder="Provide feedback on what the candidate did well and what went wrong..."
                  />
                </div>

                {/* Suggested Improvements */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Suggested Improvements
                  </label>
                  <textarea
                    value={reviewForm.mentor_improvements}
                    onChange={(e) => setReviewForm({ ...reviewForm, mentor_improvements: e.target.value })}
                    className="w-full h-20 border border-black/10 rounded-xl p-3 bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                    placeholder="Specific tips on how to improve..."
                  />
                </div>

                {/* Loom Link */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                    <Video className="w-3.5 h-3.5" /> Loom Video Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={reviewForm.mentor_loom_link}
                    onChange={(e) => setReviewForm({ ...reviewForm, mentor_loom_link: e.target.value })}
                    className="w-full h-10 border border-black/10 rounded-xl px-3 bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                    placeholder="https://www.loom.com/share/..."
                  />
                </div>

                {/* Status */}
                <div>
                  <Label className="text-xs text-foreground/70 mb-1.5 block font-bold uppercase tracking-wider">Status</Label>
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-black/10 bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-primary/50 text-sm"
                    value={reviewForm.status}
                    onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="needs_revision">Needs Revision</option>
                  </select>
                </div>
              </div>
            )}

            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="font-bold">
                Cancel
              </Button>
              <Button onClick={handleSaveReview} disabled={reviewSaving} className="font-bold bg-green-600 text-white hover:bg-green-700">
                {reviewSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // VIEW 1: ASSIGNMENT LIST
  // ═══════════════════════════════════════════

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Class Assignments</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Create, manage, and review class assignments and student submissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="h-9 w-56 text-sm"
          />
          <select
            className="h-9 px-3 rounded-md border border-black/10 bg-white text-sm"
            value={examFilter}
            onChange={(e) => { setExamFilter(e.target.value); setPage(0); }}
          >
            <option value="all">All Exams</option>
            <option value="UCEED">UCEED</option>
            <option value="CEED">CEED</option>
            <option value="NID">NID</option>
          </select>
          <Button onClick={openCreateDialog} className="h-9 font-bold text-sm">
            <Plus className="w-4 h-4 mr-2" /> New Assignment
          </Button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Target Exam</th>
              <th className="p-4 font-semibold">Due Date</th>
              <th className="p-4 font-semibold">Submissions</th>
              <th className="p-4 font-semibold">Visibility</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {assignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-black/5 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-sm text-[#262626]">{assignment.title}</div>
                  {assignment.description && (
                    <div className="text-xs text-foreground/50 mt-0.5 truncate max-w-[300px]">{assignment.description}</div>
                  )}
                </td>
                <td className="p-4">{examBadge(assignment.target_exam)}</td>
                <td className="p-4 text-sm text-foreground/60">
                  {assignment.due_date
                    ? new Date(assignment.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : <span className="text-foreground/30 italic">No due date</span>}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {assignment.submission_count || 0}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleVisibility(assignment)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      assignment.is_visible
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    {assignment.is_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {assignment.is_visible ? "Visible" : "Hidden"}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(assignment)}
                      className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                      title="Edit Assignment"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setView("submissions");
                        setSubPage(0);
                      }}
                      className="h-8 w-8 p-0 text-foreground/60 hover:bg-black/10"
                      title="View Submissions"
                    >
                      <ClipboardList className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {assignments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-foreground/40">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No assignments created yet. Click '+ New Assignment' to get started.</p>
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
            Page {page + 1} of {totalPages} &mdash; {assignmentsData?.total} total
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0 || isLoadingAssignments} onClick={() => setPage((p) => p - 1)} className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1 || isLoadingAssignments} onClick={() => setPage((p) => p + 1)} className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Create / Edit Assignment Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#262626]">
              {editingAssignment ? "Edit Assignment" : "New Assignment"}
            </DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium pt-1">
              {editingAssignment ? "Update the assignment details below." : "Fill in the details to create a new class assignment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Title */}
            <div>
              <Label className="text-xs text-[#262626]/60 mb-1 block">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Color Theory Exercise Week 3"
                className="h-10"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-[#262626]/60 mb-1 block">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full h-20 border border-black/10 rounded-xl p-3 bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                placeholder="Brief description of the assignment..."
              />
            </div>

            {/* Content (Rich Text) */}
            <div>
              <Label className="text-xs text-[#262626]/60 mb-1 block">Content (Rich Text)</Label>
              <div className="bg-white rounded-md border-0">
                <ReactQuill
                  theme="snow"
                  value={form.content_text}
                  onChange={(content) => setForm({ ...form, content_text: content })}
                  placeholder="Detailed assignment instructions..."
                  className="h-[160px] mb-12"
                  modules={{
                    toolbar: [
                      ["bold", "italic", "underline"],
                      [{ list: "bullet" }, { list: "ordered" }],
                      ["link"],
                    ],
                  }}
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label className="text-xs text-[#262626]/60 mb-1 block">Attachment (PDF / Image)</Label>
              <div className="border-2 border-dashed border-black/10 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden bg-background/50 hover:bg-background transition-colors">
                {(fileToUpload || form.file_url) ? (
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium text-foreground/70 truncate max-w-[300px]">
                      {fileToUpload ? fileToUpload.name : form.file_url}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={() => { setFileToUpload(null); setForm({ ...form, file_url: "" }); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-foreground/30 mb-2" />
                    <p className="text-xs text-foreground/40">Click to upload or drag and drop</p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileToUpload(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>

            {/* Row: Target Exam + Target Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#262626]/60 mb-1 block">Target Exam</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-black/10 bg-white text-sm"
                  value={form.target_exam}
                  onChange={(e) => setForm({ ...form, target_exam: e.target.value })}
                >
                  <option value="all">All Exams</option>
                  <option value="UCEED">UCEED</option>
                  <option value="CEED">CEED</option>
                  <option value="NID">NID</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#262626]/60 mb-1 block">Target Level</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-black/10 bg-white text-sm"
                  value={form.target_level}
                  onChange={(e) => setForm({ ...form, target_level: e.target.value })}
                >
                  <option value="both">Both</option>
                  <option value="bachelors">Bachelors (B.Des)</option>
                  <option value="masters">Masters (M.Des)</option>
                </select>
              </div>
            </div>

            {/* Row: Due Date + Display Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#262626]/60 mb-1 block">Due Date</Label>
                <Input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-[#262626]/60 mb-1 block">Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  className="h-10"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_visible"
                checked={form.is_visible}
                onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                className="w-4 h-4 rounded border-black/20 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_visible" className="text-sm text-foreground/70 cursor-pointer">
                Visible to students
              </Label>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-bold">
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment} disabled={saving} className="font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingAssignment ? "Save Changes" : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
