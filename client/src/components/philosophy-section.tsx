import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      const paragraphs = textRef.current?.querySelectorAll('p');
      
      if (paragraphs && paragraphs.length > 0) {
        gsap.fromTo(paragraphs, 
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: textRef.current,
              start: "top 85%",
            }
          }
        );
      }

      // Box scale effect
      gsap.fromTo(".phil-bg",
        { scale: 0.9, borderRadius: "4rem" },
        { 
          scale: 1, 
          borderRadius: "2rem",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "center center",
            scrub: true
          }
        }
      );
      
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-white relative px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl relative z-10">
        
        <div className="phil-bg bg-[#111111] text-background p-12 md:p-24 relative overflow-hidden flex flex-col items-center text-center">
          
          {/* Abstract glowing orbs using zero-cost radial gradients instead of massive GPU blurs */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,57,53,0.15) 0%, rgba(229,57,53,0) 70%)' }}></div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(235,171,44,0.08) 0%, rgba(235,171,44,0) 70%)' }}></div>

          <div className="relative z-10 max-w-4xl">
            <p className="text-primary font-medium tracking-widest uppercase mb-10">Our Philosophy</p>
            
            <h2 className="md:text-6xl lg:text-[5rem] font-heading mb-16 tracking-tight text-background text-[64px] font-light">
              Build the designer, <br className="hidden md:block" /> not just the applicant.
            </h2>
            
            <div ref={textRef} className="text-2xl md:text-4xl font-light leading-relaxed text-background/90 space-y-8">
              <p className="text-[24px] text-center">A strong design aspirant is not someone who only knows how to answer exam questions.</p>
              <p className="text-background/70 text-[24px]">A strong design aspirant notices more, thinks deeper, questions better, and expresses ideas more clearly.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
