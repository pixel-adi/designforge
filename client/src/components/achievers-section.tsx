import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const achieversData = [
  { rank: "AIR 12", exam: "NID BDes", color: "bg-pop-3" },
  { rank: "AIR 4", exam: "NID MDes", color: "bg-primary" },
  { rank: "AIR 28", exam: "UCEED", color: "bg-pop-1" },
  { rank: "AIR 15", exam: "CEED", color: "bg-pop-2" },
  { rank: "AIR 9", exam: "NID BDes", color: "bg-pop-3" },
  { rank: "AIR 18", exam: "NID MDes", color: "bg-primary" },
  { rank: "AIR 34", exam: "UCEED", color: "bg-pop-1" },
  { rank: "AIR 21", exam: "CEED", color: "bg-pop-2" },
];

export function AchieversSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', skipSnaps: false },
    [Autoplay({ delay: 3000, stopOnInteraction: true })]
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".achiever-title", 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: sectionRef.current, start: "top 85%" }}
      );
      
      gsap.fromTo(".embla",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, scrollTrigger: { trigger: sectionRef.current, start: "top 85%" }}
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="achiever-title text-5xl md:text-6xl font-heading mb-6 tracking-tight text-[#e94a35]">
            Real journeys. Real ranks. <span className="text-primary italic">Real growth.</span>
          </h2>
          <p className="achiever-title text-xl text-foreground/60 font-light max-w-2xl mx-auto leading-relaxed">
            Behind every rank is a process — uncertainty, effort, iteration, feedback, and breakthrough.
          </p>
        </div>

        <div className="embla overflow-hidden -mx-4 px-4" ref={emblaRef}>
          <div className="embla__container flex touch-pan-y pt-8 pb-12">
            {achieversData.map((item, i) => (
              <div key={i} className="embla__slide flex-[0_0_50%] sm:flex-[0_0_33.33%] md:flex-[0_0_25%] min-w-0 pl-4">
                <div className="achiever-card flex flex-col items-center group cursor-pointer h-full">
                   <div className={`w-32 h-32 md:w-40 md:h-40 ${item.color}/10 rounded-full flex items-center justify-center mb-8 relative group-hover:scale-105 transition-transform duration-500`}>
                      <div className={`absolute inset-0 ${item.color}/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                      <div className={`w-20 h-20 md:w-24 md:h-24 ${item.color} rounded-full text-background flex items-center justify-center shadow-lg relative z-10`}>
                         <span className="font-heading text-2xl md:text-3xl">{item.rank.split(' ')[1]}</span>
                      </div>
                   </div>
                   <p className="font-heading text-2xl text-foreground mb-2">{item.rank}</p>
                   <p className="text-sm text-foreground/50 uppercase tracking-widest font-medium text-center">{item.exam}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
