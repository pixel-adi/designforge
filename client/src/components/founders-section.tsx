import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function FoundersSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      const cards = gsap.utils.toArray('.founder-card');
      
      gsap.fromTo(".founder-title",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: sectionRef.current, start: "top 85%" } }
      );

      cards.forEach((card: any, i) => {
        gsap.fromTo(card,
          { y: 30, opacity: 0, scale: 0.98 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            duration: 0.6, 
            ease: "power2.out",
            delay: i * 0.1,
            scrollTrigger: { trigger: sectionRef.current?.querySelector('.grid'), start: "top 85%" } 
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-white relative overflow-hidden">
      
      {/* Background soft dots */}
      <div className="absolute inset-0 bg-grid opacity-50"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        <div className="text-center mb-24">
          <h2 className="founder-title text-5xl md:text-6xl font-heading mb-6 text-foreground tracking-tight">
            Meet the founders
          </h2>
          <p className="founder-title text-xl font-light text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Together with NIDans, IITians, and designers from the community, shaping Designforge into a serious mentoring ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          <div className="founder-card struct-card p-12 flex flex-col items-center text-center bg-gradient-to-br from-white to-pop-1/5 group">
            <div className="w-40 h-40 rounded-full mx-auto mb-8 relative mb-8">
               <div className="absolute inset-0 bg-pop-1/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 scale-150 opacity-0 group-hover:opacity-100"></div>
               <div className="w-full h-full bg-white rounded-full border border-black/5 shadow-md flex items-center justify-center relative z-10 overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  <div className="w-24 h-24 bg-pop-1/10 rounded-full flex items-center justify-center">
                    <span className="text-pop-1 font-heading text-3xl">AS</span>
                  </div>
               </div>
            </div>
            
            <h3 className="text-3xl font-heading text-foreground mb-3">Aditya Sharma</h3>
            <p className="text-primary text-sm uppercase tracking-widest font-medium mb-8">Principal UX Architect</p>
            <p className="text-lg font-light text-foreground/70 leading-relaxed max-w-sm">
              Mentor and design community builder focused on helping aspirants grow through thoughtful critique and structured guidance.
            </p>
          </div>

          <div className="founder-card struct-card p-12 flex flex-col items-center text-center bg-gradient-to-br from-white to-pop-2/5 group">
            <div className="w-40 h-40 rounded-full mx-auto mb-8 relative mb-8">
               <div className="absolute inset-0 bg-pop-2/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 scale-150 opacity-0 group-hover:opacity-100"></div>
               <div className="w-full h-full bg-white rounded-full border border-black/5 shadow-md flex items-center justify-center relative z-10 overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  <div className="w-24 h-24 bg-pop-2/10 rounded-full flex items-center justify-center">
                    <span className="text-pop-2 font-heading text-3xl">SP</span>
                  </div>
               </div>
            </div>
            
            <h3 className="text-3xl font-heading text-foreground mb-3">Siddhi Patil</h3>
            <p className="text-primary text-sm uppercase tracking-widest font-medium mb-8">Mentor & Co-founder</p>
            <p className="text-lg font-light text-foreground/70 leading-relaxed max-w-sm">
              Focused on helping students build clarity, confidence, creative growth, and a healthier preparation process.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
