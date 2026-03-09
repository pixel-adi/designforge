import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import gsap from 'gsap';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Setup elements to be animated
      const heading = containerRef.current?.querySelector('h1');
      const text = containerRef.current?.querySelector('p.text-lg');
      const buttons = containerRef.current?.querySelectorAll('button');
      const illustration = containerRef.current?.querySelector('.illustration-card');
      const floaters = containerRef.current?.querySelectorAll('.float-anim');
      
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }});
      
      tl.fromTo(heading, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, delay: 0.1 }
      )
      .fromTo(text,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4"
      )
      .fromTo(buttons,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        "-=0.3"
      )
      .fromTo(illustration,
        { scale: 0.95, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.2)" },
        "-=0.6"
      );

      floaters?.forEach((el, index) => {
        gsap.to(el, {
          y: "random(-10, 10)",
          duration: "random(2, 4)",
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
    <section ref={containerRef} className="pt-24 pb-24 relative bg-grid bg-[#FAFAFA] border-b border-border overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center max-w-7xl mx-auto">
          
          <div className="lg:col-span-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border rounded-full text-xs font-bold uppercase tracking-widest text-primary mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Mentorship-led. Community-first.
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-[1.15] mb-6 text-foreground">
              Get mentored, <br/>not coached, for your dream <span className="text-primary inline-block">design college.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
              Designforge is a design aspirant-led community mentored by NIDans, IITians, and working designers — built to help students prepare smarter for NID DAT, UCEED, CEED, portfolios, and interviews.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="rounded-lg h-14 px-8 text-white btn-orange font-bold uppercase tracking-wide text-sm shadow-md">
                Join WhatsApp Community
              </Button>
            </div>
          </div>
          
          <div className="lg:col-span-5 relative flex justify-center items-center py-10">
            {/* Structured Illustration Card */}
            <div className="illustration-card w-full max-w-[450px] aspect-[4/3] bg-white border border-border rounded-2xl shadow-xl p-8 relative flex items-center justify-center">
              
              <div className="absolute top-4 left-4 flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>

              {/* Tidy Abstract Illustration inside the card */}
              <div className="relative w-full h-full flex items-center justify-center mt-4">
                
                {/* Center geometric element */}
                <div className="absolute w-32 h-32 border-4 border-foreground rounded-full flex items-center justify-center bg-[#FFF4ED] z-10">
                  <div className="w-16 h-16 bg-primary rounded-full float-anim"></div>
                </div>

                {/* Abstract lines and shapes */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none">
                  <path className="stroke-foreground float-anim" strokeWidth="3" strokeDasharray="6 6" d="M20 100 L180 100" />
                  <path className="stroke-secondary float-anim" strokeWidth="4" strokeLinecap="round" d="M150 40 Q 170 60 150 80" />
                  <rect className="stroke-foreground float-anim" strokeWidth="3" x="40" y="40" width="20" height="20" rx="4" />
                  <circle className="fill-accent float-anim" cx="160" cy="150" r="15" />
                  <polygon className="stroke-primary float-anim" strokeWidth="3" points="30,150 45,130 60,150" />
                </svg>

              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
