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
    <section ref={sectionRef} className="py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10">
        
        <div className="phil-box struct-card bg-secondary text-white p-10 md:p-16">
          <p className="anim-text text-primary font-bold mb-6 text-xs uppercase tracking-widest">Our Philosophy</p>
          
          <h2 className="anim-text text-3xl md:text-5xl font-heading font-bold mb-8 leading-tight">
            Build the designer, <br className="hidden md:block" /> not just the applicant.
          </h2>
          
          <div className="space-y-6 text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            <p className="anim-text">
              A strong design aspirant is not someone who only knows how to answer exam questions. A strong design aspirant notices more, thinks deeper, questions better, and expresses ideas more clearly.
            </p>
            <p className="anim-text">
              At Designforge, we help students build the foundations that matter across exams, interviews, portfolios, and life as a designer.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
