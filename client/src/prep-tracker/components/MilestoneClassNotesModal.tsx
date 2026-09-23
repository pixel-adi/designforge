import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { prepApi } from '../api';
import {
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Sparkles,
  Loader2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface MilestoneClassNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  hasAccess: boolean;
  onAccessUnlocked?: () => void;
  milestoneTitle?: string;
  examCode?: string;
}

export function MilestoneClassNotesModal({
  open,
  onOpenChange,
  candidateId: _candidateId,
  candidateName: _candidateName = 'Student',
  candidateEmail: _candidateEmail = '',
  hasAccess,
  onAccessUnlocked: _onAccessUnlocked,
  milestoneTitle = 'Milestone Notes',
  examCode = 'NID',
}: MilestoneClassNotesModalProps) {
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (open && hasAccess) {
      setLoadingNotes(true);
      prepApi
        .getClassNotes(examCode)
        .then(data => setNotes(data || []))
        .catch(err => console.error('Failed to load notes from study materials:', err))
        .finally(() => setLoadingNotes(false));
    }
  }, [open, hasAccess, examCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#1e293b]">
            <BookOpen className="h-5 w-5 text-primary" />
            Class Notes: {milestoneTitle}
          </DialogTitle>
          <DialogDescription>
            Handcrafted lecture decks, study guides, and reference decks curated from Designforge Study Materials.
          </DialogDescription>
        </DialogHeader>

        {hasAccess ? (
          /* UNLOCKED VIEW */
          <div className="py-3 space-y-4">
            {loadingNotes ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 bg-black/[0.02] rounded-xl border border-black/5 p-6">
                <FileText className="h-10 w-10 text-foreground/20 mx-auto mb-3" />
                <h4 className="font-bold text-[#262626]">Notes publishing in progress</h4>
                <p className="text-xs text-foreground/60 mt-1 max-w-sm mx-auto">
                  Mentors are uploading study material decks for this milestone. Check back shortly!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl border border-black/10 bg-white hover:border-black/20 transition-all shadow-sm flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {note.category || 'Study Material'}
                        </span>
                        {note.target_exam && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/5 text-foreground/70 uppercase">
                            {note.target_exam}
                          </span>
                        )}
                        <h4 className="font-bold text-sm text-[#262626]">{note.title}</h4>
                      </div>
                      {note.description && (
                        <p className="text-xs text-foreground/60 line-clamp-2">
                          {note.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {note.file_url && (
                        <a
                          href={note.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      )}
                      {note.external_url && (
                        <a
                          href={note.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 text-foreground/80 text-xs font-semibold hover:bg-black/10 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* COMING SOON VIEW (NO PRICING, AUTOMATIC ACCESS NOTICE) */
          <div className="py-3 space-y-4">
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                  <Clock className="h-3.5 w-3.5" />
                  Coming Soon
                </span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  In Curation
                </span>
              </div>

              <div>
                <h4 className="font-black text-[#1e293b] text-base mb-1">
                  Class Notes are Being Curated
                </h4>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Comprehensive milestone slide decks, visual teardowns, and drawing templates are currently being prepared by Designforge mentors from the study material archives.
                </p>
              </div>

              {/* Automatic Access Callout */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-950">Included with Material Upgrade</span>
                  <p className="text-emerald-800 text-[11px] leading-normal">
                    Students upgrading to <strong>Study Materials</strong> or enrolled in the <strong>Focus Batch</strong> will automatically get full, unlocked access to all milestone class notes as soon as they drop.
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-black/5 pt-3 text-xs text-foreground/80 font-medium">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Curated directly from Designforge Study Materials library</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Drawing level sheets (L0–L5) and 3-perspective cheat sheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Ten-in-ten ideation prompt banks & material fabrication teardowns</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-9 text-xs font-semibold"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
