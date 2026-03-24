import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/admin/dashboard";
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 p-8 sm:p-10">
          
          <div className="text-center mb-8">
            <img 
              src={logoImg} 
              alt="Designforge Logo" 
              className="h-8 md:h-10 object-contain mx-auto mb-6 drop-shadow-sm" 
            />
            <h1 className="text-2xl font-heading text-foreground">Admin Access</h1>
            <p className="text-sm font-medium text-foreground/50 mt-1 uppercase tracking-widest">Control Panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-foreground/60 ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@designforge.co.in"
                className="h-12 bg-background border-input focus-visible:ring-primary/20 rounded-xl px-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-foreground/60 ml-1">Security Key</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 bg-background border-input focus-visible:ring-primary/20 rounded-xl px-4 font-mono tracking-widest"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{error}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] rounded-xl text-base font-bold transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In to Dashboard"}
              </Button>
            </div>
          </form>

        </div>
        
        <div className="text-center mt-8">
          <p className="text-xs text-foreground/40 font-medium tracking-wide">
            Secure login. Authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}
