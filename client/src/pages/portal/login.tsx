import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";

export default function PortalLogin() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

  const isValidCandidateEmail = (emailAddress: string) => {
    // 1. Block + aliases often used for generating multiple accounts
    if (emailAddress.includes('+')) return false;

    const domain = emailAddress.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    // 2. Allow list of standard trusted providers and academic domains
    const trustedDomains = [
      'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 
      'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com', 
      'mac.com', 'me.com'
    ];
    
    if (trustedDomains.includes(domain)) return true;
    
    // 3. Allow university/academic domains
    if (domain.endsWith('.edu') || domain.endsWith('.ac.in') || domain.endsWith('.edu.in')) return true;

    return false;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!isValidCandidateEmail(email)) {
      toast({ 
        title: "Invalid Email Provider", 
        description: "Please use a standard email provider (Gmail, Yahoo, Outlook, etc.) or a university email. Disposable/generated emails are not allowed.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });
      if (error) throw error;
      setStep('otp');
      toast({ title: "OTP Sent", description: "Please check your email for the verification code." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      if (error) throw error;
      if (data.session) {
        toast({ title: "Success", description: "Successfully logged in." });
        setLocation('/portal/dashboard');
      }
    } catch (err: any) {
      toast({ title: "Invalid Code", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/portal/dashboard'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row-reverse">
      {/* Right Column - Form */}
      <div className="w-full lg:w-[30%] lg:min-w-[400px] max-w-xl mx-auto lg:mx-0 p-8 sm:p-12 xl:p-16 flex flex-col justify-center relative bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.05)] z-10 border-l border-black/5">

        <div className="w-full max-w-sm mx-auto mt-16 sm:mt-0">
          <img src={logoImg} alt="Designforge" className="h-10 mb-12" />
          
          <h1 className="text-3xl font-bold tracking-tight text-[#262626] mb-2">Student Portal</h1>
          <p className="text-foreground/60 mb-8 leading-relaxed">
            {step === 'email' 
              ? "Sign in or create an account to access your personalized dashboard and mock tests." 
              : `We've sent a 6-digit code to ${email}`}
          </p>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 bg-background/50 border-black/10 focus:bg-white"
                  />
                  <Mail className="w-4 h-4 text-foreground/40 absolute left-3.5 top-4" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 btn-bold bg-primary text-white hover:bg-primary/90 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue with Email"}
              </Button>
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-black/5"></div>
                <span className="flex-shrink-0 px-4 text-xs font-medium text-foreground/40 uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-black/5"></div>
              </div>

              <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full h-12 border-black/10 hover:bg-black/5 font-medium gap-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-semibold text-foreground/80">6-Digit Code</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="000000" 
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="h-12 text-center text-xl tracking-[0.5em] font-mono bg-background/50 border-black/10 focus:bg-white"
                />
              </div>
              <Button type="submit" disabled={loading || otp.length !== 6} className="w-full h-12 btn-bold bg-primary text-white hover:bg-primary/90 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign In"}
              </Button>
              <button 
                type="button" 
                onClick={() => setStep('email')} 
                className="w-full text-center text-sm text-foreground/50 hover:text-foreground font-medium pt-2 transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Left Column - Motivation */}
      <div className="hidden lg:flex lg:w-[70%] relative bg-gradient-to-br from-primary via-rose-500 to-orange-500 overflow-hidden items-center justify-center p-16 xl:p-24">
        <button 
          onClick={() => setLocation('/')} 
          className="absolute top-8 left-8 sm:top-12 sm:left-12 flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors group z-20"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </button>
        {/* Abstract background blobs (Optimized with lightweight radial gradients instead of GPU-heavy backdrop blur) */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] -translate-y-1/2 translate-x-1/3 opacity-40" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/3 -translate-x-1/3 opacity-30" style={{ background: 'radial-gradient(circle, rgba(255,220,100,0.4) 0%, transparent 70%)' }} />
        
        <div className="relative z-10 max-w-2xl">
          <div className="w-16 h-1 bg-white/60 mb-8 rounded-full shadow-sm" />
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-8">
            "Design is not just what it looks like and feels like. Design is how it works."
          </h2>
          <p className="text-xl xl:text-2xl font-light text-white/50 mb-12">
            — Steve Jobs
          </p>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Welcome to your Portal</h3>
            <p className="text-white/60 leading-relaxed text-sm">
              Access premium mock tests designed exclusively for NID and CEED aspirants. Track your progress, review past attempts, and perfect your exam strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
