import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function EventsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      const blocks = gsap.utils.toArray('.event-pill');
      
      gsap.fromTo(".events-title",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: sectionRef.current, start: "top 85%" } }
      );

      blocks.forEach((block: any, i) => {
        gsap.fromTo(block,
          { x: i % 2 === 0 ? -30 : 30, opacity: 0 },
          { 
            x: 0, 
            opacity: 1, 
            duration: 0.6, 
            ease: "power2.out",
            scrollTrigger: { trigger: block, start: "top 90%" } 
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="pt-32 pb-16 bg-background relative overflow-hidden">
      
      {/* Background shape */}
      <div className="absolute top-0 right-0 w-[40vw] h-[100%] rounded-l-full pointer-events-none" style={{ background: 'radial-gradient(circle at right, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)' }}></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="events-title text-5xl md:text-6xl font-heading mb-6 text-foreground tracking-tight">
            Talks, meetups, <span className="text-pop-2 italic">critiques.</span>
          </h2>
          <p className="events-title text-xl font-light text-foreground/60 leading-relaxed">
            Designforge is not just a prep destination — it is a living ecosystem where aspirants and young designers come together.
          </p>
        </div>

        <div className="flex flex-col gap-6 max-w-4xl mx-auto mb-0">
          
          <div className="event-pill flex flex-col md:flex-row items-center gap-8 bg-white p-6 md:pr-10 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-black/5 hover:scale-[1.02] transition-transform duration-500">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-pop-3/20 rounded-full flex items-center justify-center shrink-0">
               <svg className="w-10 h-10 md:w-12 md:h-12 text-pop-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-3xl font-heading text-foreground mb-3">Live Critique Sessions</h3>
              <p className="text-foreground/60 font-light text-lg">Regular open portfolio and concept review rooms with mentors.</p>
            </div>
          </div>

          <div className="event-pill flex flex-col md:flex-row-reverse items-center gap-8 bg-white p-6 md:pl-10 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-black/5 hover:scale-[1.02] transition-transform duration-500 ml-0 md:ml-12">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-pop-1/20 rounded-full flex items-center justify-center shrink-0">
               <svg className="w-10 h-10 md:w-12 md:h-12 text-pop-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <div className="text-center md:text-right flex-1">
              <h3 className="text-3xl font-heading text-foreground mb-3">Interactive Workshops</h3>
              <p className="text-foreground/60 font-light text-lg">Deep dives into sketching techniques, analytical reasoning, and spatial design.</p>
            </div>
          </div>

          <div className="event-pill flex flex-col md:flex-row items-center gap-8 bg-white p-6 md:pr-10 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-black/5 hover:scale-[1.02] transition-transform duration-500">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
               <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-3xl font-heading text-foreground mb-3">Community Meetups</h3>
              <p className="text-foreground/60 font-light text-lg">Online and offline gatherings to discuss design culture, college life, and growth.</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
