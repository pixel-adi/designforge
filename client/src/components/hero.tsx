import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Setup elements to be animated
      const heading = containerRef.current?.querySelector('h1');
      const text = containerRef.current?.querySelector('p.text-lg');
      const buttons = containerRef.current?.querySelectorAll('button');
      const illustration = containerRef.current?.querySelector('.illustration-container');
      const elements = containerRef.current?.querySelectorAll('.floating-element');
      
      // Main content timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }});
      
      tl.fromTo(heading, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, delay: 0.2 }
      )
      .fromTo(text,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(buttons,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
        "-=0.4"
      )
      .fromTo(illustration,
        { scale: 0.8, opacity: 0, rotation: -5 },
        { scale: 1, opacity: 1, rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.7)" },
        "-=0.8"
      );

      // Continuous floating animation for abstract shapes
      elements?.forEach((el, index) => {
        gsap.to(el, {
          y: "random(-15, 15)",
          x: "random(-15, 15)",
          rotation: "random(-10, 10)",
          duration: "random(3, 5)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.2
        });
      });
      
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="pt-32 pb-24 relative overflow-hidden bg-dots">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          
          <div className="max-w-xl">
            <p className="text-muted-foreground font-medium mb-4 text-xs uppercase tracking-widest text-secondary">
              Mentorship-led. Community-first.
            </p>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-[1.1] mb-6 text-foreground">
              Get mentored, not coached, for your dream <span className="text-primary inline-block">design college.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Designforge is a design aspirant-led community mentored by NIDans, IITians, and working designers — built to help students prepare smarter for NID DAT, UCEED, CEED, portfolios, and interviews.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="rounded-md h-12 px-8 text-white btn-orange font-bold uppercase tracking-wide text-xs">
                Join WhatsApp Community
              </Button>
            </div>
          </div>
          
          <div className="relative flex justify-center items-center py-10 illustration-container">
            {/* Fun Abstract Illustration replacing the basic doodle */}
            <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center">
              
              {/* Main Blob */}
              <svg className="absolute inset-0 w-full h-full text-secondary opacity-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,95.3,-3.3C93.7,11.5,84.7,25.8,75.4,39.3C66.1,52.8,56.5,65.6,43.5,73.1C30.5,80.6,14.1,82.8,-1.7,85.7C-17.5,88.5,-32.8,92,-45.4,85.6C-58,79.2,-67.9,62.9,-75.4,47.1C-82.9,31.3,-88.1,16,-86.7,1.1C-85.3,-13.8,-77.3,-28.3,-68.1,-40.4C-58.9,-52.5,-48.5,-62.2,-36.4,-70.3C-24.3,-78.4,-10.4,-84.9,2.5,-88.4C15.4,-91.9,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
              </svg>
              
              {/* Eye Shape */}
              <div className="absolute floating-element top-[15%] left-[20%] w-24 h-24 bg-white border-2 border-foreground rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(232,156,94,0.4)] z-20">
                <div className="w-12 h-12 bg-secondary rounded-full relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Starburst Shape */}
              <svg className="absolute floating-element top-[10%] right-[15%] w-16 h-16 text-primary z-10" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 0 L60 35 L95 35 L65 55 L75 90 L50 70 L25 90 L35 55 L5 35 L40 35 Z" />
              </svg>

              {/* Pill Shape */}
              <div className="absolute floating-element bottom-[20%] left-[10%] w-32 h-12 bg-primary border-2 border-foreground rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(35,56,66,0.3)] z-10 rotate-[-15deg]">
                 <span className="font-heading font-bold text-white tracking-widest text-sm uppercase">Creative</span>
              </div>

              {/* Spring / Coil Shape */}
              <svg className="absolute floating-element bottom-[15%] right-[10%] w-28 h-28 stroke-foreground z-20" viewBox="0 0 100 100" fill="none" strokeWidth="3" strokeLinecap="round">
                 <path d="M 20 50 C 20 20, 40 20, 40 50 C 40 80, 60 80, 60 50 C 60 20, 80 20, 80 50" />
              </svg>

              {/* Arch / Rainbow Shape */}
              <div className="absolute top-[40%] right-[5%] w-32 h-16 border-t-8 border-l-8 border-r-8 border-secondary rounded-t-full z-0 floating-element opacity-50"></div>
              
              {/* Small Dots */}
              <div className="absolute top-[30%] left-[50%] w-3 h-3 bg-foreground rounded-full floating-element"></div>
              <div className="absolute bottom-[30%] right-[50%] w-4 h-4 bg-primary rounded-full floating-element"></div>
              
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
