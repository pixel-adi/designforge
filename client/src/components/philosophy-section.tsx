import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const textElements = sectionRef.current?.querySelectorAll('.anim-text');
      const box = sectionRef.current?.querySelector('.phil-box');
      
      gsap.fromTo(textElements,
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          stagger: 0.15,
          scrollTrigger: {
            trigger: box,
            start: "top 80%",
          }
        }
      );
      
      gsap.fromTo(box,
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          }
        }
      );
      
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative border-b-2 border-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center relative z-10">
        
        <div className="phil-box struct-card bg-foreground text-white p-12 md:p-20 relative overflow-hidden">
          
          {/* Abstract decor inside the box */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-pop-2 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pop-1 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="anim-text inline-block bg-pop-3 text-foreground font-black uppercase tracking-widest text-xs px-4 py-1.5 rounded-full mb-8 border-2 border-foreground">
              Our Philosophy
            </div>
            
            <h2 className="anim-text text-4xl md:text-6xl font-heading font-black mb-10 leading-tight">
              Build the designer, <br className="hidden md:block" /> not just the applicant.
            </h2>
            
            <div className="space-y-6 text-xl text-white/90 font-medium leading-relaxed max-w-3xl mx-auto">
              <p className="anim-text">
                A strong design aspirant is not someone who only knows how to answer exam questions. A strong design aspirant notices more, thinks deeper, questions better, and expresses ideas more clearly.
              </p>
              <p className="anim-text">
                At Designforge, we help students build the foundations that matter across exams, interviews, portfolios, and life as a designer.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
