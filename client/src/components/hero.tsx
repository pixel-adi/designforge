import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import sketchbookImg from '@assets/Gemini_Generated_Image_ofmjymofmjymofmj-removebg-preview_1773229141541.png';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }});
      
      tl.fromTo(".hero-badge", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1 })
        .fromTo(".hero-title", { y: 20, opacity: 0, rotateX: -5 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.8 }, "-=0.4")
        .fromTo(".hero-desc", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.5")
        .fromTo(".hero-btn", { y: 15, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 }, "-=0.4")
        .fromTo(".hero-image", { opacity: 0, scale: 0.95, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 1, ease: "power2.out" }, "-=0.6")
        .fromTo(".hero-sketchbook", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "back.out(1.5)" }, "-=0.8")
        .fromTo(".hero-card", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)" }, "-=0.6");

      // Continuous fluid animation for shapes
      gsap.to(".shape-1", {
        y: -40, x: 30, rotation: 15,
        duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut"
      });
      gsap.to(".shape-2", {
        y: 50, x: -30, rotation: -20,
        duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1
      });
      gsap.to(".shape-3", {
        scale: 1.15, rotation: 10,
        duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5
      });

      // Gentle floating animation for cards
      gsap.to(".hero-card", {
        y: "-=12",
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.2,
          from: "random"
        }
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
    <section ref={containerRef} className="pt-16 pb-32 relative bg-background overflow-hidden perspective-1000">
      
      {/* Soft abstract background blur */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-pop-3/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        
        <div className="max-w-4xl mx-auto flex flex-col items-center mt-16">
          <div className="relative inline-block">
            {/* Decorative Sketchbook */}
            <div className="hero-sketchbook absolute -top-16 left-1/2 -translate-x-1/2 w-24 md:w-28 z-30 opacity-100 pointer-events-none">
              <img src={sketchbookImg} alt="Design Sketchbook" className="w-full h-auto drop-shadow-md" />
            </div>
            
            <div className="hero-badge relative inline-flex items-center gap-2 px-5 py-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-full text-sm font-medium text-foreground mb-10 shadow-sm z-20 mt-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              A new era of design preparation
            </div>
          </div>
          
          <h1 className="hero-title font-heading mb-8 tracking-tight transform-style-3d font-medium text-[48px] md:text-[64px] lg:text-[72px] leading-[1.1] text-[#262626]">
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
        <div className="hero-image-container w-full mt-24 relative flex justify-center z-20">
          <div className="hero-image relative w-full min-h-[400px] md:min-h-[500px] bg-white/40 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex items-center justify-center p-6 md:p-12">
            
            {/* Abstract fluid shapes inside the glass container - Reduced scale and opacity */}
            <div className="shape-1 organic-blob absolute top-[10%] left-[5%] w-20 h-20 md:w-[9rem] md:h-[9rem] bg-pop-1/30 mix-blend-multiply filter blur-xl opacity-[22%]"></div>
            <div className="shape-2 organic-blob absolute bottom-[10%] right-[5%] w-24 h-24 md:w-[10rem] md:h-[10rem] bg-pop-2/20 mix-blend-multiply filter blur-xl opacity-[22%]"></div>
            <div className="shape-3 organic-blob absolute top-1/4 left-1/4 w-28 h-28 md:w-[11rem] md:h-[11rem] bg-pop-3/20 mix-blend-multiply filter blur-xl opacity-[22%]"></div>

            {/* Foreground crisp elements */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 w-full mt-4 md:mt-8">
               
               <div className="hero-card bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-black/5 flex flex-col items-center justify-center transform md:translate-y-4 md:-rotate-12 hover:rotate-0 hover:translate-y-0 transition-all duration-500 min-h-[220px]">
                  <div className="w-14 h-14 rounded-2xl bg-pop-1/10 flex items-center justify-center mb-4">
                     <svg className="w-7 h-7 text-pop-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h3 className="font-heading text-lg text-foreground mb-2">Build Value</h3>
                  <p className="text-xs text-foreground/60 text-center">Focus on creating real impact</p>
               </div>
               
               <div className="hero-card bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-black/5 flex flex-col items-center justify-center transform md:-translate-y-12 md:rotate-6 hover:rotate-0 hover:-translate-y-16 transition-all duration-500 min-h-[220px]">
                  <div className="w-14 h-14 rounded-2xl bg-pop-2/10 flex items-center justify-center mb-4">
                     <svg className="w-7 h-7 text-pop-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </div>
                  <h3 className="font-heading text-lg text-foreground mb-2">Think Different</h3>
                  <p className="text-xs text-foreground/60 text-center">Break traditional patterns</p>
               </div>
               
               <div className="hero-card bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-black/5 flex flex-col items-center justify-center transform md:translate-y-8 md:scale-110 md:-rotate-3 z-20 hover:scale-[1.15] hover:-translate-y-4 hover:rotate-0 transition-all duration-500 min-h-[240px]">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-5 rotate-6">
                     <svg className="w-8 h-8 text-primary -rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  </div>
                  <h3 className="font-heading text-xl text-foreground mb-2">Gain Clarity</h3>
                  <p className="text-xs text-foreground/60 text-center">Mentorship over coaching</p>
               </div>

               <div className="hero-card bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-black/5 flex flex-col items-center justify-center transform md:-translate-y-16 md:rotate-12 hover:rotate-0 hover:-translate-y-20 transition-all duration-500 min-h-[220px]">
                  <div className="w-14 h-14 rounded-2xl bg-pop-3/10 flex items-center justify-center mb-4">
                     <svg className="w-7 h-7 text-pop-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <h3 className="font-heading text-lg text-foreground mb-2">Grow Layers</h3>
                  <p className="text-xs text-foreground/60 text-center">Depth beyond just exams</p>
               </div>

               <div className="hero-card bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-black/5 flex flex-col items-center justify-center transform md:translate-y-2 md:-rotate-8 hover:rotate-0 hover:-translate-y-2 transition-all duration-500 min-h-[220px]">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                     <svg className="w-7 h-7 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <h3 className="font-heading text-lg text-foreground mb-2">Lead Future</h3>
                  <p className="text-xs text-foreground/60 text-center">Become an industry leader</p>
               </div>
               
            </div>

          </div>
        </div>
        
      </div>
    </section>
  );
}
