import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const stats = sectionRef.current?.querySelectorAll('.stat-item');
      
      gsap.fromTo(stats,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-secondary text-white py-20 relative overflow-hidden border-y border-secondary-foreground/20">
      {/* Structured subtle grid in the background */}
      <div className="absolute inset-0 bg-grid-white opacity-20"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x divide-white/20 max-w-5xl mx-auto">
          
          <div className="stat-item px-4 flex flex-col items-center justify-center">
            <p className="text-4xl md:text-5xl font-heading font-bold mb-2">1000+</p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Community</p>
          </div>
          
          <div className="stat-item px-4 flex flex-col items-center justify-center">
            <p className="text-4xl md:text-5xl font-heading font-bold mb-2">350+</p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Live Sessions</p>
          </div>
          
          <div className="stat-item px-4 flex flex-col items-center justify-center">
            <p className="text-4xl md:text-5xl font-heading font-bold mb-2">500+</p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Portfolios</p>
          </div>
          
          <div className="stat-item px-4 flex flex-col items-center justify-center">
            <p className="text-4xl md:text-5xl font-heading font-bold mb-2">100%</p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Mentorship</p>
          </div>
          
        </div>
      </div>
    </section>
  );
}
