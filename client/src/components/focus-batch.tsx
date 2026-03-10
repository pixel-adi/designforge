import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import gsap from 'gsap';

export function FocusBatch() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        }
      });

      tl.fromTo(".focus-content", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1 })
        .fromTo(".focus-list > div", { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, stagger: 0.15 }, "-=0.5")
        .fromTo(".focus-form", { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.8");

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-primary/5 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        <div className="focus-content text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Premium Mentorship
          </div>
          <h2 className="text-5xl md:text-6xl font-heading mb-6 text-foreground tracking-tight">
            The yearly <span className="text-primary italic">Focus Batch</span>
          </h2>
          <p className="text-foreground/60 font-light text-xl leading-relaxed">
            For serious aspirants who want long-term structure, deeper critique, and a dedicated environment to transform their approach.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <div className="focus-list space-y-10">
             <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-pop-1/20 flex items-center justify-center shrink-0">
                  <span className="text-pop-1 font-heading text-2xl">01</span>
                </div>
                <div>
                  <h3 className="text-2xl font-heading text-foreground mb-3">Observe & Analyze</h3>
                  <p className="text-foreground/60 text-lg font-light leading-relaxed">Move beyond copying templates to understanding core design principles from scratch.</p>
                </div>
             </div>
             
             <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-pop-3/20 flex items-center justify-center shrink-0">
                  <span className="text-pop-3 font-heading text-2xl">02</span>
                </div>
                <div>
                  <h3 className="text-2xl font-heading text-foreground mb-3">Active Critique</h3>
                  <p className="text-foreground/60 text-lg font-light leading-relaxed">Regular, unfiltered feedback loops with mentors to refine your problem-solving approach.</p>
                </div>
             </div>
             
             <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-heading text-2xl">03</span>
                </div>
                <div>
                  <h3 className="text-2xl font-heading text-foreground mb-3">Iterative Refinement</h3>
                  <p className="text-foreground/60 text-lg font-light leading-relaxed">Build a robust portfolio and unshakeable exam readiness through continuous iteration.</p>
                </div>
             </div>
          </div>

          <div className="focus-form struct-card p-10 md:p-12 bg-white/80 backdrop-blur-xl border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]">
            <h3 className="font-heading text-3xl mb-8 text-foreground">Join the Waitlist</h3>
            <form className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm text-foreground/60 uppercase tracking-widest font-medium">Your Name</label>
                <Input placeholder="E.g. Siddharth" className="h-14 rounded-2xl bg-black/[0.02] border-transparent focus-visible:bg-white focus-visible:border-primary focus-visible:ring-primary shadow-inner text-base px-5" />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-foreground/60 uppercase tracking-widest font-medium">WhatsApp Number</label>
                <Input placeholder="+91 98765 43210" className="h-14 rounded-2xl bg-black/[0.02] border-transparent focus-visible:bg-white focus-visible:border-primary focus-visible:ring-primary shadow-inner text-base px-5" />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-foreground/60 uppercase tracking-widest font-medium">Goal</label>
                <Input placeholder="e.g. NID MDes" className="h-14 rounded-2xl bg-black/[0.02] border-transparent focus-visible:bg-white focus-visible:border-primary focus-visible:ring-primary shadow-inner text-base px-5" />
              </div>
              
              <Button className="w-full btn-bold btn-primary-pop h-16 mt-6 rounded-full text-base">
                Submit Interest
              </Button>
            </form>
          </div>

        </div>
        
      </div>
    </section>
  );
}
