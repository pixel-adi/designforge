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
    <section ref={sectionRef} className="py-24 bg-grid bg-[#FFFDFB] relative border-b-2 border-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        <div className="heading-content max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-6 text-foreground">
            Real journeys. Real ranks. <span className="text-pop-1 underline decoration-foreground underline-offset-8">Real growth.</span>
          </h2>
          <p className="text-xl text-foreground/80 font-medium max-w-2xl mx-auto">
            Behind every rank is a process — uncertainty, effort, iteration, feedback, and breakthrough.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { rank: "AIR 12", exam: "NID BDes", color: "bg-pop-3" },
            { rank: "AIR 4", exam: "NID MDes", color: "bg-primary" },
            { rank: "AIR 28", exam: "UCEED", color: "bg-pop-1" },
            { rank: "AIR 15", exam: "CEED", color: "bg-pop-2" },
          ].map((item, i) => (
            <div key={i} className={`achiever-card struct-card bg-white p-8 text-center struct-card-hover`}>
               <div className={`w-16 h-16 ${item.color} rounded-xl mx-auto mb-6 border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center`}>
                  <div className="w-6 h-6 rounded bg-white border-2 border-foreground"></div>
               </div>
               <p className="font-heading font-black text-3xl text-foreground mb-2">{item.rank}</p>
               <p className="text-xs text-foreground uppercase tracking-widest font-black">{item.exam}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
           <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-xl text-foreground font-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all uppercase tracking-widest text-sm">
             Explore student stories 
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
             </svg>
           </a>
        </div>
      </div>
    </section>
  );
}
