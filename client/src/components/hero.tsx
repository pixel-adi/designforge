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
          rotation: "random(-5, 5)",
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
    <section ref={containerRef} className="pt-20 pb-28 relative bg-grid bg-[#FFFDFB] border-b-2 border-foreground overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center max-w-7xl mx-auto">
          
          <div className="lg:col-span-7 max-w-2xl relative z-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-foreground rounded-full text-xs font-bold uppercase tracking-widest text-foreground mb-8 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <span className="w-2.5 h-2.5 rounded-full bg-pop-1 animate-pulse border border-foreground"></span>
              Mentorship-led. Community-first.
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-black leading-[1.1] mb-6 text-foreground">
              Get mentored, <br/>not coached, for your dream <span className="text-primary inline-block relative">
                design college.
                <svg className="absolute w-full h-4 -bottom-1 left-0 text-pop-3 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl font-medium">
              Designforge is an aspirant-led community mentored by NIDans, IITians, and designers — built to help you prepare smarter for NID DAT, UCEED, CEED, portfolios, and interviews.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Button className="rounded-xl h-14 px-8 btn-bold btn-primary-pop uppercase tracking-wider text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                Join WhatsApp Community
              </Button>
              <Button className="rounded-xl h-14 px-8 btn-bold bg-white text-foreground uppercase tracking-wider text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                Join Focus Batch
              </Button>
            </div>
          </div>
          
          <div className="lg:col-span-5 relative flex justify-center items-center py-10">
            {/* Pop-Color Structured Illustration Card */}
            <div className="illustration-card w-full max-w-[480px] aspect-[4/3] bg-pop-2 border-4 border-foreground rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 relative flex items-center justify-center overflow-hidden">
              
              <div className="absolute top-4 left-4 flex gap-2 z-20 bg-white px-3 py-1.5 border-2 border-foreground rounded-full shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <div className="w-3 h-3 rounded-full bg-destructive border border-foreground"></div>
                <div className="w-3 h-3 rounded-full bg-pop-3 border border-foreground"></div>
                <div className="w-3 h-3 rounded-full bg-pop-1 border border-foreground"></div>
              </div>

              {/* Tidy Abstract Illustration inside the card */}
              <div className="relative w-full h-full flex items-center justify-center mt-4">
                
                {/* Center abstract eye/target element */}
                <div className="absolute w-36 h-36 border-4 border-foreground rounded-full flex items-center justify-center bg-white z-10 shadow-[4px_4px_0_0_rgba(0,0,0,1)] float-anim">
                  <div className="w-16 h-16 bg-pop-1 border-4 border-foreground rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-foreground rounded-full"></div>
                  </div>
                </div>

                {/* Abstract shapes */}
                <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 200 200" fill="none">
                  <path className="stroke-foreground float-anim" strokeWidth="4" strokeDasharray="8 8" d="M20 100 L180 100" />
                  <path className="stroke-pop-3 float-anim" strokeWidth="8" strokeLinecap="round" d="M150 40 Q 180 60 150 90" />
                  <rect className="fill-primary border-4 border-foreground float-anim" x="30" y="40" width="30" height="30" rx="6" />
                  <polygon className="fill-white border-4 border-foreground float-anim" points="30,160 50,130 70,160" />
                  <circle className="fill-pop-1 border-4 border-foreground float-anim" cx="160" cy="150" r="18" />
                </svg>

              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
