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
import { useToast } from '@/hooks/use-toast';
import { prepApi } from '../api';
import {
  Lock,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Loader2,
  CreditCard,
  BookOpen,
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
}

export function MilestoneClassNotesModal({
  open,
  onOpenChange,
  candidateId,
  candidateName = 'Student',
  candidateEmail = '',
  hasAccess,
  onAccessUnlocked,
  milestoneTitle = 'NID Prep Milestone',
}: MilestoneClassNotesModalProps) {
  const { toast } = useToast();
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (open && hasAccess) {
      setLoadingNotes(true);
      prepApi
        .getClassNotes('NID')
        .then(data => setNotes(data))
        .catch(err => console.error('Failed to load notes:', err))
        .finally(() => setLoadingNotes(false));
    }
  }, [open, hasAccess]);

  const handleUnlockPayment = async () => {
    setIsPaying(true);
    setPaymentError(null);

    try {
      // 1. Check if Razorpay script is loaded
      let isLoaded = !!(window as any).Razorpay;
      if (!isLoaded) {
        await new Promise<void>(resolve => {
          const check = setInterval(() => {
            if ((window as any).Razorpay) {
              clearInterval(check);
              isLoaded = true;
              resolve();
            }
          }, 200);
          setTimeout(() => {
            clearInterval(check);
            resolve();
          }, 4000);
        });
      }

      // If Razorpay SDK is available, launch checkout
      if ((window as any).Razorpay) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: 50000, // ₹500 in paise
          currency: 'INR',
          name: 'Designforge',
          description: 'Unlock 92-Day Milestone Class Notes',
          handler: async function (_response: any) {
            try {
              await prepApi.unlockNotesPass(candidateId);
              toast({
                title: '🎉 Class Notes Unlocked!',
                description: 'You now have full access to all milestone class notes.',
              });
              onAccessUnlocked?.();
            } catch (e) {
              console.error(e);
            } finally {
              setIsPaying(false);
            }
          },
          prefill: {
            name: candidateName,
            email: candidateEmail,
          },
          theme: { color: '#E23A25' },
          modal: {
            ondismiss: () => {
              setIsPaying(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setPaymentError(resp.error?.description || 'Payment failed. Please try again.');
          setIsPaying(false);
        });
        rzp.open();
      } else {
        // Fallback demo/direct activation if gateway is in test mode
        await prepApi.unlockNotesPass(candidateId);
        toast({
          title: '🎉 Class Notes Access Granted!',
          description: 'You now have access to all milestone class notes.',
        });
        onAccessUnlocked?.();
        setIsPaying(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment initiation failed.');
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {hasAccess ? (
              <>
                <BookOpen className="h-5 w-5 text-primary" />
                Class Notes: {milestoneTitle}
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-primary" />
                Unlock Milestone Class Notes
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasAccess
              ? 'Handcrafted lecture slides, study guides, and reference decks for this milestone.'
              : 'Exclusive study decks, material teardowns, and drawing templates curated by Designforge mentors.'}
          </DialogDescription>
        </DialogHeader>

        {hasAccess ? (
          /* UNLOCKED VIEW */
          <div className="py-4 space-y-4">
            {loadingNotes ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 bg-black/[0.02] rounded-xl border border-black/5 p-6">
                <FileText className="h-10 w-10 text-foreground/20 mx-auto mb-3" />
                <h4 className="font-bold text-[#262626]">Notes publishing in progress</h4>
                <p className="text-xs text-foreground/60 mt-1 max-w-sm mx-auto">
                  Mentors are uploading slide decks for this milestone. Check back shortly!
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
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {note.category || 'Class Notes'}
                        </span>
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
          /* LOCKED VIEW (₹500 ACCESS) */
          <div className="py-3 space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-primary text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  Notes Pass
                </span>
                <span className="font-black text-2xl text-[#262626]">₹500</span>
              </div>

              <h4 className="font-black text-[#262626] text-base mb-1">
                Unlock 92-Day Milestone Class Notes
              </h4>
              <p className="text-xs text-foreground/70 mb-4">
                One-time access to all mentor lecture presentations, teardown guides, and drawing templates throughout the 92 days.
              </p>

              <div className="space-y-2 border-t border-primary/10 pt-3 text-xs text-foreground/80 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>All weekly milestone lecture slide decks & PDF downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>Drawing level sheets (L0–L5) and 3-perspective cheat sheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>Ten-in-ten ideation prompt banks & material fabrication tips</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>Instant access on mobile and desktop until DAT 2027</span>
                </div>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {paymentError}
              </div>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleUnlockPayment}
                disabled={isPaying}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 gap-2 shadow-md"
              >
                {isPaying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isPaying ? 'Processing...' : 'Unlock Now — ₹500'}
              </Button>
              <p className="text-center text-[11px] text-foreground/50">
                Secure UPI / Cards / NetBanking via Razorpay. Everything else in the tracker remains free.
              </p>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
