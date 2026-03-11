import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const stats = sectionRef.current?.querySelectorAll('.stat-item');
      
      if (!stats) return;
      
      gsap.fromTo(stats,
        { scale: 0.95, opacity: 0, y: 15 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#111111] text-background py-20 relative overflow-hidden border-b-2 border-foreground">
      {/* Structured subtle grid in the background */}
      <div className="absolute inset-0 bg-grid-white opacity-20"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center max-w-6xl mx-auto">
          
          <div className="stat-item bg-white/5 border-2 border-white/20 p-8 rounded-2xl flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]">
            <p className="text-4xl md:text-5xl font-heading font-black mb-2 text-pop-3">1000+</p>
            <p className="text-background/90 text-sm uppercase tracking-widest font-bold">Community</p>
          </div>
          
          <div className="stat-item bg-white/5 border-2 border-white/20 p-8 rounded-2xl flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]">
            <p className="text-4xl md:text-5xl font-heading font-black mb-2 text-pop-1">350+</p>
            <p className="text-background/90 text-sm uppercase tracking-widest font-bold">Live Sessions</p>
          </div>
          
          <div className="stat-item bg-white/5 border-2 border-white/20 p-8 rounded-2xl flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]">
            <p className="text-4xl md:text-5xl font-heading font-black mb-2 text-primary">500+</p>
            <p className="text-background/90 text-sm uppercase tracking-widest font-bold">Portfolios</p>
          </div>
          
          <div className="stat-item bg-white/5 border-2 border-white/20 p-8 rounded-2xl flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]">
            <p className="text-4xl md:text-5xl font-heading font-black mb-2 text-pop-2">100%</p>
            <p className="text-background/90 text-sm uppercase tracking-widest font-bold">Mentorship</p>
          </div>
          
        </div>
      </div>
    </section>
  );
}
