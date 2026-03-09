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
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
      );

      gsap.fromTo(blocks,
        { scale: 0.9, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.6, 
          stagger: 0.1,
          ease: "back.out(1.5)",
          scrollTrigger: { trigger: sectionRef.current?.querySelector('.grid'), start: "top 75%" } 
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
        
        <div className="heading-content">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
            Talks, meetups, critiques, and community moments
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-16">
            Designforge is not just a prep destination — it is a living ecosystem where aspirants and young designers come together for conversations, review sessions, workshops, portfolio talks, interview guidance, and shared growth.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="event-block aspect-square bg-[#FCF8F3] border-2 border-foreground rounded-2xl flex flex-col items-center justify-center p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer">
            <svg className="w-12 h-12 stroke-primary mb-2" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <p className="text-sm font-heading font-bold text-foreground">Live Critique</p>
          </div>
          
          <div className="event-block aspect-square bg-[#F0F8FA] border-2 border-foreground rounded-2xl flex flex-col items-center justify-center p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer">
             <svg className="w-12 h-12 stroke-secondary mb-2" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
             <p className="text-sm font-heading font-bold text-foreground">Workshop</p>
          </div>
          
          <div className="event-block aspect-[2/1] col-span-2 bg-[#F9F5FF] border-2 border-foreground rounded-2xl flex flex-col items-center justify-center p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/50 rounded-full blur-2xl"></div>
             <svg className="w-16 h-16 stroke-accent-foreground mb-2" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
             <p className="text-lg font-heading font-bold text-foreground">Community Meetup</p>
          </div>
        </div>

        <Button variant="outline" className="border-2 border-foreground text-foreground hover:bg-muted bg-white uppercase tracking-wider text-xs font-bold h-12 px-8 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
          Explore Events
        </Button>

      </div>
    </section>
  );
}
