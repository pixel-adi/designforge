import { useEffect, useRef } from 'react';
import { Target, Compass, BookOpen, Lightbulb } from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function DifferenceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll('.diff-row');
      
      cards?.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, x: -30 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.6, 
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
            }
          }
        );
      });
      
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  const differences = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      color: "bg-pop-3",
      coaching: "Coaching teaches formats.",
      mentorship: "Mentorship builds judgement.",
      desc: "Instead of relying on standard templates, develop the ability to make confident design decisions."
    },
    {
      icon: <Target className="w-6 h-6" />,
      color: "bg-primary",
      coaching: "Coaching pushes repetition.",
      mentorship: "Mentorship sharpens observation.",
      desc: "Doing 100 similar sketches won't help if you aren't observing the world closely."
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      color: "bg-pop-1",
      coaching: "Expected questions.",
      mentorship: "Unfamiliar challenges.",
      desc: "We prepare you to tackle surprise prompts by building core problem-solving fundamentals."
    },
    {
      icon: <Compass className="w-6 h-6" />,
      color: "bg-pop-2",
      coaching: "Ends with the exam.",
      mentorship: "Continues into growth.",
      desc: "Our support extends into portfolios, interviews, and real-world design maturity."
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 relative bg-grid bg-[#FFFDFB] border-b-2 border-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-6 text-foreground">
            Why Designforge is built around <span className="text-primary underline decoration-pop-3 underline-offset-8">mentorship</span>
          </h2>
          <p className="text-foreground/70 font-medium max-w-2xl mx-auto text-xl">
            Coaching standardises performance. Mentorship helps you discover how you think, where you struggle, and how to grow.
          </p>
        </div>

        {/* High contrast table structure */}
        <div className="struct-card p-0 max-w-5xl mx-auto bg-white">
          <div className="flex flex-col divide-y-2 divide-foreground">
            {differences.map((diff, i) => (
              <div key={i} className="diff-row grid md:grid-cols-12 gap-6 p-6 md:p-8 items-center hover:bg-muted/50 transition-colors">
                <div className="md:col-span-1 flex justify-center md:justify-start">
                   <div className={`w-14 h-14 rounded-xl ${diff.color} border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center text-foreground`}>
                     {diff.icon}
                   </div>
                </div>
                <div className="md:col-span-4 text-center md:text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-2">Standard Coaching</p>
                  <p className="font-heading font-bold text-xl text-foreground/50 line-through decoration-2">{diff.coaching}</p>
                </div>
                <div className="md:col-span-7 text-center md:text-left">
                  <p className="text-xs text-primary uppercase tracking-widest font-black mb-2">Designforge</p>
                  <h3 className="text-2xl font-heading font-black text-foreground mb-2">{diff.mentorship}</h3>
                  <p className="text-base font-medium text-muted-foreground">{diff.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
