import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function EventsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heading = sectionRef.current?.querySelector('.heading-content');
      const blocks = sectionRef.current?.querySelectorAll('.event-block');
      
      gsap.fromTo(heading,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
      );

      gsap.fromTo(blocks,
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.5, 
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current?.querySelector('.grid'), start: "top 75%" } 
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative border-b-2 border-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl text-center">
        
        <div className="heading-content">
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-6 text-foreground">
            Talks, meetups, <span className="text-pop-2">critiques.</span>
          </h2>
          <p className="text-xl font-medium text-foreground/80 max-w-3xl mx-auto mb-16">
            Designforge is not just a prep destination — it is a living ecosystem where aspirants and young designers come together for conversations, review sessions, workshops, portfolio talks, and shared growth.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="event-block struct-card aspect-square bg-pop-3 flex flex-col items-center justify-center p-6 struct-card-hover">
            <div className="w-16 h-16 bg-white rounded-full border-2 border-foreground flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <p className="text-lg font-heading font-black text-foreground">Live Critique</p>
          </div>
          
          <div className="event-block struct-card aspect-square bg-pop-1 flex flex-col items-center justify-center p-6 struct-card-hover">
             <div className="w-16 h-16 bg-white rounded-full border-2 border-foreground flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
             </div>
             <p className="text-lg font-heading font-black text-foreground">Workshop</p>
          </div>
          
          <div className="event-block struct-card aspect-[2/1] col-span-2 bg-primary flex flex-col items-center justify-center p-6 struct-card-hover relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
             <div className="w-20 h-20 bg-white rounded-full border-2 border-foreground flex items-center justify-center mb-4 relative z-10">
               <svg className="w-10 h-10 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
             </div>
             <p className="text-2xl font-heading font-black text-white relative z-10">Community Meetup</p>
          </div>
        </div>

        <Button className="btn-bold bg-white text-foreground uppercase tracking-wider text-sm font-black h-14 px-10">
          Explore Events
        </Button>

      </div>
    </section>
  );
}
