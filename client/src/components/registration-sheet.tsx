import { useState, useEffect } from "react";
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

// Flat pricing for all programs (in INR)
const ORIGINAL_PRICE = 22000;
const ONE_TIME_PRICE = 20000;
const INSTALLMENT_FIRST = 12000;
const INSTALLMENT_SECOND = 10000;

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
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');

  const { register, formState: { errors }, setValue, watch, trigger, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      program: "",
    }
  });

  // Pre-load Razorpay script as soon as the drawer opens
  useEffect(() => {
    if (open && !document.getElementById('razorpay-checkout-js')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [open]);

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
    
    // Strict Phone Sanitization (strip all spaces, dashes, + signs to keep pure digits)
    const sanitizedPhone = formData.phone.replace(/\D/g, "");

    try {
      // Step 1: Create Razorpay order via Edge Function
      setPaymentStep('creating');
      
      let rawResponse = null;
      let fnError = null;

      // 3-attempt auto-retry loop
      for (let attempt = 1; attempt <= 3; attempt++) {
        const result = await supabase.functions.invoke('create-order', {
          body: {
            formData: {
              name: formData.name,
              email: formData.email,
              phone: sanitizedPhone,
              program: formData.program,
              stage: formData.stage,
            },
            paymentType
          },
        });

        rawResponse = result.data;
        fnError = result.error;

        if (!fnError && rawResponse?.order_id) break; // Success!
        
        if (attempt < 3) {
          console.warn(`Payment initiate attempt ${attempt} failed, retrying...`);
          await new Promise(res => setTimeout(res, 1000 * attempt));
        }
      }

      console.log('Edge Function response:', { rawResponse, fnError });

      const orderResponse = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;

      if (fnError || !orderResponse?.order_id || !orderResponse?.key_id) {
        console.error('Order creation error:', fnError, orderResponse);
        const errorMessage = orderResponse?.error 
          ? (typeof orderResponse.error === 'string' ? orderResponse.error : JSON.stringify(orderResponse.error))
          : (fnError?.message || 'Could not initiate payment. Please try again or contact us.');
        setSubmitError(errorMessage);
        setIsProcessing(false);
        setPaymentStep(null);
        return;
      }

      // Step 2: Open Razorpay checkout
      setPaymentStep('redirecting');
      
      // The script is already preloaded by useEffect, but wait for window object to be ready just in case
      let isLoaded = !!(window as any).Razorpay;
      if (!isLoaded) {
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if ((window as any).Razorpay) {
              clearInterval(check);
              isLoaded = true;
              resolve();
            }
          }, 200);
          setTimeout(() => { clearInterval(check); resolve(); }, 4000); // 4 second timeout
        });
      }

      if (!isLoaded) {
        setSubmitError('Failed to load payment gateway. Please disable ad-blockers and try again.');
        setIsProcessing(false);
        setPaymentStep(null);
        return;
      }

      const options = {
        key: orderResponse.key_id, 
        amount: orderResponse.amount, 
        currency: "INR",
        name: "Designforge",
        description: formData.program + " Mentorship Registration",
        order_id: orderResponse.order_id,
        handler: async function (response: any) {
          // Verify payment server-side
          setIsProcessing(true);
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
              }
            });

            // Check for Supabase-level transport error
            if (verifyError) {
              console.error('Verification transport error:', verifyError);
              // Payment DID go through on Razorpay — don't show hard failure
              setStep(3);
              return;
            }

            // Check for application-level error returned inside the 200 body
            if (verifyData?.error) {
              console.error('Verification logic error:', verifyData.error);
              // Signature mismatch or DB error — still advance user since Razorpay succeeded
              // Webhook will update DB in background
              setStep(3);
              return;
            }

            setStep(3); // Payment verified successfully
          } catch (err) {
            console.error('Verification exception:', err);
            // Don't block user — payment was captured by Razorpay, webhook will sync DB
            setStep(3);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#E23A25" // Designforge primary brand color roughly
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            setPaymentStep(null);
            setSubmitError('Payment was cancelled.');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        setSubmitError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

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
        setPaymentType('full');
        reset({ program: defaultProgram });
      }, 300);
    }
  };

  const currentAmount = paymentType === 'full' ? ONE_TIME_PRICE : INSTALLMENT_FIRST;

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
              <div className="flex flex-col">
                <Button variant="ghost" className="self-start -ml-2 mb-6 h-8 px-2 text-foreground/60 hover:text-foreground hover:bg-transparent" onClick={() => { setStep(1); setSubmitError(null); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to details
                </Button>
                <SheetTitle className="text-4xl font-heading tracking-tight text-[#262626]">Complete Payment</SheetTitle>
                <SheetDescription className="text-base text-foreground/70 mt-3 leading-relaxed">
                  You are registering for <strong className="text-foreground font-bold">{watch('program')}</strong>. Complete payment to secure your spot.
                </SheetDescription>
              </div>
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
                    placeholder="Ex: Tanisha Mahajan"
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
              <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-black/5 shadow-sm">
                <h4 className="text-lg font-bold text-foreground/80 mb-5 uppercase tracking-wider text-xs">Order Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/60 text-sm font-medium">Program</span>
                    <span className="font-bold text-foreground text-sm">{watch('program')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/60 text-sm font-medium">Name</span>
                    <span className="font-bold text-foreground text-sm">{watch('name')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/60 text-sm font-medium">Email</span>
                    <span className="font-bold text-foreground text-sm">{watch('email')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Choose payment option</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${paymentType === 'full'
                        ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                        : 'border-border bg-white hover:border-primary/30 hover:bg-gray-50'
                      }`}
                  >
                    {paymentType === 'full' && <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">SELECTED</div>}
                    <p className="text-sm font-bold text-foreground/70 mb-2">One-time Payment</p>
                    <p className="text-2xl font-black text-foreground mb-1">₹{ONE_TIME_PRICE.toLocaleString('en-IN')}</p>
                    <p className="text-xs font-bold text-green-600"><span className="line-through text-foreground/30 mr-1">₹{ORIGINAL_PRICE.toLocaleString('en-IN')}</span> Save ₹{(ORIGINAL_PRICE - ONE_TIME_PRICE).toLocaleString('en-IN')}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('installment')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${paymentType === 'installment'
                        ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                        : 'border-border bg-white hover:border-primary/30 hover:bg-gray-50'
                      }`}
                  >
                    {paymentType === 'installment' && <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">SELECTED</div>}
                    <p className="text-sm font-bold text-foreground/70 mb-2">EMI / Installments</p>
                    <p className="text-2xl font-black text-foreground mb-1">₹{INSTALLMENT_FIRST.toLocaleString('en-IN')}</p>
                    <p className="text-xs font-bold text-foreground/50">+ ₹{INSTALLMENT_SECOND.toLocaleString('en-IN')} due after 1 month</p>
                  </button>
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
                      Pay ₹{currentAmount.toLocaleString('en-IN')}
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-foreground/50 mt-6 leading-relaxed">
                  Secure payment powered by Razorpay. UPI, cards, and netbanking accepted.
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
