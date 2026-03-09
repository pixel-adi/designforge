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
          { y: 50, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.6, 
            ease: "back.out(1.5)",
            scrollTrigger: {
              trigger: box,
              start: "top 85%",
            }
          }
        );
        
        // Add subtle hover wiggle using vanilla JS event listeners in React
        const handleEnter = () => gsap.to(box, { y: -5, rotation: i%2===0?1:-1, duration: 0.3 });
        const handleLeave = () => gsap.to(box, { y: 0, rotation: 0, duration: 0.3 });
        
        box.addEventListener('mouseenter', handleEnter);
        box.addEventListener('mouseleave', handleLeave);
        
        // Cleanup listeners
        return () => {
          box.removeEventListener('mouseenter', handleEnter);
          box.removeEventListener('mouseleave', handleLeave);
        };
      });
      
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-primary font-medium mb-4 text-xs uppercase tracking-widest">The Problem</p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground leading-tight">
            The hardest part of design preparation is often not effort — it's direction.
          </h2>
          <p className="desc-text text-lg text-muted-foreground font-light">
            Many aspirants are willing to work hard, but they are stuck between too many resources, too little feedback, and no clear sense of what actually improves their chances.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="pain-box bg-white p-8 rounded-2xl border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center text-center transition-all hover:bg-muted/30">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <Map strokeWidth={1.5} className="w-8 h-8 text-secondary" />
            </div>
            <p className="font-heading font-bold text-lg text-foreground">Trapped in templates</p>
            <p className="text-sm text-muted-foreground mt-2 font-light">Following expected answers instead of original thought.</p>
          </div>

          <div className="pain-box bg-white p-8 rounded-2xl border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center text-center transition-all hover:bg-muted/30">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-6">
              <EyeOff strokeWidth={1.5} className="w-8 h-8 text-primary" />
            </div>
            <p className="font-heading font-bold text-lg text-foreground">Practicing blind</p>
            <p className="text-sm text-muted-foreground mt-2 font-light">Working hard alone without meaningful critique.</p>
          </div>

          <div className="pain-box bg-white p-8 rounded-2xl border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center text-center transition-all hover:bg-muted/30">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <XCircle strokeWidth={1.5} className="w-8 h-8 text-secondary" />
            </div>
            <p className="font-heading font-bold text-lg text-foreground">Information overload</p>
            <p className="text-sm text-muted-foreground mt-2 font-light">Too many resources but no clear path forward.</p>
          </div>

          <div className="pain-box bg-white p-8 rounded-2xl border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center text-center transition-all hover:bg-muted/30">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <Frown strokeWidth={1.5} className="w-8 h-8 text-secondary" />
            </div>
            <p className="font-heading font-bold text-lg text-foreground">Interview anxiety</p>
            <p className="text-sm text-muted-foreground mt-2 font-light">Reaching the final rounds but lacking presentation confidence.</p>
          </div>

        </div>

        <div className="mt-20 text-center flex justify-center">
          <div className="inline-block px-8 py-3 bg-secondary text-white font-heading font-bold rounded-full transform -rotate-2 hover:rotate-0 transition-transform cursor-default shadow-lg">
             Designforge exists to change that.
          </div>
        </div>
        
      </div>
    </section>
  );
}
