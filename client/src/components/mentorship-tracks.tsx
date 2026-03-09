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
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: heading,
            start: "top 80%",
          }
        }
      );

      gsap.fromTo(cards,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current?.querySelector('.cards-container'),
            start: "top 75%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-dots relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-20 right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        <div className="heading-content text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-foreground">
            Mentorship for every pathway
          </h2>
          <p className="text-muted-foreground text-lg">
            Whether you are preparing for NID DAT, UCEED, CEED, portfolios, or interviews, we give you the environment to grow.
          </p>
        </div>

        <div className="cards-container flex flex-col md:flex-row justify-center items-stretch gap-6 lg:gap-8">
          {tracks.map((track, i) => (
            <div 
              key={i} 
              className={`track-card bg-white rounded-2xl border-2 ${track.popular ? 'border-primary shadow-[8px_8px_0_0_rgba(232,156,94,0.3)] md:-translate-y-4 relative' : 'border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)]'} p-8 w-full md:w-1/3 flex flex-col text-center transition-transform hover:-translate-y-2 duration-300`}
            >
              {track.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full border-2 border-white shadow-sm">
                  Most Popular
                </div>
              )}
              <p className="text-primary text-xs uppercase tracking-widest font-semibold mb-2">{track.subtitle}</p>
              <h3 className="text-2xl font-heading font-bold text-foreground mb-4 pb-4 border-b border-border/50">{track.title}</h3>
              
              <div className="mb-6">
                 <p className="text-xl font-bold text-secondary">{track.price}</p>
                 <p className="text-xs text-muted-foreground mt-1">tailored for you</p>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                {track.description}
              </p>
              
              <Button className={`w-full ${track.popular ? 'btn-orange text-white' : 'bg-white border-2 border-foreground text-foreground hover:bg-muted shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all'} rounded-xl uppercase tracking-wider text-xs font-bold h-12`}>
                Explore Track
              </Button>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
