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
    <section ref={sectionRef} className="py-24 bg-[#FAFAFA] border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="heading-content text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
            Meet the founders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Together with NIDans, IITians, and designers from the community, they are shaping Designforge into a serious mentoring ecosystem for design growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="founder-card struct-card bg-white p-8 md:p-10 text-center hover:border-primary/50 transition-colors">
            <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-6 border border-border"></div>
            
            <h3 className="text-xl font-heading font-bold text-foreground mb-1">Aditya Sharma</h3>
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-4">Principal UX Architect</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mentor and design community builder focused on helping aspirants and young designers grow through thoughtful critique, structured guidance, and deeper design understanding.
            </p>
          </div>

          <div className="founder-card struct-card bg-white p-8 md:p-10 text-center hover:border-primary/50 transition-colors">
            <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-6 border border-border"></div>
            
            <h3 className="text-xl font-heading font-bold text-foreground mb-1">Siddhi Patil</h3>
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-4">Mentor & Co-founder</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Focused on helping students build clarity, confidence, creative growth, and a healthier preparation process rooted in empathy and consistency.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
