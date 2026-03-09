import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function AchieversSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heading = sectionRef.current?.querySelector('.heading-content');
      const cards = sectionRef.current?.querySelectorAll('.achiever-card');
      
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
          stagger: 0.1,
          ease: "power2.out", 
          scrollTrigger: { 
            trigger: sectionRef.current?.querySelector('.grid'), 
            start: "top 75%" 
          } 
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#FAFAFA] relative border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        <div className="heading-content max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
            Real journeys. Real ranks. Real growth.
          </h2>
          <p className="text-lg text-muted-foreground">
            Behind every rank is a process — uncertainty, effort, iteration, feedback, and breakthrough.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { rank: "AIR 12", exam: "NID BDes" },
            { rank: "AIR 4", exam: "NID MDes" },
            { rank: "AIR 28", exam: "UCEED" },
            { rank: "AIR 15", exam: "CEED" },
          ].map((item, i) => (
            <div key={i} className={`achiever-card struct-card bg-white p-6 text-center hover:border-primary/50 transition-colors`}>
               <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 border border-border flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-border"></div>
               </div>
               <p className="font-heading font-bold text-2xl text-foreground mb-1">{item.rank}</p>
               <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{item.exam}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
           <a href="#" className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors group text-sm uppercase tracking-widest">
             Explore student stories 
             <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
             </svg>
           </a>
        </div>
      </div>
    </section>
  );
}
