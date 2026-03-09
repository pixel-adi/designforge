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
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, scrollTrigger: { trigger: sectionRef.current, start: "top 75%" } }
      );

      gsap.fromTo(cards,
        { scale: 0.8, opacity: 0, rotation: () => gsap.utils.random(-10, 10) },
        { 
          scale: 1, 
          opacity: 1, 
          rotation: 0,
          duration: 0.6, 
          stagger: 0.1,
          ease: "back.out(1.5)", 
          scrollTrigger: { 
            trigger: sectionRef.current?.querySelector('.grid'), 
            start: "top 80%" 
          } 
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background doodles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10%" cy="20%" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary"/>
          <path d="M80% 80% L90% 90% M90% 80% L80% 90%" stroke="currentColor" strokeWidth="2" className="text-secondary"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="heading-content max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
            Real journeys. Real ranks. <span className="text-primary">Real growth.</span>
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Behind every rank is a process — uncertainty, effort, iteration, feedback, and breakthrough. We are proud not only of the results our students achieve, but of the confidence and clarity they build along the way.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { rank: "AIR 12", exam: "NID BDes", color: "bg-[#FFF4ED]" },
            { rank: "AIR 4", exam: "NID MDes", color: "bg-[#F0F8FA]" },
            { rank: "AIR 28", exam: "UCEED", color: "bg-[#F9F5FF]" },
            { rank: "AIR 15", exam: "CEED", color: "bg-[#FCF8F3]" },
          ].map((item, i) => (
            <div key={i} className={`achiever-card ${item.color} border-2 border-foreground rounded-2xl p-6 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 cursor-pointer`}>
               <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 border-2 border-foreground flex items-center justify-center overflow-hidden relative">
                  <div className="absolute bottom-0 w-full h-1/2 bg-foreground/10"></div>
                  <div className="w-6 h-6 rounded-full bg-foreground absolute top-3"></div>
               </div>
               <p className="font-heading font-bold text-2xl text-foreground mb-1">{item.rank}</p>
               <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{item.exam}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
           <a href="#" className="inline-flex items-center gap-2 text-primary font-bold hover:text-foreground transition-colors group text-sm uppercase tracking-widest">
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
