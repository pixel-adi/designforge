import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const textElements = sectionRef.current?.querySelectorAll('.anim-text');
      const doodles = sectionRef.current?.querySelectorAll('.phil-doodle');
      
      gsap.fromTo(textElements,
        { y: 40, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1, 
          stagger: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          }
        }
      );

      doodles?.forEach((doodle, i) => {
        gsap.to(doodle, {
          rotation: i % 2 === 0 ? 10 : -10,
          scale: 1.1,
          duration: 3 + i,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });
      
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-secondary text-white relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Doodles */}
      <svg className="phil-doodle absolute top-20 left-[15%] w-24 h-24 stroke-primary opacity-50" viewBox="0 0 100 100" fill="none" strokeWidth="2">
         <path d="M50 10 C 20 10, 20 50, 50 50 C 80 50, 80 90, 50 90" />
         <circle cx="50" cy="10" r="3" fill="currentColor"/>
         <circle cx="50" cy="90" r="3" fill="currentColor"/>
      </svg>

      <svg className="phil-doodle absolute bottom-20 right-[15%] w-32 h-32 stroke-accent opacity-30" viewBox="0 0 100 100" fill="none" strokeWidth="2">
         <rect x="20" y="20" width="60" height="60" rx="4" transform="rotate(15 50 50)" />
         <rect x="20" y="20" width="60" height="60" rx="4" transform="rotate(-5 50 50)" />
      </svg>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10">
        
        <p className="anim-text text-primary font-bold mb-6 text-sm uppercase tracking-widest bg-white/10 inline-block px-4 py-1 rounded-full border border-white/20">Our Philosophy</p>
        
        <h2 className="anim-text text-4xl md:text-6xl font-heading font-bold mb-12 leading-tight">
          Build the designer, <br className="hidden md:block" /> not just the applicant.
        </h2>
        
        <div className="space-y-8 text-lg md:text-xl text-white/80 font-light leading-relaxed">
          <p className="anim-text max-w-3xl mx-auto">
            A strong design aspirant is not someone who only knows how to answer exam questions. A strong design aspirant notices more, thinks deeper, questions better, and expresses ideas more clearly.
          </p>
          <p className="anim-text max-w-3xl mx-auto">
            At Designforge, we help students build the foundations that matter across exams, interviews, portfolios, and life as a designer — <span className="text-white font-bold underline decoration-primary underline-offset-4">observation, critical thinking, originality, communication, and confidence.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
