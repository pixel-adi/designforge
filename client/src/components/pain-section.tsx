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
            ease: "back.out(1.2)",
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
    <section ref={sectionRef} className="py-24 relative bg-white border-b-2 border-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-block bg-foreground text-white font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full mb-6">
            The Problem
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-6 text-foreground leading-tight">
            The hardest part of design preparation is <span className="text-primary">direction.</span>
          </h2>
          <p className="desc-text text-xl text-muted-foreground font-medium max-w-3xl mx-auto">
            Aspirants are willing to work hard, but they get stuck between too many resources, zero feedback, and no clear path to improving their chances.
          </p>
        </div>

        {/* High Contrast Grid Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="pain-box struct-card p-8 flex flex-col bg-pop-3/20 struct-card-hover">
            <div className="w-14 h-14 rounded-xl bg-white border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center mb-6">
              <Map className="w-7 h-7 text-foreground" strokeWidth={2.5} />
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-3">Trapped in templates</h3>
            <p className="text-base text-foreground/80 leading-relaxed font-medium">Following expected answers instead of cultivating original thought and reasoning.</p>
          </div>

          <div className="pain-box struct-card p-8 flex flex-col bg-pop-1/20 struct-card-hover">
            <div className="w-14 h-14 rounded-xl bg-white border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center mb-6">
              <EyeOff className="w-7 h-7 text-foreground" strokeWidth={2.5} />
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-3">Practicing blind</h3>
            <p className="text-base text-foreground/80 leading-relaxed font-medium">Working hard alone without meaningful critique or professional feedback loops.</p>
          </div>

          <div className="pain-box struct-card p-8 flex flex-col bg-pop-2/20 struct-card-hover">
            <div className="w-14 h-14 rounded-xl bg-white border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center mb-6">
              <XCircle className="w-7 h-7 text-foreground" strokeWidth={2.5} />
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-3">Information overload</h3>
            <p className="text-base text-foreground/80 leading-relaxed font-medium">Too many resources but no clear, structured path forward for consistent growth.</p>
          </div>

          <div className="pain-box struct-card p-8 flex flex-col bg-primary/20 struct-card-hover">
            <div className="w-14 h-14 rounded-xl bg-white border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center mb-6">
              <Frown className="w-7 h-7 text-foreground" strokeWidth={2.5} />
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-3">Interview anxiety</h3>
            <p className="text-base text-foreground/80 leading-relaxed font-medium">Reaching the final rounds but lacking presentation confidence and articulation.</p>
          </div>

        </div>

        <div className="mt-20 text-center">
          <div className="inline-block px-8 py-4 bg-foreground text-pop-3 font-heading font-black text-xl rounded-xl shadow-[4px_4px_0_0_rgba(240,180,41,1)] transform -rotate-1 hover:rotate-0 transition-transform cursor-default border-2 border-foreground">
             Designforge exists to change that.
          </div>
        </div>
        
      </div>
    </section>
  );
}
