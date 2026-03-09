import { useEffect, useRef } from 'react';
import { Frown, Map, EyeOff, XCircle } from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function PainSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const title = sectionRef.current?.querySelector('h2');
      const desc = sectionRef.current?.querySelector('.desc-text');
      const boxes = sectionRef.current?.querySelectorAll('.pain-box');
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        }
      });
      
      tl.fromTo([title, desc], 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.2 }
      );
      
      boxes?.forEach((box, i) => {
        gsap.fromTo(box,
          { y: 40, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.6, 
            ease: "power2.out",
            scrollTrigger: {
              trigger: box,
              start: "top 85%",
            }
          }
        );
      });
      
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary font-bold mb-4 text-xs uppercase tracking-widest">The Problem</p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground leading-tight">
            The hardest part of design preparation is often not effort — it's direction.
          </h2>
          <p className="desc-text text-lg text-muted-foreground">
            Many aspirants are willing to work hard, but they are stuck between too many resources, too little feedback, and no clear sense of what actually improves their chances.
          </p>
        </div>

        {/* Structured Grid instead of loose floaters */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="pain-box struct-card p-6 flex flex-col hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-5 border border-border">
              <Map className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">Trapped in templates</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Following expected answers instead of cultivating original thought and reasoning.</p>
          </div>

          <div className="pain-box struct-card p-6 flex flex-col hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-5 border border-primary/20">
              <EyeOff className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">Practicing blind</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Working hard alone without meaningful critique or professional feedback loops.</p>
          </div>

          <div className="pain-box struct-card p-6 flex flex-col hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-5 border border-border">
              <XCircle className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">Information overload</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Too many resources but no clear, structured path forward for consistent growth.</p>
          </div>

          <div className="pain-box struct-card p-6 flex flex-col hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-5 border border-border">
              <Frown className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">Interview anxiety</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Reaching the final rounds but lacking presentation confidence and articulation.</p>
          </div>

        </div>

        <div className="mt-16 text-center">
          <div className="inline-block px-6 py-2 bg-secondary text-white font-heading font-bold rounded-lg shadow-sm">
             Designforge exists to change that.
          </div>
        </div>
        
      </div>
    </section>
  );
}
