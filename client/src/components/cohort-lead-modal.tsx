import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface CohortLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill context, e.g. "Founding Cohort", "Early Bird", "Brochure" */
  context?: string;
}

const DEFAULT_INTEREST_OPTIONS = [
  "Founding Cohort",
  "Early Bird",
  "Regular",
  "Brochure Download",
  "General Interest",
];

export function CohortLeadModal({ open, onOpenChange, context = "" }: CohortLeadModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState(context || "Founding Cohort");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync context prop when it changes
  useEffect(() => {
    if (context) setInterest(context);
  }, [context]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setName("");
        setEmail("");
        setPhone("");
        setInterest(context || "Founding Cohort");
        setIsSubmitting(false);
        setIsDone(false);
        setError(null);
      }, 300);
    }
  }, [open, context]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Basic validation
    if (!name.trim() || name.trim().length < 2) { setError("Please enter your name."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email."); return; }
    if (!phone.trim() || !/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ""))) { setError("Please enter a valid phone number."); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Try sending to supabase leads/cohort_leads table
      const leadPayload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.replace(/[\s-]/g, "").trim(),
        interest: interest,
        source: window.location.pathname,
        program: "AI-Native UX",
        created_at: new Date().toISOString(),
      };

      // Save locally to localStorage as backup
      try {
        const stored = JSON.parse(localStorage.getItem("df_leads") || "[]");
        const exists = stored.some((s: any) => s.email === leadPayload.email && s.interest === leadPayload.interest);
        if (!exists) {
          stored.unshift({ ...leadPayload, id: `local-${Date.now()}` });
          localStorage.setItem("df_leads", JSON.stringify(stored));
          window.dispatchEvent(new Event("df_lead_added"));
        }
      } catch (e) {
        // ignore
      }

      // Try inserting into cohort_leads or leads
      const { error: dbError } = await supabase.from("cohort_leads").insert(leadPayload);
      if (dbError) {
        console.warn("cohort_leads table insert warning:", dbError.message);
        try {
          await supabase.from("leads").insert(leadPayload);
        } catch {
          // silent fallback
        }
      }

      setIsDone(true);
    } catch (err) {
      console.error("Lead submit error:", err);
      // Still show success — don't block user experience
      setIsDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background rounded-3xl shadow-2xl border border-black/5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 overflow-hidden">
        {/* Close */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-foreground/60" />
        </button>

        <div className="p-8 md:p-10">
          {isDone ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-heading text-[#262626] mb-3">You're on the list.</h3>
              <p className="text-foreground/70 mb-8 leading-relaxed max-w-sm text-sm md:text-base">
                We've received your interest for <strong>{interest}</strong>. Our team will reach out with the cohort schedule and registration details shortly.
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-12 rounded-2xl text-base btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] transition-all"
              >
                Close Window
              </Button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> AI-Native UX · 2026 Cohort
                </div>
                <h3 className="text-2xl md:text-3xl font-heading text-[#262626] mb-2">
                  {context === "Brochure Download" ? "Download Course Brochure" : "Register Your Interest"}
                </h3>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  {context === "Brochure Download"
                    ? "Enter your details to receive the detailed 18-week curriculum brochure."
                    : "Leave your details to secure your spot or receive cohort onboarding details."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="lead-name" className="text-sm font-medium text-foreground/80">Full Name <span className="text-primary">*</span></Label>
                  <Input
                    id="lead-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Tanisha Mahajan"
                    className="h-12 px-4 bg-white/60 focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-email" className="text-sm font-medium text-foreground/80">Email <span className="text-primary">*</span></Label>
                  <Input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 px-4 bg-white/60 focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-phone" className="text-sm font-medium text-foreground/80">Phone Number <span className="text-primary">*</span></Label>
                  <Input
                    id="lead-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-12 px-4 bg-white/60 focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">Track / Plan Preference</Label>
                  <Select value={interest} onValueChange={setInterest}>
                    <SelectTrigger className="h-12 px-4 bg-white/60 focus:ring-primary/20 focus:border-primary text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-base p-1 z-[210]">
                      {DEFAULT_INTEREST_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="py-2.5 cursor-pointer">
                          {opt}
                        </SelectItem>
                      ))}
                      {!DEFAULT_INTEREST_OPTIONS.includes(interest) && (
                        <SelectItem value={interest} className="py-2.5 cursor-pointer">
                          {interest}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <p className="text-sm text-red-500 font-medium mt-3">{error}</p>
                )}

                <div className="mt-8 pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-13 rounded-2xl text-base btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <>
                        {context === "Brochure Download" ? "Get Brochure" : "Submit Registration"} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-foreground/40 mt-4">
                    No payment required. We will reach out directly with details.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
