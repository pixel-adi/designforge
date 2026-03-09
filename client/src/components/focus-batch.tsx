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
      const doodle = sectionRef.current?.querySelector('.doodle-container');
      const form = sectionRef.current?.querySelector('.form-container');
      const doodleCharacter = sectionRef.current?.querySelector('.doodle-character');
      
      gsap.fromTo(heading,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, scrollTrigger: { trigger: sectionRef.current, start: "top 75%" } }
      );

      gsap.fromTo(doodle,
        { x: -50, opacity: 0, rotation: -5 },
        { x: 0, opacity: 1, rotation: 0, duration: 0.8, ease: "back.out(1.5)", scrollTrigger: { trigger: doodle, start: "top 80%" } }
      );

      gsap.fromTo(form,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: form, start: "top 80%" } }
      );

      // Idle animation for the character
      gsap.to(doodleCharacter, {
        y: -10,
        rotation: 2,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-background relative border-y border-border/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="heading-content text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-foreground">
            The yearly Focus Batch for serious aspirants
          </h2>
          <p className="text-muted-foreground text-lg">
            For students who want long-term structure, deeper critique, consistent preparation, and a more serious environment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Left doodle area */}
          <div className="doodle-container flex justify-center relative">
             <div className="w-[320px] h-[280px] border-2 border-foreground rounded-2xl bg-[#faf9f6] relative p-8 shadow-[8px_8px_0_0_rgba(232,156,94,0.3)]">
                {/* Mock whiteboard drawing */}
                <p className="font-heading font-bold text-2xl mb-6 text-secondary flex items-center gap-2">
                  Prep Plan 
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                </p>
                <ul className="space-y-4 font-heading text-lg text-foreground/80">
                   <li className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">1</span> 
                      Observe <span className="line-through opacity-50 ml-2 text-sm">Copy</span>
                   </li>
                   <li className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span> 
                      Critique
                   </li>
                   <li className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">3</span> 
                      Refine
                   </li>
                </ul>

                {/* Drawn character */}
                <div className="doodle-character absolute -bottom-8 -right-8 w-32 h-40">
                  <svg viewBox="0 0 100 120" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full stroke-foreground">
                     {/* Head */}
                     <circle cx="50" cy="25" r="16" fill="white" />
                     {/* Glasses */}
                     <path d="M 40 22 L 48 22 M 52 22 L 60 22" />
                     <circle cx="44" cy="22" r="4" />
                     <circle cx="56" cy="22" r="4" />
                     {/* Smile */}
                     <path d="M 46 30 Q 50 34 54 30" />
                     {/* Body */}
                     <path d="M50 41 L50 85" />
                     {/* Arms */}
                     <path d="M50 50 L20 35 L10 45" />
                     <path d="M50 50 L80 65 L75 80" />
                     {/* Legs */}
                     <path d="M50 85 L30 120" />
                     <path d="M50 85 L70 120" />
                     {/* Pencil */}
                     <path d="M5 40 L15 50 L12 53 L2 43 Z" fill="currentColor"/>
                  </svg>
                </div>
             </div>
          </div>

          {/* Right form area */}
          <div className="form-container bg-white p-8 rounded-2xl border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-w-md w-full mx-auto relative overflow-hidden">
            {/* Decorative abstract shape inside form */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent rounded-full blur-2xl opacity-50 z-0"></div>
            
            <div className="relative z-10">
              <h3 className="font-heading font-bold text-2xl mb-6 text-foreground">Join the Waitlist</h3>
              <form className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Your Name</Label>
                  <Input id="name" placeholder="E.g. Siddharth" className="h-12 border-2 border-border focus-visible:border-primary focus-visible:ring-0 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone / WhatsApp</Label>
                  <Input id="phone" placeholder="+91 98765 43210" className="h-12 border-2 border-border focus-visible:border-primary focus-visible:ring-0 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Preparation Goal</Label>
                  <Input id="goal" placeholder="e.g. NID MDes" className="h-12 border-2 border-border focus-visible:border-primary focus-visible:ring-0 rounded-xl" />
                </div>
                
                <Button className="w-full btn-orange text-white uppercase tracking-wider text-sm font-bold h-14 mt-4 rounded-xl shadow-[0_4px_14px_0_rgba(232,156,94,0.39)] hover:shadow-[0_6px_20px_rgba(232,156,94,0.23)]">
                  Submit Interest
                </Button>
              </form>
            </div>
          </div>

        </div>
        
      </div>
    </section>
  );
}
