import { useEffect, useRef } from 'react';
import { Frown, Map, EyeOff, XCircle } from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function PainSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      // Title scrub animation
      gsap.to(".pain-title", {
        backgroundPositionX: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });

      const cards = gsap.utils.toArray('.pain-card');
      
      cards.forEach((card: any, i) => {
        gsap.fromTo(card,
          { y: 100, opacity: 0, rotate: i % 2 === 0 ? -5 : 5 },
          { 
            y: 0, 
            opacity: 1, 
            rotate: 0,
            duration: 1.2, 
            ease: "expo.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
            }
          }
        );

        // Hover magnetic effect via GSAP
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { y: -10, scale: 1.02, duration: 0.4, ease: "power2.out" });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: "power2.out" });
        });
      });
      
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 relative bg-white rounded-t-[3rem] -mt-10 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        <div className="text-center max-w-4xl mx-auto mb-24">
          <h2 className="pain-title text-4xl md:text-5xl lg:text-6xl font-heading mb-8 text-transparent bg-clip-text bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] leading-tight">
            The hardest part of design preparation is direction.
          </h2>
          <p className="text-xl md:text-2xl text-foreground/60 font-light max-w-3xl mx-auto leading-relaxed">
            Aspirants work incredibly hard, but often find themselves stuck between overwhelming resources and zero feedback.
          </p>
        </div>

        {/* Masonry / Staggered Layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          
          <div className="pain-card struct-card p-10 bg-gradient-to-br from-white to-pop-3/10 lg:mt-12">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-black/5">
              <Map className="w-8 h-8 text-pop-3" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-2xl text-foreground mb-4">Trapped in templates</h3>
            <p className="text-base text-foreground/60 leading-relaxed font-light">Following expected answers instead of cultivating original thought and organic reasoning.</p>
          </div>

          <div className="pain-card struct-card p-10 bg-gradient-to-br from-white to-pop-1/10">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-black/5">
              <EyeOff className="w-8 h-8 text-pop-1" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-2xl text-foreground mb-4">Practicing blind</h3>
            <p className="text-base text-foreground/60 leading-relaxed font-light">Working hard in isolation without meaningful critique or professional feedback loops.</p>
          </div>

          <div className="pain-card struct-card p-10 bg-gradient-to-br from-white to-pop-2/10 lg:mt-16">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-black/5">
              <XCircle className="w-8 h-8 text-pop-2" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-2xl text-foreground mb-4">Information overload</h3>
            <p className="text-base text-foreground/60 leading-relaxed font-light">Too many scattered resources but no clear, structured path forward for consistent growth.</p>
          </div>

          <div className="pain-card struct-card p-10 bg-gradient-to-br from-white to-primary/10 lg:mt-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-black/5">
              <Frown className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-2xl text-foreground mb-4">Interview anxiety</h3>
            <p className="text-base text-foreground/60 leading-relaxed font-light">Reaching the final rounds but lacking the presentation confidence and articulation to shine.</p>
          </div>

        </div>

      </div>
    </section>
  );
}
