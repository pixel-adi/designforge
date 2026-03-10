import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro animations
      const tl = gsap.timeline({ defaults: { ease: "power4.out" }});
      
      tl.fromTo(".hero-badge", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.2 })
        .fromTo(".hero-title", { y: 40, opacity: 0, rotateX: -10 }, { y: 0, opacity: 1, rotateX: 0, duration: 1.2 }, "-=0.8")
        .fromTo(".hero-desc", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, "-=1")
        .fromTo(".hero-btn", { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.1 }, "-=0.8")
        .fromTo(".hero-image", { opacity: 0, scale: 0.8, y: 50 }, { opacity: 1, scale: 1, y: 0, duration: 1.5, ease: "expo.out" }, "-=1.2");

      // Continuous fluid animation for shapes
      gsap.to(".shape-1", {
        y: -30, x: 20, rotation: 10,
        duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut"
      });
      gsap.to(".shape-2", {
        y: 40, x: -20, rotation: -15,
        duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1
      });
      gsap.to(".shape-3", {
        scale: 1.1, rotation: 5,
        duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5
      });

      // Parallax effect on scroll
      gsap.to(".hero-image-container", {
        y: 100,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
      
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="pt-24 pb-32 relative bg-background overflow-hidden perspective-1000">
      
      {/* Soft abstract background blur */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-pop-3/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="hero-badge inline-flex items-center gap-2 px-5 py-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-full text-sm font-medium text-foreground mb-10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            A new era of design preparation
          </div>
          
          <h1 className="hero-title text-5xl md:text-7xl lg:text-[5.5rem] font-heading leading-[1.05] mb-8 text-foreground tracking-tight transform-style-3d">
            Get mentored, not coached, for your <span className="text-primary relative inline-block">
              dream college.
              <svg className="absolute w-full h-3 -bottom-2 left-0 text-pop-3 -z-10 opacity-70" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h1>
          
          <p className="hero-desc text-xl md:text-2xl text-foreground/60 mb-12 leading-relaxed max-w-2xl font-light">
            Designforge is an aspirant-led community mentored by NIDans and IITians — built to help you prepare smarter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            <Button className="hero-btn rounded-full h-16 px-10 btn-bold btn-primary-pop text-base w-full sm:w-auto">
              Join WhatsApp Community
            </Button>
            <Button className="hero-btn rounded-full h-16 px-10 btn-bold bg-white text-foreground border border-black/5 hover:border-black/10 text-base shadow-sm w-full sm:w-auto">
              Explore Focus Batch
            </Button>
          </div>
        </div>
        
        {/* Creative Organic Illustration Area */}
        <div className="hero-image-container w-full max-w-5xl mt-24 relative flex justify-center z-20">
          <div className="hero-image relative w-full min-h-[400px] md:min-h-[500px] bg-white/40 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex items-center justify-center p-6 md:p-12">
            
            {/* Abstract fluid shapes inside the glass container */}
            <div className="shape-1 organic-blob absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-pop-1/80 mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="shape-2 organic-blob absolute bottom-0 right-0 w-56 h-56 md:w-72 md:h-72 bg-pop-2/60 mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="shape-3 organic-blob absolute top-1/4 left-1/4 w-64 h-64 md:w-80 md:h-80 bg-pop-3/60 mix-blend-multiply filter blur-xl opacity-70"></div>

            {/* Foreground crisp elements */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 w-full max-w-3xl">
               <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-black/5 flex flex-col items-center justify-center transform md:-rotate-6 hover:rotate-0 transition-transform duration-500 min-h-[220px]">
                  <div className="w-16 h-16 rounded-2xl bg-pop-1/10 flex items-center justify-center mb-6">
                     <svg className="w-8 h-8 text-pop-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h3 className="font-heading text-xl text-foreground mb-2">Build Value</h3>
                  <p className="text-sm text-foreground/60 text-center">Focus on creating real impact</p>
               </div>
               
               <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-black/5 flex flex-col items-center justify-center transform md:translate-y-8 md:scale-110 z-20 min-h-[220px]">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 rotate-12">
                     <svg className="w-10 h-10 text-primary -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  </div>
                  <h3 className="font-heading text-2xl text-foreground mb-2">Gain Clarity</h3>
                  <p className="text-sm text-foreground/60 text-center">Mentorship over standard coaching</p>
               </div>

               <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-black/5 flex flex-col items-center justify-center transform md:rotate-6 hover:rotate-0 transition-transform duration-500 min-h-[220px]">
                  <div className="w-16 h-16 rounded-2xl bg-pop-3/10 flex items-center justify-center mb-6">
                     <svg className="w-8 h-8 text-pop-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <h3 className="font-heading text-xl text-foreground mb-2">Grow Layers</h3>
                  <p className="text-sm text-foreground/60 text-center">Depth beyond just the exams</p>
               </div>
            </div>

          </div>
        </div>
        
      </div>
    </section>
  );
}
