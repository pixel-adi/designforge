import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const stats = sectionRef.current?.querySelectorAll('.stat-item');
      
      gsap.fromTo(stats,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-secondary text-white py-16 relative overflow-hidden">
      {/* Subtle doodle dots inside the dark banner */}
      <div className="absolute inset-0 opacity-10">
         <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="lightDots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
               <circle cx="10" cy="10" r="1.5" fill="currentColor" />
               <circle cx="40" cy="40" r="1" fill="currentColor" />
               <path d="M 50 10 L 53 13" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#lightDots)" />
         </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x divide-white/10">
          
          <div className="stat-item px-4 flex flex-col items-center justify-center">
            <p className="text-4xl md:text-5xl font-heading font-bold mb-2">1000+</p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Community Members</p>
          </div>
          
          <div className="stat-item px-4 flex flex-col items-center justify-center">
            <p className="text-white/60 text-xs uppercase tracking-widest font-medium mb-1">Over</p>
            <p className="text-4xl md:text-5xl font-heading font-bold mb-2">350</p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Live Sessions</p>
          </div>
          
          <div className="stat-item px-4 flex flex-col items-center justify-center">
            <p className="text-4xl md:text-5xl font-heading font-bold mb-2">500+</p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Portfolios Reviewed</p>
          </div>
          
          <div className="stat-item px-4 flex flex-col items-center justify-center">
            <p className="text-white/60 text-xs uppercase tracking-widest font-medium mb-1">Always</p>
            <p className="text-4xl md:text-5xl font-heading font-bold mb-2">100%</p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Mentorship Led</p>
          </div>
          
        </div>
      </div>
    </section>
  );
}
