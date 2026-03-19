import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ArrowRight, ArrowLeft, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid 10-15 digit phone number"),
  program: z.string().min(1, "Please select a mentorship track"),
  stage: z.string().min(1, "Please select your current stage"),
});

type FormValues = z.infer<typeof formSchema>;

// Program pricing (in INR)
const programPricing: Record<string, number> = {
  "NID B.Des": 29999,
  "NID M.Des": 29999,
  "CEED": 24999,
  "UCEED": 24999,
  "Private Colleges": 19999,
  "Abroad Colleges": 34999,
};

interface RegistrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProgram?: string;
}

export function RegistrationSheet({ open, onOpenChange, defaultProgram = "Focus Batch" }: RegistrationSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'saving' | 'creating' | 'redirecting' | null>(null);

  const { register, formState: { errors }, setValue, watch, trigger, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      program: "",
    }
  });

  const onNextStep = async () => {
    const isStepValid = await trigger();
    if (isStepValid) {
      setStep(2);
    }
  };

  const initiatePayment = async () => {
    setIsProcessing(true);
    setSubmitError(null);
    const formData = { ...watch() };
    const amount = programPricing[formData.program] || 29999;

    try {
      // Step 1: Save registration to Supabase
      setPaymentStep('saving');
      // Generate ID client-side to avoid needing a SELECT policy for anon users
      const registrationId = crypto.randomUUID();
      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          id: registrationId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          program: formData.program,
          stage: formData.stage,
          payment_status: 'pending',
        });

      if (regError) {
        console.error('Registration insert error:', regError);
        setSubmitError('Could not save your registration. Please try again.');
        setIsProcessing(false);
        setPaymentStep(null);
        return;
      }

      // Step 2: Create Cashfree order via Edge Function
      setPaymentStep('creating');
      const { data: rawResponse, error: fnError } = await supabase.functions.invoke('create-order', {
        body: {
          registration_id: registrationId,
          amount,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone.replace(/^\+/, ''),
        },
      });

      console.log('Edge Function response:', { rawResponse, fnError });

      // supabase.functions.invoke may return data as-is or wrapped
      const orderResponse = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;

      if (fnError || !orderResponse?.payment_session_id) {
        console.error('Order creation error:', fnError, orderResponse);
        setSubmitError('Could not initiate payment. Please try again or contact us.');
        setIsProcessing(false);
        setPaymentStep(null);
        return;
      }

      // Step 3: Open Cashfree checkout
      setPaymentStep('redirecting');
      const { load: loadCashfree } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await loadCashfree({ mode: "production" });

      const checkoutOptions = {
        paymentSessionId: orderResponse.payment_session_id,
        redirectTarget: "_modal" as const,
      };

      const result = await cashfree.checkout(checkoutOptions);

      if (result.error) {
        console.error('Cashfree checkout error:', result.error);
        setSubmitError('Payment was not completed. You can try again.');
        setIsProcessing(false);
        setPaymentStep(null);
        return;
      }

      if (result.paymentDetails) {
        // Payment completed successfully
        setStep(3);
      }

      setIsProcessing(false);
      setPaymentStep(null);
    } catch (err) {
      console.error('Unexpected error:', err);
      setSubmitError('Something went wrong. Please try again or contact us directly.');
      setIsProcessing(false);
      setPaymentStep(null);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        setStep(1);
        setIsProcessing(false);
        setSubmitError(null);
        setPaymentStep(null);
        reset({ program: defaultProgram });
      }, 300);
    }
  };

  const selectedProgram = watch('program');
  const displayAmount = selectedProgram ? programPricing[selectedProgram] : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[750px] bg-background border-l border-black/5 flex flex-col p-0 sm:max-w-[750px] z-[100]">
        <div className="flex-1 overflow-y-auto w-full px-8 py-10 md:px-12 md:py-14">

          {step !== 3 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Step {step} of 2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary' : 'bg-primary/20'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-primary/20'}`} />
              </div>
            </div>
          )}

          <SheetHeader className="mb-10 text-left scale-100 transition-all">
            {step === 1 && (
              <>
                <SheetTitle className="text-4xl font-heading tracking-tight text-[#262626]">Focus Batch Registration</SheetTitle>
                <SheetDescription className="text-base text-foreground/70 mt-3 leading-relaxed">
                  Leave your details below and our team will get back to you with the next steps for your enrollment.
                </SheetDescription>
              </>
            )}
            {step === 2 && (
              <>
                <Button variant="ghost" className="mb-4 -ml-4 h-8 px-4 text-foreground/60 hover:text-foreground hover:bg-transparent" onClick={() => { setStep(1); setSubmitError(null); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to details
                </Button>
                <SheetTitle className="text-4xl font-heading tracking-tight text-[#262626]">Complete Payment</SheetTitle>
                <SheetDescription className="text-base text-foreground/70 mt-3 leading-relaxed">
                  You are registering for <span className="text-foreground font-medium">{watch('program')}</span>. Complete payment to secure your spot.
                </SheetDescription>
              </>
            )}
            {step === 3 && (
              <>
                <SheetTitle className="sr-only">Payment Success</SheetTitle>
                <SheetDescription className="sr-only">Your payment has been completed successfully.</SheetDescription>
              </>
            )}
          </SheetHeader>

          {step === 3 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center h-full animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-3xl font-heading mb-4">Payment Successful!</h3>
              <p className="text-foreground/70 mb-10 text-lg max-w-[320px] leading-relaxed">
                Thank you for enrolling in <strong>{watch('program')}</strong>. We will send you a confirmation email with next steps shortly.
              </p>
              <Button
                onClick={() => handleOpenChange(false)}
                className="w-full h-14 rounded-xl text-lg btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all"
              >
                Close Window
              </Button>
            </div>
          ) : step === 1 ? (
            <form className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground/80">Full Name <span className="text-primary">*</span></Label>
                  <Input
                    id="name"
                    placeholder="Aditya Sharma"
                    className={`h-14 px-4 bg-white/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-base ${errors.name ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                    {...register("name")}
                  />
                  {errors.name && <p className="text-sm text-red-500 font-medium mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email Address <span className="text-primary">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className={`h-14 px-4 bg-white/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-base ${errors.email ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                    {...register("email")}
                  />
                  {errors.email && <p className="text-sm text-red-500 font-medium mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">Phone Number <span className="text-primary">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className={`h-14 px-4 bg-white/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-base ${errors.phone ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                    {...register("phone")}
                  />
                  {errors.phone && <p className="text-sm text-red-500 font-medium mt-1">{errors.phone.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="program" className="text-sm font-medium text-foreground/80">Mentorship Track <span className="text-primary">*</span></Label>
                  <Select
                    onValueChange={(value) => setValue("program", value, { shouldValidate: true })}
                    defaultValue={watch("program")}
                  >
                    <SelectTrigger className={`h-14 px-4 bg-white/60 focus:ring-primary/20 focus:border-primary transition-all text-left text-base ${errors.program ? 'border-red-500 focus:ring-red-500/20' : ''}`}>
                      <SelectValue placeholder="Select a track" />
                    </SelectTrigger>
                    <SelectContent className="text-base p-1 z-[110] relative">
                      <SelectItem value="NID B.Des" className="py-3 cursor-pointer">NID B.Des</SelectItem>
                      <SelectItem value="NID M.Des" className="py-3 cursor-pointer">NID M.Des</SelectItem>
                      <SelectItem value="CEED" className="py-3 cursor-pointer">CEED</SelectItem>
                      <SelectItem value="UCEED" className="py-3 cursor-pointer">UCEED</SelectItem>
                      <SelectItem value="Private Colleges" className="py-3 cursor-pointer">Private Colleges</SelectItem>
                      <SelectItem value="Abroad Colleges" className="py-3 cursor-pointer">Abroad Colleges</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.program && <p className="text-sm text-red-500 font-medium mt-1">{errors.program.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="stage" className="text-sm font-medium text-foreground/80">Current Stage <span className="text-primary">*</span></Label>
                  <Select
                    onValueChange={(value) => setValue("stage", value, { shouldValidate: true })}
                    defaultValue={watch("stage")}
                  >
                    <SelectTrigger className={`h-14 px-4 bg-white/60 focus:ring-primary/20 focus:border-primary transition-all text-left text-base ${errors.stage ? 'border-red-500 focus:ring-red-500/20' : ''}`}>
                      <SelectValue placeholder="Select your current stage" />
                    </SelectTrigger>
                    <SelectContent className="text-base p-1 z-[110] relative">
                      <SelectItem value="12th Appearing" className="py-3 cursor-pointer">12th Appearing</SelectItem>
                      <SelectItem value="11th Appearing" className="py-3 cursor-pointer">11th Appearing</SelectItem>
                      <SelectItem value="Drop Year" className="py-3 cursor-pointer">Drop Year</SelectItem>
                      <SelectItem value="Doing Job" className="py-3 cursor-pointer">Doing Job</SelectItem>
                      <SelectItem value="Transitioning" className="py-3 cursor-pointer">Transitioning</SelectItem>
                      <SelectItem value="On Career break" className="py-3 cursor-pointer">On Career break</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.stage && <p className="text-sm text-red-500 font-medium mt-1">{errors.stage.message}</p>}
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="button"
                  onClick={onNextStep}
                  className="w-full text-lg h-14 rounded-xl group btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-center text-sm text-foreground/50 mt-6 leading-relaxed px-4">
                  By continuing, you agree to our privacy policy and terms of service.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl p-8 border border-border shadow-sm">
                <h4 className="text-xl font-heading mb-6">Order Summary</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-foreground/60">Program</span>
                    <span className="font-medium text-foreground">{watch('program')}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-foreground/60">Name</span>
                    <span className="font-medium text-foreground">{watch('name')}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-foreground/60">Email</span>
                    <span className="font-medium text-foreground text-sm">{watch('email')}</span>
                  </div>
                  {displayAmount && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-medium text-foreground">Total</span>
                      <span className="text-2xl font-heading text-primary">₹{displayAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment CTA */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={initiatePayment}
                  disabled={isProcessing}
                  className="w-full text-lg h-14 rounded-xl group btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {paymentStep === 'saving' && 'Saving details...'}
                      {paymentStep === 'creating' && 'Preparing payment...'}
                      {paymentStep === 'redirecting' && 'Opening checkout...'}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay ₹{displayAmount?.toLocaleString('en-IN') || '—'}
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-foreground/50 mt-6 leading-relaxed">
                  Secure payment powered by Cashfree. UPI, cards, and netbanking accepted.
                </p>
                {submitError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
