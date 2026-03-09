import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function FocusBatch() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heading = sectionRef.current?.querySelector('.heading-content');
      const planCard = sectionRef.current?.querySelector('.plan-card');
      const formCard = sectionRef.current?.querySelector('.form-card');
      
      gsap.fromTo(heading,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
      );

      gsap.fromTo(planCard,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: planCard, start: "top 80%" } }
      );

      gsap.fromTo(formCard,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: formCard, start: "top 80%" } }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="heading-content text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-foreground">
            The yearly Focus Batch for serious aspirants
          </h2>
          <p className="text-muted-foreground text-lg">
            For students who want long-term structure, deeper critique, consistent preparation, and a more serious environment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left structured plan area */}
          <div className="plan-card struct-card p-8 bg-muted/20">
             <h3 className="font-heading font-bold text-2xl mb-6 text-foreground flex items-center justify-between border-b border-border pb-4">
                Structured Prep Plan
                <span className="text-xs bg-primary text-white px-2 py-1 rounded font-sans tracking-widest uppercase">Limited</span>
             </h3>
             <ul className="space-y-6 text-foreground/80">
                <li className="flex gap-4">
                   <div className="w-8 h-8 rounded bg-white border border-border flex items-center justify-center text-sm font-bold text-primary shrink-0">1</div>
                   <div>
                     <p className="font-bold text-foreground">Observe & Analyze</p>
                     <p className="text-sm text-muted-foreground mt-1">Move beyond copying templates to understanding core design principles.</p>
                   </div>
                </li>
                <li className="flex gap-4">
                   <div className="w-8 h-8 rounded bg-white border border-border flex items-center justify-center text-sm font-bold text-primary shrink-0">2</div>
                   <div>
                     <p className="font-bold text-foreground">Active Critique</p>
                     <p className="text-sm text-muted-foreground mt-1">Regular feedback loops with mentors to refine your problem-solving approach.</p>
                   </div>
                </li>
                <li className="flex gap-4">
                   <div className="w-8 h-8 rounded bg-white border border-border flex items-center justify-center text-sm font-bold text-primary shrink-0">3</div>
                   <div>
                     <p className="font-bold text-foreground">Iterative Refinement</p>
                     <p className="text-sm text-muted-foreground mt-1">Build a robust portfolio and exam readiness through continuous improvement.</p>
                   </div>
                </li>
             </ul>
          </div>

          {/* Right form area */}
          <div className="form-card struct-card p-8 bg-white border-border/80">
            <h3 className="font-heading font-bold text-xl mb-6 text-foreground border-b border-border pb-4">Join the Waitlist</h3>
            <form className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Your Name</Label>
                <Input id="name" placeholder="E.g. Siddharth" className="h-12 border-border focus-visible:ring-primary rounded-lg bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone / WhatsApp</Label>
                <Input id="phone" placeholder="+91 98765 43210" className="h-12 border-border focus-visible:ring-primary rounded-lg bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Preparation Goal</Label>
                <Input id="goal" placeholder="e.g. NID MDes" className="h-12 border-border focus-visible:ring-primary rounded-lg bg-muted/30" />
              </div>
              
              <Button className="w-full btn-orange text-white uppercase tracking-wider text-sm font-bold h-12 mt-4 rounded-lg">
                Submit Interest
              </Button>
            </form>
          </div>

        </div>
        
      </div>
    </section>
  );
}
