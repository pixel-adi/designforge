import { useEffect, useRef } from 'react';
import { Target, Compass, BookOpen, Lightbulb } from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function DifferenceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      
      const cards = gsap.utils.toArray('.diff-card');
      
      // Pinning the left side while scrolling through the cards on the right
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 100px",
        end: "bottom bottom",
        pin: ".sticky-side",
        pinSpacing: false,
      });

      cards.forEach((card: any, i) => {
        gsap.fromTo(card,
          { opacity: 0, x: 50, scale: 0.95 },
          { 
            opacity: 1, 
            x: 0, 
            scale: 1,
            duration: 0.8, 
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
            }
          }
        );
      });
      
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  const differences = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      color: "bg-pop-3",
      coaching: "Coaching teaches rigid formats.",
      mentorship: "Mentorship builds judgement.",
      desc: "Instead of relying on standard templates, develop the ability to make confident, context-aware design decisions."
    },
    {
      icon: <Target className="w-8 h-8" />,
      color: "bg-primary",
      coaching: "Coaching pushes mindless repetition.",
      mentorship: "Mentorship sharpens observation.",
      desc: "Doing 100 similar sketches won't help if you aren't observing the world closely and understanding 'why'."
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      color: "bg-pop-1",
      coaching: "Preparing for expected questions.",
      mentorship: "Tackling unfamiliar challenges.",
      desc: "We prepare you to handle surprise prompts by building core problem-solving fundamentals from the ground up."
    },
    {
      icon: <Compass className="w-8 h-8" />,
      color: "bg-pop-2",
      coaching: "Support ends with the exam.",
      mentorship: "Continues into true growth.",
      desc: "Our support extends into portfolios, interviews, and real-world design maturity well beyond the test day."
    }
  ];

  return (
    <section ref={sectionRef} className="py-32 relative bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        <div className="flex flex-col lg:flex-row gap-16 relative">
          
          {/* Left sticky sticky content */}
          <div className="lg:w-5/12">
            <div className="sticky-side pt-10">
              <div className="w-20 h-1 bg-primary mb-8 rounded-full"></div>
              <h2 className="text-5xl md:text-6xl font-heading mb-6 leading-[1.1] text-[#e94a35]">
                Why Designforge revolves around <span className="text-primary italic">mentorship.</span>
              </h2>
              <p className="text-foreground/60 font-light text-xl md:text-2xl leading-relaxed">
                Coaching standardises performance. Mentorship helps you discover how you think, where you struggle, and how you uniquely grow.
              </p>
            </div>
          </div>

          {/* Right scrolling cards */}
          <div className="lg:w-7/12 flex flex-col gap-6 pt-10 pb-20">
            {differences.map((diff, i) => (
              <div key={i} className="diff-card struct-card p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 bg-background">
                
                <div className={`w-16 h-16 rounded-2xl ${diff.color}/20 flex items-center justify-center shrink-0`}>
                  <div className={`text-${diff.color.replace('bg-', '')}`}>{diff.icon}</div>
                </div>
                
                <div>
                  <div className="mb-4 bg-red-50/50 px-4 py-3 rounded-xl border border-red-100">
                    <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-1">Standard Coaching</p>
                    <p className="font-heading text-lg text-foreground/40 line-through decoration-1">{diff.coaching}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Designforge</p>
                    <h3 className="text-3xl font-heading text-foreground mb-3">{diff.mentorship}</h3>
                    <p className="text-lg font-light text-foreground/70 leading-relaxed">{diff.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
