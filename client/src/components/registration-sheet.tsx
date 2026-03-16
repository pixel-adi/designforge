import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ArrowRight, ArrowLeft, QrCode } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid 10-15 digit phone number"),
  program: z.string().min(1, "Please select a mentorship track"),
  stage: z.string().min(1, "Please select your current stage"),
});

type FormValues = z.infer<typeof formSchema>;

interface RegistrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProgram?: string;
}

export function RegistrationSheet({ open, onOpenChange, defaultProgram = "Focus Batch" }: RegistrationSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<Partial<FormValues>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isValid }, setValue, watch, trigger, reset } = useForm<FormValues>({
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

  const onFinalSubmit = async () => {
    setIsProcessing(true);
    // In a real application, submit to backend here
    const finalData = { ...watch() };
    console.log("Registration Data Confirmed:", finalData);
    
    // Simulate API call delay for payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setStep(3);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form slightly after close animation
      setTimeout(() => {
        setStep(1);
        setIsProcessing(false);
        reset({ program: defaultProgram });
      }, 300);
    }
  };

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
                <Button variant="ghost" className="mb-4 -ml-4 h-8 px-4 text-foreground/60 hover:text-foreground hover:bg-transparent" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to details
                </Button>
                <SheetTitle className="text-4xl font-heading tracking-tight text-[#262626]">Complete Registration</SheetTitle>
                <SheetDescription className="text-base text-foreground/70 mt-3 leading-relaxed">
                  You are registering for <span className="text-foreground font-medium">{watch('program')}</span>. Please complete this mock UPI payment to proceed.
                </SheetDescription>
              </>
            )}
            {step === 3 && (
               <>
                 <SheetTitle className="sr-only">Application Success</SheetTitle>
                 <SheetDescription className="sr-only">Your application has been received successfully.</SheetDescription>
               </>
            )}
          </SheetHeader>

          {step === 3 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center h-full animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-3xl font-heading mb-4">Application Received</h3>
              <p className="text-foreground/70 mb-10 text-lg max-w-[320px] leading-relaxed">
                Thank you for applying to <strong>{watch('program')}</strong>. We will review your details and reach out within 24-48 hours.
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
              <div className="bg-white rounded-2xl p-8 border border-border shadow-sm text-center">
                <div className="w-48 h-48 mx-auto bg-black/5 rounded-xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center mb-6 text-foreground/40">
                  <QrCode className="w-16 h-16 mb-2 opacity-50" />
                  <span className="text-sm font-medium">Mock QR Code</span>
                </div>
                
                <h4 className="text-xl font-heading mb-2">Scan to Pay</h4>
                <p className="text-foreground/60 text-sm mb-6">Use any UPI app (GPay, PhonePe, Paytm)</p>
                
                <div className="bg-primary/5 rounded-xl p-4 inline-block text-left w-full max-w-[280px]">
                  <p className="text-sm text-foreground/60 mb-1">UPI ID</p>
                  <p className="font-mono font-medium text-foreground tracking-wide">designforge@okicici</p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  type="button" 
                  onClick={onFinalSubmit}
                  disabled={isProcessing}
                  className="w-full text-lg h-14 rounded-xl group btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-white/20 transition-transform duration-500 ease-out translate-x-[-100%] ${isProcessing ? 'translate-x-[100%]' : 'group-hover:translate-x-[100%]'}`} />
                  {isProcessing ? "Verifying Payment..." : "I have completed the payment"}
                </Button>
                <p className="text-center text-sm text-foreground/50 mt-6 leading-relaxed">
                  Payment verification is a mock process for this demo. Just click the button to proceed.
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
