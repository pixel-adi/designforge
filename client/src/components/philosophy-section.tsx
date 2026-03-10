import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      // Text reveal animation based on scroll (scrubbing)
      const words = textRef.current?.querySelectorAll('.word');
      
      if (words) {
        gsap.fromTo(words, 
          { opacity: 0.1, y: 20 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.05,
            ease: "none",
            scrollTrigger: {
              trigger: textRef.current,
              start: "top 80%",
              end: "bottom 50%",
              scrub: 1,
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

  const statement = "A strong design aspirant is not someone who only knows how to answer exam questions. A strong design aspirant notices more, thinks deeper, questions better, and expresses ideas more clearly.";

  return (
    <section ref={sectionRef} className="py-32 bg-white relative px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl relative z-10">
        
        <div className="phil-bg bg-foreground text-white p-12 md:p-24 relative overflow-hidden flex flex-col items-center text-center">
          
          {/* Abstract glowing orbs */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pop-3 rounded-full blur-[120px] opacity-10 translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 max-w-4xl">
            <p className="text-primary font-medium tracking-widest uppercase mb-10">Our Philosophy</p>
            
            <h2 className="text-4xl md:text-6xl lg:text-[5rem] font-heading mb-16 leading-[1.1] tracking-tight">
              Build the designer, <br className="hidden md:block" /> not just the applicant.
            </h2>
            
            <div ref={textRef} className="text-2xl md:text-4xl font-light leading-relaxed text-white/90 flex flex-wrap justify-center gap-x-2">
              {statement.split(' ').map((word, i) => (
                <span key={i} className="word inline-block">{word}</span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
