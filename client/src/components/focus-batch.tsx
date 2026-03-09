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
    <section ref={sectionRef} className="py-24 bg-white relative border-b-2 border-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="heading-content text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block bg-primary text-white font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full mb-6 border-2 border-foreground">
            Premium Mentorship
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-6 text-foreground">
            The yearly <span className="text-pop-2">Focus Batch</span> for serious aspirants
          </h2>
          <p className="text-foreground/80 font-medium text-xl">
            For students who want long-term structure, deeper critique, consistent preparation, and a more serious environment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left structured plan area */}
          <div className="plan-card struct-card p-10 bg-pop-2/10">
             <h3 className="font-heading font-black text-2xl mb-8 text-foreground flex items-center justify-between border-b-2 border-foreground/20 pb-4">
                Structured Prep Plan
                <span className="text-xs bg-foreground text-white px-3 py-1.5 rounded-full font-sans font-bold tracking-widest uppercase">Limited Seats</span>
             </h3>
             <ul className="space-y-8 text-foreground">
                <li className="flex gap-5 items-start">
                   <div className="w-10 h-10 rounded-xl bg-pop-1 border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center text-lg font-black text-foreground shrink-0">1</div>
                   <div>
                     <p className="font-black text-xl mb-1">Observe & Analyze</p>
                     <p className="text-sm font-medium opacity-80">Move beyond copying templates to understanding core design principles.</p>
                   </div>
                </li>
                <li className="flex gap-5 items-start">
                   <div className="w-10 h-10 rounded-xl bg-pop-3 border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center text-lg font-black text-foreground shrink-0">2</div>
                   <div>
                     <p className="font-black text-xl mb-1">Active Critique</p>
                     <p className="text-sm font-medium opacity-80">Regular feedback loops with mentors to refine your problem-solving approach.</p>
                   </div>
                </li>
                <li className="flex gap-5 items-start">
                   <div className="w-10 h-10 rounded-xl bg-primary border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center text-lg font-black text-white shrink-0">3</div>
                   <div>
                     <p className="font-black text-xl mb-1">Iterative Refinement</p>
                     <p className="text-sm font-medium opacity-80">Build a robust portfolio and exam readiness through continuous improvement.</p>
                   </div>
                </li>
             </ul>
          </div>

          {/* Right form area */}
          <div className="form-card struct-card p-10 bg-white">
            <h3 className="font-heading font-black text-2xl mb-8 text-foreground border-b-2 border-foreground/20 pb-4">Join the Waitlist</h3>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-foreground uppercase tracking-widest font-black">Your Name</Label>
                <Input id="name" placeholder="E.g. Siddharth" className="h-14 border-2 border-foreground focus-visible:ring-pop-1 rounded-xl bg-muted/50 font-medium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs text-foreground uppercase tracking-widest font-black">Phone / WhatsApp</Label>
                <Input id="phone" placeholder="+91 98765 43210" className="h-14 border-2 border-foreground focus-visible:ring-pop-1 rounded-xl bg-muted/50 font-medium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-xs text-foreground uppercase tracking-widest font-black">Preparation Goal</Label>
                <Input id="goal" placeholder="e.g. NID MDes" className="h-14 border-2 border-foreground focus-visible:ring-pop-1 rounded-xl bg-muted/50 font-medium" />
              </div>
              
              <Button className="w-full btn-bold btn-primary-pop uppercase tracking-wider text-sm font-black h-14 mt-4 rounded-xl">
                Submit Interest
              </Button>
            </form>
          </div>

        </div>
        
      </div>
    </section>
  );
}
