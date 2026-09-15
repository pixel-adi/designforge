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
import {
  Track,
  Tier,
  DiagnosticScores,
} from '../types';
import {
  PG_DISCIPLINE_GROUPS,
  validatePgDisciplines,
  calculateBand,
  AXIS_DISPLAY_NAMES,
} from '../resolver';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
  Feather,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: {
    track: Track;
    tier: Tier;
    disciplines?: string[];
    diagnosticScores: DiagnosticScores;
  }) => Promise<void>;
}

const AXIS_CRITERIA = [
  {
    id: 'observation',
    name: 'Observation',
    score5: 'You notice how things are made and where they fail, without being prompted, with written proof.',
  },
  {
    id: 'drawing',
    name: 'Drawing fluency',
    score5: 'You can put a recognisable object in correct perspective, in context, in under five minutes.',
  },
  {
    id: 'ideation',
    name: 'Ideation speed',
    score5: 'Ten distinct, non-trivial concepts in ten minutes, without stalling after the third.',
  },
  {
    id: 'form_material',
    name: 'Form and material',
    score5: 'Given paper, wire and tape, you can build a standing, working object in twenty minutes.',
  },
  {
    id: 'articulation',
    name: 'Articulation',
    score5: 'You can explain any concept in sixty seconds and defend why not the opposite.',
  },
  {
    id: 'awareness',
    name: 'Awareness',
    score5: 'You hold opinions about twenty designed things, Indian and global, and can defend them.',
  },
];

export function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<number>(1);
  const [track, setTrack] = useState<Track>('ug');
  const [tier, setTier] = useState<Tier>('intensive');
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [diagnosticScores, setDiagnosticScores] = useState<DiagnosticScores>({
    observation: 3,
    drawing: 3,
    ideation: 3,
    form_material: 3,
    articulation: 3,
    awareness: 3,
  });

  const totalScore = Object.values(diagnosticScores).reduce((a, b) => a + b, 0);
  const band = calculateBand(totalScore);

  const pgValidation = track === 'pg' ? validatePgDisciplines(selectedDisciplines) : { valid: true };

  const handleToggleDiscipline = (disc: string) => {
    if (selectedDisciplines.includes(disc)) {
      setSelectedDisciplines(selectedDisciplines.filter(d => d !== disc));
    } else {
      if (selectedDisciplines.length >= 3) {
        toast({
          title: 'Maximum 3 disciplines',
          description: 'NID rules allow a candidate to apply for up to three disciplines.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedDisciplines([...selectedDisciplines, disc]);
    }
  };

  const handleFinish = async () => {
    if (track === 'pg' && !pgValidation.valid) {
      toast({
        title: 'Invalid Discipline Combination',
        description: pgValidation.error || 'Please review your choices.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await onComplete({
        track,
        tier,
        disciplines: track === 'pg' ? selectedDisciplines : [],
        diagnosticScores,
      });
      toast({
        title: 'Plan Activated!',
        description: 'Your personalised 92-day schedule is ready.',
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Failed to save',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
              Step {step} of {track === 'pg' ? 4 : 3}
            </span>
          </div>
          <DialogTitle className="text-xl">
            {step === 1 && 'Select Your NID DAT 2027 Track'}
            {step === 2 && track === 'pg' && 'Choose Your M.Des Disciplines'}
            {((step === 2 && track === 'ug') || (step === 3 && track === 'pg')) &&
              'Choose Your Weekly Intensity Tier'}
            {((step === 3 && track === 'ug') || (step === 4 && track === 'pg')) &&
              'Self-Calibration Diagnostic (6 Axes)'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 &&
              'Undergraduate and Postgraduate exams run simultaneously on 20 December 2026. You can apply for only one.'}
            {step === 2 &&
              track === 'pg' &&
              'Select 1 to 3 disciplines according to official NID combination rules.'}
            {((step === 2 && track === 'ug') || (step === 3 && track === 'pg')) &&
              'Tailored to your current schedule. Below 8 hours a week the plan does not compress.'}
            {((step === 3 && track === 'ug') || (step === 4 && track === 'pg')) &&
              'Score your baseline from 1 to 5. Re-scored blindly in Week 8.'}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: PROGRAMME SELECTION */}
        {step === 1 && (
          <div className="py-4 space-y-4">
            <div
              onClick={() => setTrack('ug')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                track === 'ug'
                  ? 'border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary'
                  : 'border-black/10 hover:border-black/20 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#262626]">
                    B.Des & Integrated M.Des (UG)
                  </h3>
                  <p className="text-xs text-foreground/60 mt-1">
                    For candidates after Class 12. 5.5-year Integrated M.Des at NID Ahmedabad; 4-year B.Des at NID AP, MP, Haryana, Assam.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    track === 'ug' ? 'border-primary bg-primary text-white' : 'border-black/20'
                  }`}
                >
                  {track === 'ug' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>

            <div
              onClick={() => setTrack('pg')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                track === 'pg'
                  ? 'border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary'
                  : 'border-black/10 hover:border-black/20 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#262626]">
                    M.Des (Postgraduate)
                  </h3>
                  <p className="text-xs text-foreground/60 mt-1">
                    For graduates. 2.5-year Master of Design across 19 disciplines in Ahmedabad, Bengaluru and Gandhinagar.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    track === 'pg' ? 'border-primary bg-primary text-white' : 'border-black/20'
                  }`}
                >
                  {track === 'pg' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>NID Handbook Rule:</strong> Programme, Name, Date of Birth, Mobile, and Email ID cannot be changed after submission even during the edit window.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2 (PG ONLY): DISCIPLINE COMBINATIONS */}
        {step === 2 && track === 'pg' && (
          <div className="py-3 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#262626]">
                Selected ({selectedDisciplines.length}/3):
              </span>
              {!pgValidation.valid && selectedDisciplines.length > 0 && (
                <span className="text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {pgValidation.error}
                </span>
              )}
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {Object.entries(PG_DISCIPLINE_GROUPS).map(([groupKey, disciplines]) => (
                <div key={groupKey} className="border border-black/10 rounded-xl p-3 bg-black/[0.01]">
                  <h4 className="text-xs font-black text-foreground/70 uppercase tracking-wider mb-2">
                    {groupKey === 'GX' ? 'Group X (Interdisciplinary)' : `Group ${groupKey.slice(1)}`}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {disciplines.map(disc => {
                      const isSelected = selectedDisciplines.includes(disc);
                      return (
                        <button
                          key={disc}
                          type="button"
                          onClick={() => handleToggleDiscipline(disc)}
                          className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary font-bold'
                              : 'bg-white border-black/10 text-foreground/80 hover:bg-black/5'
                          }`}
                        >
                          <span className="line-clamp-1">{disc}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-foreground/60 p-2.5 bg-black/[0.02] rounded-lg border border-black/5">
              <strong>Rules:</strong> Up to 2 from the same group (not GX), plus optional 1 from Group X. Exam fee is charged per discipline.
            </div>
          </div>
        )}

        {/* STEP: TIER SELECTION */}
        {((step === 2 && track === 'ug') || (step === 3 && track === 'pg')) && (
          <div className="py-4 space-y-4">
            <div
              onClick={() => setTier('intensive')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                tier === 'intensive'
                  ? 'border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary'
                  : 'border-black/10 hover:border-black/20 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#262626]">Intensive Tier</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-orange-100 text-orange-700 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Recommended
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">
                    18 to 22 hours per week. Full weekly operating system plus two 90-minute weak-axis blocks, extra field missions and pitches.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    tier === 'intensive' ? 'border-primary bg-primary text-white' : 'border-black/20'
                  }`}
                >
                  {tier === 'intensive' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>

            <div
              onClick={() => setTier('light')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                tier === 'light'
                  ? 'border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary'
                  : 'border-black/10 hover:border-black/20 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#262626]">Light Tier</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                      <Feather className="w-3 h-3" /> Balanced
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">
                    12 to 15 hours per week. Protects the four non-negotiables: daily drill, weekly critique, Saturday simulation, and Sunday review.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    tier === 'light' ? 'border-primary bg-primary text-white' : 'border-black/20'
                  }`}
                >
                  {tier === 'light' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-black/5 bg-black/[0.02] p-3 text-xs text-foreground/70 flex items-center gap-2">
              <Info className="w-4 h-4 text-foreground/40 shrink-0" />
              <span>You can adjust your tier anytime in settings as your semester or workload changes.</span>
            </div>
          </div>
        )}

        {/* STEP: DIAGNOSTIC ENTRY */}
        {((step === 3 && track === 'ug') || (step === 4 && track === 'pg')) && (
          <div className="py-3 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-black/10 bg-black/[0.02]">
              <div>
                <span className="text-xs text-foreground/50 font-bold uppercase tracking-wider">
                  Baseline Diagnostic
                </span>
                <div className="text-xl font-black text-[#262626]">
                  {totalScore} / 30
                  <span className="text-xs font-bold text-foreground/60 ml-2">
                    Band:{' '}
                    <strong className="text-primary capitalize">{band}</strong>
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-black/10 text-foreground/80">
                {band === 'foundation' && 'Foundation first (6–13)'}
                {band === 'standard' && 'Standard build (14–22)'}
                {band === 'sharpening' && 'Sharpening (23–30)'}
              </span>
            </div>

            <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
              {AXIS_CRITERIA.map(axis => {
                const val = diagnosticScores[axis.id as keyof DiagnosticScores];
                return (
                  <div
                    key={axis.id}
                    className="p-3.5 rounded-xl border border-black/10 bg-white space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-sm text-[#262626]">
                        {axis.name}
                      </Label>
                      <span className="font-extrabold text-sm text-primary">
                        {val} / 5
                      </span>
                    </div>

                    <p className="text-[11px] text-foreground/60 italic leading-relaxed">
                      <strong>Score 5:</strong> {axis.score5}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          type="button"
                          onClick={() =>
                            setDiagnosticScores({
                              ...diagnosticScores,
                              [axis.id]: score,
                            })
                          }
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            val === score
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-black/5 text-foreground/60 hover:bg-black/10'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-3 pt-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={saving}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {((track === 'ug' && step === 3) || (track === 'pg' && step === 4)) ? (
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-white font-bold gap-1.5"
            >
              {saving ? 'Activating...' : 'Activate 92-Day Plan'}
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                if (track === 'pg' && step === 2 && !pgValidation.valid) {
                  toast({
                    title: 'Invalid Disciplines',
                    description: pgValidation.error,
                    variant: 'destructive',
                  });
                  return;
                }
                setStep(step + 1);
              }}
              className="bg-[#262626] hover:bg-black text-white font-bold gap-1.5"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
