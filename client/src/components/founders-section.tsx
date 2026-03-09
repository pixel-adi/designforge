import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function FoundersSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heading = sectionRef.current?.querySelector('.heading-content');
      const cards = sectionRef.current?.querySelectorAll('.founder-card');
      
      gsap.fromTo(heading,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
      );

      gsap.fromTo(cards,
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current?.querySelector('.grid'), start: "top 75%" } 
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-background border-y border-border/60 relative overflow-hidden">
      {/* Background dots */}
      <div className="absolute inset-0 bg-dots opacity-50 pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        
        <div className="heading-content text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
            Meet the founders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Together with NIDans, IITians, and designers from the community, they are shaping Designforge into a serious mentoring ecosystem for design growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          
          <div className="founder-card bg-white p-8 md:p-10 rounded-[2rem] border-2 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center relative transition-transform hover:-translate-y-2 duration-300">
            {/* Doodle hat */}
            <svg className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 stroke-primary z-10" viewBox="0 0 100 100" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
               <path d="M20 70 Q 50 50 80 70 M 50 20 L 50 60 M 30 40 L 50 20 L 70 40" />
            </svg>
            
            <div className="w-32 h-32 bg-[#F0F8FA] rounded-full mx-auto mb-6 border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative overflow-hidden">
              {/* Abstract face placeholder */}
              <svg viewBox="0 0 100 100" className="w-full h-full p-4 stroke-foreground" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M 30 40 H 40 M 60 40 H 70 M 35 60 Q 50 75 65 60" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Aditya Sharma</h3>
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-6">Principal UX Architect</p>
            <p className="text-muted-foreground leading-relaxed">
              Mentor and design community builder focused on helping aspirants and young designers grow through thoughtful critique, structured guidance, and deeper design understanding.
            </p>
          </div>

          <div className="founder-card bg-white p-8 md:p-10 rounded-[2rem] border-2 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center relative transition-transform hover:-translate-y-2 duration-300">
            {/* Doodle sparkle */}
            <svg className="absolute -top-8 left-[70%] w-12 h-12 stroke-accent-foreground z-10" viewBox="0 0 100 100" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
               <path d="M50 10 L 50 90 M 10 50 L 90 50 M 20 20 L 80 80 M 20 80 L 80 20" />
            </svg>

            <div className="w-32 h-32 bg-[#FFF4ED] rounded-full mx-auto mb-6 border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative overflow-hidden">
              {/* Abstract face placeholder */}
              <svg viewBox="0 0 100 100" className="w-full h-full p-4 stroke-foreground" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M 30 40 Q 35 30 40 40 M 60 40 Q 65 30 70 40 M 40 60 Q 50 70 60 60" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Siddhi Patil</h3>
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-6">Mentor & Co-founder</p>
            <p className="text-muted-foreground leading-relaxed">
              Focused on helping students build clarity, confidence, creative growth, and a healthier preparation process rooted in empathy and consistency.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
