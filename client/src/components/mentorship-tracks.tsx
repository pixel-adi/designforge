import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import gsap from 'gsap';

const tracks = [
  {
    title: "NID DAT BDes",
    subtitle: "Observation & Creativity",
    description: "Build creativity, observation, visualisation, and confidence for prelims, studio tests, and interviews.",
    price: "Structured Prep",
    popular: false,
    color: "bg-pop-3",
    hoverColor: "hover:bg-pop-3/5"
  },
  {
    title: "NID DAT MDes",
    subtitle: "Advanced Portfolios",
    description: "Develop stronger problem framing, portfolio depth, articulation, and design maturity for advanced admissions.",
    price: "Deeper Critique",
    popular: true,
    color: "bg-primary",
    hoverColor: "hover:bg-primary/5"
  },
  {
    title: "UCEED & CEED",
    subtitle: "Analytical Design",
    description: "Prepare with stronger basics, visual reasoning, sketching, analytical thinking, and concept communication.",
    price: "Systematic Guidance",
    popular: false,
    color: "bg-pop-1",
    hoverColor: "hover:bg-pop-1/5"
  }
];

export function MentorshipTracks() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      gsap.fromTo(".track-card",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: ".cards-container", start: "top 85%" }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-5xl md:text-6xl font-heading mb-6 tracking-tight text-[#e94a35]">
            Mentorship for every pathway
          </h2>
          <p className="text-foreground/60 text-xl font-light leading-relaxed">
            Whether you are preparing for NID DAT, UCEED, CEED, portfolios, or interviews, we give you the structured environment to grow natively.
          </p>
        </div>

        <div className="cards-container grid lg:grid-cols-3 gap-8">
          {tracks.map((track, i) => (
            <div 
              key={i} 
              className={`track-card struct-card p-10 flex flex-col group ${track.hoverColor}`}
            >
              
              <div className={`w-3 h-12 rounded-full ${track.color} mb-8 opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>

              <p className="text-sm uppercase tracking-widest font-medium mt-[6px] mb-[6px] bg-[#33181800] text-[#dc4846]">{track.subtitle}</p>
              <h3 className="text-3xl font-heading text-foreground mb-6">{track.title}</h3>
              
              <p className="text-foreground/70 text-base font-light leading-relaxed mb-10 flex-1">
                {track.description}
              </p>

              <div className="pt-8 border-t border-black/5 mt-auto flex items-center justify-between">
                <span className="font-medium text-foreground">{track.price}</span>
                <div className={`w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background transform group-hover:translate-x-2 transition-transform duration-300 ${track.popular ? 'bg-primary text-white' : ''}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
