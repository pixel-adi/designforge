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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { prepApi } from '../api';
import { MessageSquare, Upload, CheckCircle2, Link as LinkIcon, Sparkles } from 'lucide-react';

interface CritiqueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  taskId: string;
  taskTitle: string;
  onSubmitted?: () => void;
}

export function CritiqueModal({
  open,
  onOpenChange,
  candidateId,
  taskId,
  taskTitle,
  onSubmitted,
}: CritiqueModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [workLink, setWorkLink] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workLink && !note) {
      toast({
        title: 'Please attach work',
        description: 'Provide a link to your sketches, Figma, or Drive folder.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await prepApi.saveCritique({
        candidate_id: candidateId,
        task_id: taskId,
        attachments: workLink ? [workLink] : [],
        note,
      });

      toast({
        title: 'Critique Submitted',
        description: 'Your submission has been queued for review.',
      });
      onSubmitted?.();
      onOpenChange(false);
      setWorkLink('');
      setNote('');
    } catch (err: any) {
      toast({
        title: 'Submission failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            Submit Work for Critique
          </DialogTitle>
          <DialogDescription className="text-xs">
            {taskTitle} · Get feedback on your method and drawing hierarchy.
          </DialogDescription>
        </DialogHeader>

        {/* 3 Mandatory Critique Framing Questions */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-1.5 text-xs text-amber-950">
          <span className="font-bold flex items-center gap-1 text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            The Three Critique Questions to Answer:
          </span>
          <ol className="list-decimal list-inside space-y-1 text-amber-900/90 font-medium">
            <li>What did you intend to do that didn't come across?</li>
            <li>Where did your time run out or drag?</li>
            <li>What is the single weakest drawing or callout on the sheet?</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Link to Work (Drive, Figma, Imgur)</Label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-foreground/40" />
              <Input
                value={workLink}
                onChange={e => setWorkLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="pl-8 text-xs h-9"
              />
            </div>
            <span className="text-[10px] text-foreground/50">
              Ensure link permissions are set to viewable by anyone with link.
            </span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Two-Line Context / Self-Critique</Label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Briefly state your intention and where you felt the drawing stalled..."
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
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9"
            >
              {loading ? 'Submitting...' : 'Submit for Critique'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
