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
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
      );

      gsap.fromTo(cards,
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current?.querySelector('.grid'), start: "top 75%" } 
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-grid bg-[#FFFDFB] border-b-2 border-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="heading-content text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-6 text-foreground">
            Meet the founders
          </h2>
          <p className="text-xl font-medium text-foreground/80 max-w-2xl mx-auto">
            Together with NIDans, IITians, and designers from the community, they are shaping Designforge into a serious mentoring ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          <div className="founder-card struct-card bg-pop-1/10 p-10 text-center struct-card-hover flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-full mx-auto mb-8 border-4 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative">
               <div className="absolute -top-4 -right-4 w-10 h-10 bg-pop-3 rounded-full border-2 border-foreground flex items-center justify-center">
                 <span className="text-foreground font-black text-xs">UX</span>
               </div>
            </div>
            
            <h3 className="text-2xl font-heading font-black text-foreground mb-2">Aditya Sharma</h3>
            <p className="text-foreground text-xs uppercase tracking-widest font-black mb-6 bg-white px-3 py-1 rounded-full border-2 border-foreground inline-block">Principal UX Architect</p>
            <p className="text-base font-medium text-foreground/80 leading-relaxed">
              Mentor and design community builder focused on helping aspirants and young designers grow through thoughtful critique, structured guidance, and deeper design understanding.
            </p>
          </div>

          <div className="founder-card struct-card bg-pop-2/10 p-10 text-center struct-card-hover flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-full mx-auto mb-8 border-4 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative">
               <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary rounded-full border-2 border-foreground flex items-center justify-center">
                 <span className="text-white font-black text-xs">M</span>
               </div>
            </div>
            
            <h3 className="text-2xl font-heading font-black text-foreground mb-2">Siddhi Patil</h3>
            <p className="text-foreground text-xs uppercase tracking-widest font-black mb-6 bg-white px-3 py-1 rounded-full border-2 border-foreground inline-block">Mentor & Co-founder</p>
            <p className="text-base font-medium text-foreground/80 leading-relaxed">
              Focused on helping students build clarity, confidence, creative growth, and a healthier preparation process rooted in empathy and consistency.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
