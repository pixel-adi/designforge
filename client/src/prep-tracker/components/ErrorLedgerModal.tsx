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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { prepApi } from '../api';
import {
  AlertTriangle,
  Flame,
  Plus,
  ShieldAlert,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface ErrorLedgerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
}

const ERROR_BUCKET_FIXES: Record<string, { label: string; remedy: string }> = {
  concept: {
    label: 'Concept',
    remedy: 'Run Ten-in-ten with the three-premise rule (user, context, physical mechanism). Never develop concept 1 or 2.',
  },
  time: {
    label: 'Time',
    remedy: 'Divide exam minutes strictly into thirds: 1/3 framing & concepts, 1/3 layout & perspective, 1/3 rendering & callouts. Set a hard alarm.',
  },
  clarity: {
    label: 'Clarity',
    remedy: 'Switch from decorative line to structure lines. Add numbered arrows, cutaways, and two-line micro-copy explanations.',
  },
  care: {
    label: 'Care',
    remedy: 'Highlight negative constraints in the brief before sketching. Check ergonomics, scale, and assembly fail points.',
  },
};

export function ErrorLedgerModal({ open, onOpenChange, candidateId }: ErrorLedgerModalProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingNew, setAddingNew] = useState(false);

  // New entry form
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [bucket, setBucket] = useState<'concept' | 'time' | 'clarity' | 'care'>('time');
  const [rootCause, setRootCause] = useState('');
  const [fixingDrill, setFixingDrill] = useState('');

  const loadEntries = async () => {
    if (!candidateId) return;
    setLoading(true);
    try {
      const data = await prepApi.getErrorLedgers(candidateId);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open, candidateId]);

  // Check 3-times method gap rule: If the same bucket appears 3+ times in the last 14 days
  const recentEntries = entries.filter(e => {
    const diffDays = (new Date().getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  });

  const bucketCounts: Record<string, number> = {
    concept: 0,
    time: 0,
    clarity: 0,
    care: 0,
  };
  recentEntries.forEach(e => {
    if (bucketCounts[e.bucket] !== undefined) {
      bucketCounts[e.bucket]++;
    }
  });

  const recurringBucket = Object.entries(bucketCounts).find(([_b, count]) => count >= 3);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await prepApi.saveErrorLedger({
        candidate_id: candidateId,
        date: new Date().toISOString().slice(0, 10),
        what_went_wrong: whatWentWrong,
        bucket,
        root_cause: rootCause,
        fixing_drill: fixingDrill || ERROR_BUCKET_FIXES[bucket].remedy,
      });
      toast({
        title: 'Error Logged',
        description: 'Method gap recorded in ledger.',
      });
      setWhatWentWrong('');
      setRootCause('');
      setFixingDrill('');
      setAddingNew(false);
      loadEntries();
    } catch (err: any) {
      toast({
        title: 'Failed to save',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Error Ledger & Method Diagnostics
            </DialogTitle>
            {!addingNew && (
              <Button
                size="sm"
                onClick={() => setAddingNew(true)}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1 h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Log Error
              </Button>
            )}
          </div>
          <DialogDescription className="text-xs">
            Catalog mistakes under the 4 method buckets. An error repeated three times is a gap in method, not effort.
          </DialogDescription>
        </DialogHeader>

        {/* 3-Times Method Gap Warning Banner */}
        {recurringBucket && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 space-y-2 text-xs text-red-950">
            <div className="flex items-center gap-2 font-black text-red-700">
              <ShieldAlert className="w-4 h-4" />
              <span>
                Method Gap Alert: “{ERROR_BUCKET_FIXES[recurringBucket[0]].label}” logged {recurringBucket[1]} times in 14 days
              </span>
            </div>
            <p className="text-red-900 leading-relaxed">
              <strong>The Designforge Outline Rule:</strong> An error logged three times is a gap in method: it needs a drill, not more effort.
            </p>
            <div className="p-3 bg-white rounded-xl border border-red-200 text-red-900 font-medium mt-1">
              <strong>Target Remedy:</strong> {ERROR_BUCKET_FIXES[recurringBucket[0]].remedy}
            </div>
          </div>
        )}

        {addingNew ? (
          /* ADD NEW ERROR FORM */
          <form onSubmit={handleCreate} className="space-y-4 py-2 border border-black/10 rounded-2xl p-4 bg-black/[0.01]">
            <h4 className="font-bold text-sm text-[#262626]">Record New Method Failure</h4>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">What went wrong?</Label>
              <Input
                value={whatWentWrong}
                onChange={e => setWhatWentWrong(e.target.value)}
                placeholder="e.g. Could not finish shading second concept in time"
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Error Bucket</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['concept', 'time', 'clarity', 'care'] as const).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBucket(b)}
                    className={`p-2 rounded-xl border text-xs font-bold capitalize transition-colors ${
                      bucket === b
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white border-black/10 text-foreground/80 hover:bg-black/5'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Root Cause</Label>
              <Input
                value={rootCause}
                onChange={e => setRootCause(e.target.value)}
                placeholder="e.g. Spent 45 min instead of 25 min exploring concept 1"
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Fixing Drill / Action</Label>
              <Input
                value={fixingDrill}
                onChange={e => setFixingDrill(e.target.value)}
                placeholder={ERROR_BUCKET_FIXES[bucket].remedy}
                className="text-xs h-9"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddingNew(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-white font-bold text-xs h-8"
              >
                Save Entry
              </Button>
            </div>
          </form>
        ) : (
          /* ENTRIES LIST */
          <div className="py-2 space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-12 bg-black/[0.02] rounded-xl border border-black/5 p-6">
                <p className="text-xs text-foreground/50">
                  No ledger entries logged yet. When you complete a simulation or timed drill, log any friction point here.
                </p>
              </div>
            ) : (
              entries.map(e => (
                <div
                  key={e.id}
                  className="p-3.5 rounded-xl border border-black/10 bg-white shadow-xs space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-black/5 text-foreground/70">
                      {e.bucket}
                    </span>
                    <span className="text-[10px] text-foreground/40">{e.date}</span>
                  </div>
                  <h4 className="font-bold text-[#262626] text-sm">{e.what_went_wrong}</h4>
                  <p className="text-foreground/70">
                    <strong>Root cause:</strong> {e.root_cause}
                  </p>
                  <p className="text-primary font-semibold">
                    <strong>Fix:</strong> {e.fixing_drill}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
