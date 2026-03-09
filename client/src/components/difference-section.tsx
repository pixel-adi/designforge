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
          { opacity: 0, y: 20 },
          { 
            opacity: 1, 
            y: 0, 
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
      icon: <BookOpen className="w-5 h-5" />,
      coaching: "Coaching teaches formats.",
      mentorship: "Mentorship builds judgement.",
      desc: "Instead of relying on standard templates, we help you develop the ability to make confident design decisions."
    },
    {
      icon: <Target className="w-5 h-5" />,
      coaching: "Coaching pushes repetition.",
      mentorship: "Mentorship sharpens observation.",
      desc: "Doing 100 similar sketches won't help if you aren't observing the world closely and thinking critically."
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      coaching: "Expected questions.",
      mentorship: "Unfamiliar challenges.",
      desc: "We prepare you to tackle surprise prompts by building core problem-solving fundamentals."
    },
    {
      icon: <Compass className="w-5 h-5" />,
      coaching: "Ends with the exam.",
      mentorship: "Continues into growth.",
      desc: "Our support extends into portfolios, interviews, and real-world design maturity."
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 relative bg-[#FAFAFA] border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
            Why Designforge is built around mentorship
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Coaching standardises performance. Mentorship helps you discover how you think, where you struggle, and how to grow.
          </p>
        </div>

        {/* Structured List instead of scattered items */}
        <div className="struct-card p-2 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 divide-y divide-border">
            {differences.map((diff, i) => (
              <div key={i} className="diff-row grid md:grid-cols-12 gap-6 p-6 items-center hover:bg-muted/30 transition-colors">
                <div className="md:col-span-1 flex justify-center md:justify-start">
                   <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                     {diff.icon}
                   </div>
                </div>
                <div className="md:col-span-4 text-center md:text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Standard Coaching</p>
                  <p className="font-heading font-bold text-foreground opacity-60 line-through decoration-1">{diff.coaching}</p>
                </div>
                <div className="md:col-span-7 text-center md:text-left">
                  <p className="text-xs text-primary uppercase tracking-widest font-bold mb-1">Designforge Mentorship</p>
                  <h3 className="text-xl font-heading font-bold text-foreground mb-2">{diff.mentorship}</h3>
                  <p className="text-sm text-muted-foreground">{diff.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-lg font-heading font-bold text-secondary">
            "We don't want students to look prepared. We want them to become stronger thinkers and makers."
          </p>
        </div>

      </div>
    </section>
  );
}
