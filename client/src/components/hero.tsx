import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import studentImg from "@/assets/images/student-hero.jpg";
import abstractImg from "@/assets/images/abstract-art.jpg";

export function Hero() {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Not a coaching factory. A serious mentoring ecosystem.
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
              Get <span className="text-primary relative inline-block">
                mentored
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent opacity-70" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              </span>,<br />
              not coached, for your dream design college.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
              Designforge is a design aspirant-led community mentored by NIDans, IITians, and working designers. We help students prepare for NID DAT, UCEED, CEED, portfolios, and interviews through clarity, critique, and community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full px-8 h-14 text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                Join WhatsApp Community
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base border-border hover:bg-secondary/50">
                Join Focus Batch Waitlist
              </Button>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground font-medium">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">A</div>
                <div className="w-10 h-10 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">S</div>
                <div className="w-10 h-10 rounded-full border-2 border-background bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">R</div>
                <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold">+1k</div>
              </div>
              <p>Join 1000+ serious design aspirants</p>
            </div>
          </div>
          
          <div className="relative">
            {/* Abstract composition reminiscent of the reference image */}
            <div className="relative w-full aspect-square md:aspect-[4/3] max-w-[600px] mx-auto">
              
              {/* Main image container */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[80%] rounded-[2rem] overflow-hidden shadow-2xl z-20 border-8 border-background">
                <img src={studentImg} alt="Design student" className="w-full h-full object-cover" />
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-[10%] left-[5%] w-[30%] aspect-square rounded-[2rem] bg-accent p-6 text-white z-10 rotate-[-5deg] shadow-xl flex flex-col justify-between">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">Live<br/>Critiques</p>
                  <p className="text-white/70 text-xs mt-1">Every weekend</p>
                </div>
              </div>
              
              <div className="absolute bottom-[15%] right-[5%] w-[35%] aspect-[4/3] rounded-[1.5rem] overflow-hidden z-30 shadow-xl border-4 border-background rotate-[3deg]">
                <img src={abstractImg} alt="Abstract 3D Art" className="w-full h-full object-cover" />
              </div>
              
              <div className="absolute top-[20%] right-[10%] w-[25%] aspect-square rounded-full bg-primary z-0 shadow-lg" />
              
              <div className="absolute bottom-[5%] left-[15%] bg-white rounded-2xl p-4 shadow-xl z-40 border border-border/50 max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs font-bold text-foreground">New Topic</p>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Portfolio structuring for NID MDes</p>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
