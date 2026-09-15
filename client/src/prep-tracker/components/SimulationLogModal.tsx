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
import { Track } from '../types';
import {
  FileCheck,
  Flame,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface SimulationLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  taskId: string;
  taskTitle: string;
  track: Track;
  onSaved?: () => void;
}

export function SimulationLogModal({
  open,
  onOpenChange,
  candidateId,
  taskId,
  taskTitle,
  track,
  onSaved,
}: SimulationLogModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [latestMockExam, setLatestMockExam] = useState<any | null>(null);

  // Form states
  const [paperOrBrief, setPaperOrBrief] = useState(taskTitle);
  const [timeTaken, setTimeTaken] = useState(180); // 3 hours
  const [finished, setFinished] = useState(true);
  const [dominantBucket, setDominantBucket] = useState<'concept' | 'time' | 'clarity' | 'care'>('time');
  const [selfScore, setSelfScore] = useState<string>('');
  const [answerRewritten, setAnswerRewritten] = useState(true);

  // Load latest published portal exam
  useEffect(() => {
    if (open) {
      prepApi
        .getLatestPublishedMockExam(track)
        .then(exam => setLatestMockExam(exam))
        .catch(err => console.error(err));
    }
  }, [open, track]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await prepApi.saveSimulationLog({
        candidate_id: candidateId,
        task_id: taskId,
        date: new Date().toISOString().slice(0, 10),
        paper_or_brief: paperOrBrief || taskTitle,
        time_taken_minutes: Number(timeTaken) || 180,
        finished,
        dominant_bucket: dominantBucket,
        answer_rewritten: answerRewritten,
        self_score: selfScore ? Number(selfScore) : null,
      });

      toast({
        title: 'Simulation Logged',
        description: 'Your paper results and review protocol have been recorded.',
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Error saving log',
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
            <FileCheck className="w-5 h-5 text-red-600" />
            Simulation & Mock Log
          </DialogTitle>
          <DialogDescription className="text-xs">
            Log your timed full simulation and execute the mandatory same-day review protocol.
          </DialogDescription>
        </DialogHeader>

        {/* Portal Live Mock Exam Association Banner */}
        {latestMockExam && (
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/5 p-4 space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary text-white flex items-center gap-1 w-fit">
                  <Flame className="w-3 h-3" /> Latest Available Portal Mock
                </span>
                <h4 className="font-extrabold text-sm text-[#262626]">
                  {latestMockExam.title}
                </h4>
              </div>
              <a
                href={`/portal/test/${latestMockExam.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors shadow-xs shrink-0"
              >
                <span>Solve on Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-foreground/60 leading-relaxed">
              Launch the test engine to solve under exam timer. Once done, return here to log your time, score, and error ledger analysis.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Paper or Brief Title</Label>
            <Input
              value={paperOrBrief}
              onChange={e => setPaperOrBrief(e.target.value)}
              placeholder="e.g. NID DAT Prelims Practice Paper 01"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Time Taken (Minutes)</Label>
              <Input
                type="number"
                value={timeTaken}
                onChange={e => setTimeTaken(Number(e.target.value))}
                className="text-xs h-9"
              />
              <span className="text-[10px] text-foreground/50">Practice papers run 180 min (3h)</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Finished within time?</Label>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFinished(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    finished
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white border-black/10 text-foreground/70'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFinished(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    !finished
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white border-black/10 text-foreground/70'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Your Rubric Score (0 to 100)</Label>
              <span className="text-[10px] text-foreground/50">Optional</span>
            </div>
            <Input
              type="number"
              min="0"
              max="100"
              value={selfScore}
              onChange={e => setSelfScore(e.target.value)}
              placeholder="Self score out of 100"
              className="text-xs h-9"
            />
            <span className="text-[10px] text-foreground/50">
              Note: NID does not publish section-wise marks or split ratios.
            </span>
          </div>

          {/* Dominant Error Bucket */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Dominant Error Bucket</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: 'concept', label: 'Concept', desc: 'Premise too generic' },
                { id: 'time', label: 'Time', desc: 'Ran out of minutes' },
                { id: 'clarity', label: 'Clarity', desc: 'Drawing unclear' },
                { id: 'care', label: 'Care', desc: 'Missed constraints' },
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setDominantBucket(b.id as any)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    dominantBucket === b.id
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-white border-black/10 text-foreground/80 hover:bg-black/5'
                  }`}
                >
                  <span className="font-black text-xs block">{b.label}</span>
                  <span
                    className={`text-[9px] block line-clamp-1 ${
                      dominantBucket === b.id ? 'text-white/80' : 'text-foreground/50'
                    }`}
                  >
                    {b.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Same-day Review Protocol Checklist */}
          <div className="p-3.5 rounded-xl border border-black/10 bg-black/[0.02] space-y-2">
            <span className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Same-Day 45-Minute Review Protocol
            </span>
            <div className="space-y-1.5 text-xs text-foreground/70">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={answerRewritten}
                  onChange={e => setAnswerRewritten(e.target.checked)}
                  className="rounded border-black/20 text-primary focus:ring-primary"
                />
                <span>Rewrote the single weakest answer under timed constraint (20 min)</span>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9"
            >
              {loading ? 'Saving...' : 'Save Simulation Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
