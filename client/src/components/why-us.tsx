import { ArrowRight, Users, Target, BookOpen, Compass } from "lucide-react";

export function WhyUs() {
  return (
    <section className="py-24 bg-[#FAF9F6]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why mentorship works better than coaching
          </h2>
          <p className="text-xl text-muted-foreground">
            Most aspirants don't lack talent. They lack the right guidance. Here is how we do it differently.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Coaching Side */}
          <div className="space-y-8 opacity-60">
            <h3 className="text-2xl font-bold text-muted-foreground border-b border-border pb-4">Standard Coaching</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1"><BookOpen className="w-6 h-6 text-muted-foreground" /></div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Fixed Formats</h4>
                  <p className="text-muted-foreground">Teaches expected answers and standard templates.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><Target className="w-6 h-6 text-muted-foreground" /></div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Syllabus Completion</h4>
                  <p className="text-muted-foreground">Focuses on finishing topics rather than deep understanding.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mentorship Side */}
          <div className="space-y-8 bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-border/50 relative">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <h3 className="text-3xl font-bold text-primary border-b border-border pb-4 relative z-10">Designforge Mentorship</h3>
            
            <div className="space-y-8 relative z-10">
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Compass className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-2 text-foreground">Original Thinking</h4>
                  <p className="text-muted-foreground text-lg leading-relaxed">We help you build your own thinking, problem framing, and originality instead of copying templates.</p>
                </div>
              </div>
              
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-2 text-foreground">Design Maturity</h4>
                  <p className="text-muted-foreground text-lg leading-relaxed">Focuses on growth, review, critique, and building an exam + interview + career direction mindset.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </section>
  );
}
