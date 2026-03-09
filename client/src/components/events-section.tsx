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
    <section ref={sectionRef} className="py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
        
        <div className="heading-content">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
            Talks, meetups, critiques.
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-16">
            Designforge is not just a prep destination — it is a living ecosystem where aspirants and young designers come together for conversations, review sessions, workshops, portfolio talks, and shared growth.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="event-block struct-card aspect-square bg-white flex flex-col items-center justify-center p-4 hover:border-primary/50 transition-colors cursor-pointer">
            <svg className="w-8 h-8 text-primary mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <p className="text-sm font-bold text-foreground">Live Critique</p>
          </div>
          
          <div className="event-block struct-card aspect-square bg-white flex flex-col items-center justify-center p-4 hover:border-primary/50 transition-colors cursor-pointer">
             <svg className="w-8 h-8 text-secondary mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
             <p className="text-sm font-bold text-foreground">Workshop</p>
          </div>
          
          <div className="event-block struct-card aspect-[2/1] col-span-2 bg-muted/20 flex flex-col items-center justify-center p-4 hover:border-primary/50 transition-colors cursor-pointer">
             <svg className="w-8 h-8 text-foreground mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
             <p className="text-sm font-bold text-foreground">Community Meetup</p>
          </div>
        </div>

        <Button variant="outline" className="struct-card border-border text-foreground hover:bg-muted bg-white uppercase tracking-wider text-xs font-bold h-12 px-8 transition-colors">
          Explore Events
        </Button>

      </div>
    </section>
  );
}
