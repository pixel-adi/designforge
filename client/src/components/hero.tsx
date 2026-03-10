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
        <div className="hero-image-container w-full max-w-5xl mt-24 relative flex justify-center hero-image">
          <div className="relative w-full aspect-[21/9] md:aspect-[21/8] bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex items-center justify-center p-8">
            
            {/* Abstract fluid shapes inside the glass container */}
            <div className="shape-1 organic-blob absolute top-[10%] left-[20%] w-64 h-64 bg-pop-1/80 mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="shape-2 organic-blob absolute bottom-[10%] right-[20%] w-72 h-72 bg-pop-2/60 mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="shape-3 organic-blob absolute top-[30%] left-[40%] w-80 h-80 bg-pop-3/60 mix-blend-multiply filter blur-xl opacity-70"></div>

            {/* Foreground crisp elements */}
            <div className="relative z-10 grid grid-cols-3 gap-6 md:gap-10 w-full max-w-3xl">
               <div className="bg-white/90 backdrop-blur rounded-3xl p-6 shadow-xl border border-white flex flex-col items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                  <div className="w-16 h-16 rounded-full bg-pop-1/20 flex items-center justify-center mb-4">
                     <div className="w-8 h-8 rounded-full bg-pop-1"></div>
                  </div>
                  <div className="w-20 h-2 bg-black/10 rounded-full mb-2"></div>
                  <div className="w-12 h-2 bg-black/10 rounded-full"></div>
               </div>
               
               <div className="bg-white/90 backdrop-blur rounded-3xl p-6 shadow-xl border border-white flex flex-col items-center justify-center transform translate-y-8 scale-110 z-20">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 rotate-12">
                     <div className="w-10 h-10 rounded-lg bg-primary -rotate-12"></div>
                  </div>
                  <div className="w-24 h-2.5 bg-black/10 rounded-full mb-3"></div>
                  <div className="w-16 h-2.5 bg-black/10 rounded-full mb-2"></div>
                  <div className="w-20 h-2.5 bg-black/10 rounded-full"></div>
               </div>

               <div className="bg-white/90 backdrop-blur rounded-3xl p-6 shadow-xl border border-white flex flex-col items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-500">
                  <div className="w-16 h-16 rounded-full bg-pop-3/20 flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 text-pop-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <div className="w-16 h-2 bg-black/10 rounded-full mb-2"></div>
                  <div className="w-20 h-2 bg-black/10 rounded-full"></div>
               </div>
            </div>

          </div>
        </div>
        
      </div>
    </section>
  );
}
