import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, LayoutDashboard, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function PortalTestEngine() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading the test engine
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-6" />
        <h2 className="text-xl font-semibold text-[#262626] animate-pulse">Initializing Test Environment...</h2>
        <p className="text-foreground/50 mt-2">Loading secure engine and sectional timers</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/portal/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 w-px bg-black/10 mx-2" />
          <h1 className="font-bold text-[#262626]">NID B.Des Mock Test - Phase 3 Preview</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold font-mono border border-orange-200">
            <Clock className="w-4 h-4" />
            02:59:45
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 btn-bold">
            Submit Test
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex p-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Side: Question Area */}
        <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm p-10 flex flex-col items-center justify-center text-center">
          <LayoutDashboard className="w-16 h-16 text-primary/20 mb-6" />
          <h2 className="text-3xl font-bold text-[#262626] mb-4">Phase 3: Test Engine Coming Soon</h2>
          <p className="text-lg text-foreground/60 max-w-xl mx-auto mb-8 leading-relaxed">
            This is the placeholder for the live testing interface. In the next phase, this area will feature the active question, media viewing, and the dynamic option selection logic for MCQ, MSQ, and NAT formats.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-left max-w-lg w-full">
            <h3 className="font-semibold text-primary flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" /> Engine Features to be Built:
            </h3>
            <ul className="space-y-2 text-sm text-[#262626] list-disc list-inside">
              <li>Zustand State Management for instantaneous question switching</li>
              <li>Secure server-synced countdown timer (preventing local hacks)</li>
              <li>Sectional locking (Part B unlocks only when Part A ends)</li>
              <li>Part B subjective sketch file upload integration</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Navigation Palette */}
        <div className="w-80 bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-[#262626] mb-4">Question Palette</h3>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Dummy Palette Map */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => {
              let stateClass = "border border-black/10 text-foreground/70 hover:bg-black/5"; // Unseen
              if (num === 1) stateClass = "bg-primary text-white font-bold ring-2 ring-primary/30 ring-offset-2"; // Active
              if (num === 2 || num === 5) stateClass = "bg-green-100 text-green-700 border-green-200 font-bold"; // Answered
              if (num === 3) stateClass = "bg-red-50 text-red-600 border-red-200"; // Skipped
              if (num === 4) stateClass = "bg-purple-100 text-purple-700 border-purple-200"; // Marked for Review
              
              return (
                <button key={num} className={`h-12 rounded-lg flex items-center justify-center text-sm transition-all ${stateClass}`}>
                  {num}
                </button>
              );
            })}
          </div>
          
          <div className="mt-auto space-y-3 pt-6 border-t border-black/5">
            <div className="flex items-center gap-3 text-xs text-foreground/70"><div className="w-3 h-3 rounded bg-green-100 border border-green-200" /> Answered</div>
            <div className="flex items-center gap-3 text-xs text-foreground/70"><div className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Skipped</div>
            <div className="flex items-center gap-3 text-xs text-foreground/70"><div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" /> Marked for Review</div>
            <div className="flex items-center gap-3 text-xs text-foreground/70"><div className="w-3 h-3 rounded border border-black/10" /> Not Visited</div>
          </div>
        </div>
      </div>
    </div>
  );
}
