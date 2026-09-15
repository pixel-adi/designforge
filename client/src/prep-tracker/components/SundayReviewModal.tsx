import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { prepApi } from '../api';
import { CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

interface SundayReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  week: number;
  onSaved?: () => void;
}

const CHECKLIST_ITEMS = [
  'Daily drill, 6 days',
  '3 build blocks',
  '1 simulation',
  '1 critique conversation',
  'Diary complete',
  'Ledger updated',
  'One redo from two weeks ago',
  'Work posted publicly',
];

export function SundayReviewModal({
  open,
  onOpenChange,
  candidateId,
  week,
  onSaved,
}: SundayReviewModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [improvedWithEvidence, setImprovedWithEvidence] = useState('');
  const [didNotMoveAndWhy, setDidNotMoveAndWhy] = useState('');
  const [oneChange, setOneChange] = useState('');
  const [checks, setChecks] = useState<boolean[]>(new Array(8).fill(false));

  const toggleCheck = (index: number) => {
    const next = [...checks];
    next[index] = !next[index];
    setChecks(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await prepApi.saveSundayReview({
        candidate_id: candidateId,
        week,
        improved_with_evidence: improvedWithEvidence,
        did_not_move_and_why: didNotMoveAndWhy,
        one_change: oneChange,
        completion_check: checks,
      });

      toast({
        title: 'Sunday Review Saved',
        description: `Week ${week} reflection recorded.`,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Error saving review',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Sunday Review — Week {week}
          </DialogTitle>
          <DialogDescription className="text-xs">
            30-minute written reflection. A review without evidence is just wishful thinking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 8-Item Week Completion Check */}
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-2.5">
            <Label className="text-xs font-bold text-[#262626] block">
              Week Completion Check ({checks.filter(Boolean).length}/8)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {CHECKLIST_ITEMS.map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    checks[idx]
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                      : 'bg-white border-black/10 text-foreground/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checks[idx]}
                    onChange={() => toggleCheck(idx)}
                    className="rounded border-black/20 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">1. What improved with evidence?</Label>
            <textarea
              rows={2}
              value={improvedWithEvidence}
              onChange={e => setImprovedWithEvidence(e.target.value)}
              placeholder="e.g. Concept count moved from 4 in 10 min to 7 in 10 min on Tuesday drill."
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">2. What did not move and why?</Label>
            <textarea
              rows={2}
              value={didNotMoveAndWhy}
              onChange={e => setDidNotMoveAndWhy(e.target.value)}
              placeholder="e.g. Shading ellipse cylinders still takes 8 min; hand pressure is inconsistent."
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">3. One specific change for next week</Label>
            <textarea
              rows={2}
              value={oneChange}
              onChange={e => setOneChange(e.target.value)}
              placeholder="e.g. Switch from 2B pencil to 0.5 uniball pen for all Tuesday drills to force committed strokes."
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
            >
              {loading ? 'Saving...' : 'Save Sunday Review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
