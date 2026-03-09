import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const tracks = [
  {
    title: "NID DAT BDes",
    subtitle: "Observation & Creativity",
    description: "Build creativity, observation, visualisation, and confidence for prelims, studio tests, and interviews.",
    price: "Structured Prep",
    popular: false,
  },
  {
    title: "NID DAT MDes",
    subtitle: "Advanced Portfolios",
    description: "Develop stronger problem framing, portfolio depth, articulation, and design maturity for advanced admissions.",
    price: "Deeper Critique",
    popular: true,
  },
  {
    title: "UCEED & CEED",
    subtitle: "Analytical Design",
    description: "Prepare with stronger basics, visual reasoning, sketching, analytical thinking, and concept communication.",
    price: "Systematic Guidance",
    popular: false,
  }
];

export function MentorshipTracks() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heading = sectionRef.current?.querySelector('.heading-content');
      const cards = sectionRef.current?.querySelectorAll('.track-card');
      
      gsap.fromTo(heading,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: heading, start: "top 80%" } }
      );

      gsap.fromTo(cards,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current?.querySelector('.cards-container'), start: "top 75%" }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        <div className="heading-content text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-foreground">
            Mentorship for every pathway
          </h2>
          <p className="text-muted-foreground text-lg">
            Whether you are preparing for NID DAT, UCEED, CEED, portfolios, or interviews, we give you the structured environment to grow.
          </p>
        </div>

        <div className="cards-container grid md:grid-cols-3 gap-6 lg:gap-8">
          {tracks.map((track, i) => (
            <div 
              key={i} 
              className={`track-card struct-card p-8 flex flex-col text-center ${track.popular ? 'border-primary ring-1 ring-primary shadow-md relative' : ''} hover:border-primary/50 transition-all`}
            >
              {track.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Most Chosen
                </div>
              )}
              <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{track.subtitle}</p>
              <h3 className="text-2xl font-heading font-bold text-foreground mb-4 pb-4 border-b border-border/50">{track.title}</h3>
              
              <div className="mb-6">
                 <p className="text-lg font-bold text-secondary">{track.price}</p>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                {track.description}
              </p>
              
              <Button className={`w-full ${track.popular ? 'btn-orange text-white' : 'bg-muted/50 border border-border text-foreground hover:bg-muted'} rounded-lg uppercase tracking-wider text-xs font-bold h-12 transition-all`}>
                Explore Track
              </Button>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
