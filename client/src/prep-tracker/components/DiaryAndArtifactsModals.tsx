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
import {
  PenTool,
  CreditCard,
  Sparkles,
  Camera,
  Mic,
  MessageCircle,
} from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  taskId?: string;
  onSaved?: () => void;
}

// 1. DIARY MODAL (4 Quadrants)
export function DiaryModal({
  open,
  onOpenChange,
  candidateId,
  onSaved,
}: ModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [place, setPlace] = useState('');
  const [theme, setTheme] = useState('Objects designed for water');
  const [whatISaw, setWhatISaw] = useState('');
  const [howItWorks, setHowItWorks] = useState('');
  const [whereItFails, setWhereItFails] = useState('');
  const [whatIdChange, setWhatIdChange] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await prepApi.saveDiaryEntry({
        candidate_id: candidateId,
        date: new Date().toISOString().slice(0, 10),
        place: place || 'Local Observation',
        theme,
        what_i_saw: whatISaw,
        how_it_works: howItWorks,
        where_it_fails: whereItFails,
        what_id_change: whatIdChange,
      });
      toast({ title: 'Diary Page Saved', description: 'Observation recorded.' });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <PenTool className="w-5 h-5 text-primary" />
            Design Diary (4 Quadrants)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Notice how things are made and where they fail. Written proof of design awareness.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-bold">Location / Place</Label>
              <Input
                value={place}
                onChange={e => setPlace(e.target.value)}
                placeholder="e.g. Bus stop, Metro gate, Chai stall"
                className="h-8 text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Theme</Label>
              <Input
                value={theme}
                onChange={e => setTheme(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-blue-700">1. What I saw</Label>
            <textarea
              rows={2}
              value={whatISaw}
              onChange={e => setWhatISaw(e.target.value)}
              placeholder="Describe the physical object, material, and context without adjectives..."
              className="w-full p-2 border rounded-lg text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-purple-700">2. How it works</Label>
            <textarea
              rows={2}
              value={howItWorks}
              onChange={e => setHowItWorks(e.target.value)}
              placeholder="The mechanical or spatial principle making it function..."
              className="w-full p-2 border rounded-lg text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-red-700">3. Where it fails</Label>
            <textarea
              rows={2}
              value={whereItFails}
              onChange={e => setWhereItFails(e.target.value)}
              placeholder="User friction, ergonomic breakdown, or physical fatigue..."
              className="w-full p-2 border rounded-lg text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-green-700">4. What I'd change</Label>
            <textarea
              rows={2}
              value={whatIdChange}
              onChange={e => setWhatIdChange(e.target.value)}
              placeholder="Specific material or form intervention in 2 lines..."
              className="w-full p-2 border rounded-lg text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-white font-bold text-xs"
            >
              {loading ? 'Saving...' : 'Save Diary Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 2. EXPLANATION CARD MODAL (5 Lines)
export function ExplanationCardModal({
  open,
  onOpenChange,
  candidateId,
  taskId,
  onSaved,
}: ModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [who, setWho] = useState('');
  const [whatBreaks, setWhatBreaks] = useState('');
  const [theMove, setTheMove] = useState('');
  const [whyThis, setWhyThis] = useState('');
  const [whatItCosts, setWhatItCosts] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await prepApi.saveExplanationCard({
        candidate_id: candidateId,
        task_id: taskId,
        who,
        what_breaks: whatBreaks,
        the_move: theMove,
        why_this: whyThis,
        what_it_costs: whatItCosts,
      });
      toast({ title: 'Card Saved', description: 'Explanation card saved.' });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold">
            Explanation Card (The 5 Lines)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Articulate any design move in 5 crisp lines.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2.5 py-2 text-xs">
          <div>
            <Label className="text-[11px] font-bold">1. Who (Specific human)</Label>
            <Input
              value={who}
              onChange={e => setWho(e.target.value)}
              placeholder="e.g. A 70-year old grandmother using an electric cooker"
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">2. What breaks (The friction)</Label>
            <Input
              value={whatBreaks}
              onChange={e => setWhatBreaks(e.target.value)}
              placeholder="e.g. Dial numbers are printed in faint silver, unreadable without glasses"
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">3. The move (Your intervention)</Label>
            <Input
              value={theMove}
              onChange={e => setTheMove(e.target.value)}
              placeholder="e.g. High-relief tactile stepped stops with audible clicks"
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">4. Why this (Principle)</Label>
            <Input
              value={whyThis}
              onChange={e => setWhyThis(e.target.value)}
              placeholder="e.g. Relies on proprioception rather than visual acuity"
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">5. What it costs (Honest tradeoff)</Label>
            <Input
              value={whatItCosts}
              onChange={e => setWhatItCosts(e.target.value)}
              placeholder="e.g. Adds 2 moving parts to the knob assembly"
              className="h-8 text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold text-xs h-9"
            >
              {loading ? 'Saving...' : 'Save Explanation Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 3. AWARENESS INDEX CARD MODAL
export function AwarenessCardModal({
  open,
  onOpenChange,
  candidateId,
  onSaved,
}: ModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [whatItIs, setWhatItIs] = useState('');
  const [whyItMattered, setWhyItMattered] = useState('');
  const [exampleSeen, setExampleSeen] = useState('');
  const [opinion, setOpinion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await prepApi.saveAwarenessCard({
        candidate_id: candidateId,
        topic,
        what_it_is: whatItIs,
        why_it_mattered: whyItMattered,
        example_seen: exampleSeen,
        opinion,
      });
      toast({ title: 'Awareness Card Saved' });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold">Awareness Index Card</DialogTitle>
          <DialogDescription className="text-xs">
            Opinions grounded in facts. Then defend the opposite for 2 minutes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2.5 py-2 text-xs">
          <div>
            <Label className="text-[11px] font-bold">Topic / Design Phenomenon</Label>
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. UPI QR code soundboxes at Indian kirana shops"
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">What it is</Label>
            <Input
              value={whatItIs}
              onChange={e => setWhatItIs(e.target.value)}
              placeholder="A voice payment confirmation device for busy retail environments"
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Why it mattered</Label>
            <Input
              value={whyItMattered}
              onChange={e => setWhyItMattered(e.target.value)}
              placeholder="Eliminated visual screen-checking friction for illiterate shopkeepers"
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">One example you have seen</Label>
            <Input
              value={exampleSeen}
              onChange={e => setExampleSeen(e.target.value)}
              placeholder="Street coconut vendor continuing to chop while listening for payment alert"
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Your opinion</Label>
            <textarea
              rows={2}
              value={opinion}
              onChange={e => setOpinion(e.target.value)}
              placeholder="One sentence with a defensible stance..."
              className="w-full p-2 border rounded-lg text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold text-xs h-9"
            >
              {loading ? 'Saving...' : 'Save Awareness Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 4. PITCH & MOCK CONVERSATION LOG MODAL
export function PitchLogModal({
  open,
  onOpenChange,
  candidateId,
  taskId,
  onSaved,
}: ModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'pitch' | 'mockConversation'>('pitch');
  const [topic, setTopic] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await prepApi.saveArticulationLog({
        candidate_id: candidateId,
        task_id: taskId,
        type,
        topic,
        recording_url: recordingUrl || null,
        notes,
      });
      toast({ title: 'Articulation Logged' });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-600" />
            Articulation & Pitch Log
          </DialogTitle>
          <DialogDescription className="text-xs">
            Record a 60-second audio/video pitch and note filler words or hesitations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2 text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('pitch')}
              className={`flex-1 py-1.5 rounded-lg border font-bold text-xs ${
                type === 'pitch' ? 'bg-primary text-white border-primary' : 'bg-white border-black/10'
              }`}
            >
              60s Pitch
            </button>
            <button
              type="button"
              onClick={() => setType('mockConversation')}
              className={`flex-1 py-1.5 rounded-lg border font-bold text-xs ${
                type === 'mockConversation'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-black/10'
              }`}
            >
              Mock Interview
            </button>
          </div>

          <div>
            <Label className="text-[11px] font-bold">Topic / Concept Explained</Label>
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. My Week 4 handheld water filtration brief"
              className="h-8 text-xs"
              required
            />
          </div>

          <div>
            <Label className="text-[11px] font-bold">Link to Recording (Loom, Drive, Vocaroo)</Label>
            <Input
              value={recordingUrl}
              onChange={e => setRecordingUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-[11px] font-bold">Self-Review & Filler Word Log</Label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Hesitated for 6 seconds on why not aluminium. Used 'like' four times."
              className="w-full p-2 border rounded-lg text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
            >
              {loading ? 'Saving...' : 'Save Articulation Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
