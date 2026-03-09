import { useEffect, useRef } from 'react';
import { Target, Compass, BookOpen, Lightbulb } from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function DifferenceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll('.diff-card');
      
      cards?.forEach((card, i) => {
        // Find children within each card for staggered inner animation
        const icon = card.querySelector('.icon-wrapper');
        const textElements = card.querySelectorAll('p, h3');
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 85%", // Start animation when card enters 85% of viewport
            toggleActions: "play none none reverse" // Play on enter, reverse on leave back
          }
        });
        
        // Decide start position based on odd/even for left/right slide in
        const xOffset = i % 2 === 0 ? -50 : 50;
        
        tl.fromTo(card,
          { opacity: 0, x: xOffset },
          { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }
        )
        .fromTo(icon,
          { scale: 0, rotation: -45 },
          { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.7)" },
          "-=0.4"
        )
        .fromTo(textElements,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
          "-=0.3"
        );
      });

      // Animate the connecting svg doodle
      const svgPath = sectionRef.current?.querySelector('.connector-svg path');
      if (svgPath) {
        // Simple draw-in effect using stroke-dasharray/offset
        gsap.fromTo(svgPath,
          { strokeDashoffset: 100 },
          { 
            strokeDashoffset: 0, 
            duration: 2, 
            ease: "none",
            scrollTrigger: {
              trigger: '.connector-svg',
              start: "top center",
            }
          }
        );
      }
      
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative bg-dots overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="text-center mb-24">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-foreground">
            Why Designforge is built around mentorship
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Coaching often tries to standardise performance. Mentorship helps each student discover how they think, where they struggle, and how they can grow meaningfully.
          </p>
        </div>

        {/* Scattered layout reminiscent of the image's pain points section */}
        <div className="relative min-h-[500px] w-full max-w-4xl mx-auto">
          
          <div className="md:absolute top-0 left-0 md:w-[45%] mb-8 md:mb-0 diff-card">
            <div className="flex flex-col items-center md:items-start text-center md:text-left bg-white p-6 rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] border border-border">
              <div className="icon-wrapper w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4 text-white">
                <BookOpen strokeWidth={2} className="w-6 h-6" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Coaching teaches formats</p>
              <h3 className="text-xl font-heading font-bold text-foreground">Mentorship builds judgement.</h3>
            </div>
          </div>

          <div className="md:absolute top-12 right-0 md:w-[45%] mb-8 md:mb-0 diff-card">
            <div className="flex flex-col items-center md:items-start text-center md:text-left bg-white p-6 rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] border border-border">
              <div className="icon-wrapper w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4 text-white">
                <Target strokeWidth={2} className="w-6 h-6" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Coaching pushes repetition</p>
              <h3 className="text-xl font-heading font-bold text-foreground">Mentorship sharpens observation.</h3>
            </div>
          </div>

          {/* Central doodle connecting them */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 items-center justify-center opacity-40 connector-svg">
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-primary" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 8">
               <path d="M20 20 Q 50 10 80 20" />
               <path d="M80 80 Q 50 90 20 80" />
               <path d="M20 20 Q 10 50 20 80" />
               <path d="M80 20 Q 90 50 80 80" />
            </svg>
          </div>

          <div className="md:absolute bottom-12 left-8 md:w-[45%] mb-8 md:mb-0 diff-card">
            <div className="flex flex-col items-center md:items-start text-center md:text-left bg-white p-6 rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] border border-border">
              <div className="icon-wrapper w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4 text-accent-foreground">
                <Lightbulb strokeWidth={2} className="w-6 h-6" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Expected vs Unfamiliar</p>
              <h3 className="text-xl font-heading font-bold text-foreground">We prepare you for unfamiliar challenges.</h3>
            </div>
          </div>

          <div className="md:absolute bottom-0 right-8 md:w-[45%] mb-8 md:mb-0 diff-card">
            <div className="flex flex-col items-center md:items-start text-center md:text-left bg-white p-6 rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] border border-border">
              <div className="icon-wrapper w-12 h-12 rounded-full bg-foreground flex items-center justify-center mb-4 text-white">
                <Compass strokeWidth={2} className="w-6 h-6" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Beyond the exam</p>
              <h3 className="text-xl font-heading font-bold text-foreground">Mentorship continues into design growth.</h3>
            </div>
          </div>

        </div>
        
        <div className="text-center mt-24 max-w-2xl mx-auto diff-card">
          <p className="text-2xl font-heading font-bold text-primary italic">
            "We don't want students to look prepared. We want them to become stronger thinkers and makers."
          </p>
        </div>

      </div>
    </section>
  );
}
