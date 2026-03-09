import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FocusBatch() {
  return (
    <section className="py-24 bg-dots">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">
            The yearly Focus Batch for serious aspirants
          </h2>
          <p className="text-muted-foreground">
            For students who want long-term structure, deeper critique, consistent preparation, and a more serious environment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Left doodle area */}
          <div className="flex justify-center relative">
             <div className="w-[300px] h-[250px] border-2 border-foreground rounded-lg bg-white relative p-6 shadow-[8px_8px_0_0_rgba(232,156,94,0.3)]">
                {/* Mock whiteboard drawing */}
                <p className="font-serif font-bold text-xl mb-4 underline decoration-primary underline-offset-4">Prep Plan:</p>
                <ul className="space-y-3 font-serif text-lg text-foreground/80">
                   <li className="flex items-center gap-2">
                      <span className="text-primary font-bold">A.</span> Observe <span className="line-through opacity-50 ml-2">Copy</span>
                   </li>
                   <li className="flex items-center gap-2">
                      <span className="text-primary font-bold">B.</span> Critique
                   </li>
                   <li className="flex items-center gap-2">
                      <span className="text-primary font-bold">C.</span> Refine
                   </li>
                </ul>

                {/* Drawn character */}
                <svg className="absolute -bottom-6 -right-12 w-32 h-40 stroke-foreground" viewBox="0 0 100 120" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="50" cy="20" r="15" fill="white" />
                   <path d="M50 35 L50 80" />
                   <path d="M50 45 L20 30" />
                   <path d="M20 30 L5 40" />
                   <path d="M50 45 L80 60" />
                   <path d="M50 80 L30 120" />
                   <path d="M50 80 L70 120" />
                   <circle cx="5" cy="40" r="3" fill="currentColor"/>
                </svg>
             </div>
          </div>

          {/* Right form area */}
          <div className="bg-white p-8 rounded-xl border border-border/60 shadow-sm max-w-md w-full mx-auto">
            <h3 className="font-serif font-bold text-xl mb-6 text-foreground">Join the Waitlist</h3>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Your Name</Label>
                <Input id="name" placeholder="John Doe" className="h-12 border-border/80 focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone / WhatsApp</Label>
                <Input id="phone" placeholder="+91 98765 43210" className="h-12 border-border/80 focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Preparation Goal</Label>
                <Input id="goal" placeholder="e.g. NID MDes" className="h-12 border-border/80 focus-visible:ring-primary" />
              </div>
              
              <Button className="w-full btn-orange text-white uppercase tracking-wider text-xs font-bold h-12 mt-4">
                Submit Interest
              </Button>
            </form>
          </div>

        </div>
        
      </div>
    </section>
  );
}
