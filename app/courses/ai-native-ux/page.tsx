"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Terminal, Users, Info } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AINativeUXCoursePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasBadgeFile, setHasBadgeFile] = useState(false);

  useEffect(() => {
    fetch("/figma-partner-badge.svg", { method: "HEAD" })
      .then((res) => {
        if (res.ok) setHasBadgeFile(true);
      })
      .catch(() => setHasBadgeFile(false));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero entrance timeline
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTl
        .fromTo(".hero-eyebrow", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1 })
        .fromTo(".hero-title", { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.4")
        .fromTo(".hero-subhook", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.5")
        .fromTo(".hero-body", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
        .fromTo(".hero-cta", { y: 15, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 }, "-=0.4")
        .fromTo(".hero-visual-card", { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" }, "-=0.6")
        .fromTo(".hero-floating-chip", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "back.out(1.4)" }, "-=0.5");

      // Continuous gentle floating for chips
      gsap.to(".floating-node-1", {
        y: -10,
        x: 4,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".floating-node-2", {
        y: 10,
        x: -4,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.5,
      });

      // ScrollTrigger fade up for sections
      gsap.utils.toArray<HTMLElement>(".animate-section").forEach((section) => {
        gsap.fromTo(
          section,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
            },
          }
        );
      });

      // Staggered cards reveal
      gsap.utils.toArray<HTMLElement>(".stagger-group").forEach((group) => {
        const cards = group.querySelectorAll(".stagger-item");
        gsap.fromTo(
          cards,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: group,
              start: "top 80%",
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#191919] text-[#F6EFD2] font-['Nunito_Sans',sans-serif] selection:bg-[#DB4745] selection:text-white antialiased overflow-x-hidden relative"
    >
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-[55vw] h-[55vw] rounded-full blur-[140px] pointer-events-none -translate-y-1/3 translate-x-1/3 bg-[#DB4745]/10 z-0"></div>
      <div className="absolute top-[35%] left-0 w-[45vw] h-[45vw] rounded-full blur-[140px] pointer-events-none -translate-x-1/3 bg-[#DB4745]/5 z-0"></div>
      <div className="absolute bottom-[20%] right-10 w-[50vw] h-[50vw] rounded-full blur-[150px] pointer-events-none bg-[#DB4745]/10 z-0"></div>

      {/* SECTION 1: HERO (full bleed, charcoal bg) */}
      <section className="w-full relative z-10 pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#333333]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <div className="hero-eyebrow inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] bg-[#262626] border border-[#333333] text-[#DB4745] font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest mb-6 font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#DB4745] animate-pulse"></span>
                The 2026 cohort.
              </div>

              <h1 className="hero-title font-['Ubuntu',sans-serif] text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.08] tracking-tight text-[#F6EFD2] mb-6">
                AI-Native UX Design<span className="text-[#DB4745]">.</span>
              </h1>

              <p className="hero-subhook font-['Ubuntu',sans-serif] text-xl sm:text-2xl font-normal italic text-[#F6EFD2]/90 leading-snug mb-6">
                Everyone's using AI to design. Almost nobody's designing the AI.
              </p>

              <p className="hero-body font-['Nunito_Sans',sans-serif] text-base sm:text-lg text-[#B8B29C] leading-relaxed max-w-xl mb-8">
                A 4-month, fully industry-led weekend cohort that takes you from transitioning in to interview ready, with a live working AI product in your portfolio.
              </p>

              {/* CTAs */}
              <div className="hero-cta flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
                <a
                  href="/courses/ai-native-ux/register"
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-[#DB4745] text-white font-['Ubuntu',sans-serif] font-medium text-sm sm:text-base rounded-[2px] hover:bg-[#E67775] transition-all duration-200 cursor-pointer shadow-md hover:-translate-y-0.5 text-center"
                >
                  Register for the September cohort →
                </a>
                <a
                  href="/downloads/ai-native-ux-brochure.pdf"
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-transparent border border-[#F6EFD2] text-[#F6EFD2] font-['Ubuntu',sans-serif] font-medium text-sm sm:text-base rounded-[2px] hover:bg-[#F6EFD2]/10 transition-all duration-200 cursor-pointer text-center"
                >
                  Download the brochure
                </a>
              </div>

              {/* Meta Quick Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-[#333333] w-full font-['JetBrains_Mono',monospace] text-xs">
                <div>
                  <div className="text-[#B8B29C] uppercase text-[10px]">Duration</div>
                  <div className="text-[#F6EFD2] font-medium mt-1">18 weeks</div>
                </div>
                <div>
                  <div className="text-[#B8B29C] uppercase text-[10px]">Format</div>
                  <div className="text-[#F6EFD2] font-medium mt-1">Live, Sat + Sun</div>
                </div>
                <div>
                  <div className="text-[#B8B29C] uppercase text-[10px]">Cohort Capped</div>
                  <div className="text-[#DB4745] font-medium mt-1">25 seats only</div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Visual & Meta HUD */}
            <div className="lg:col-span-6 relative">
              <div className="hero-visual-card relative rounded-[2px] overflow-hidden border border-[#333333] bg-[#262626] shadow-2xl group">
                <div className="relative h-[320px] sm:h-[380px] w-full overflow-hidden bg-[#111111]">
                  <img
                    src="/assets/ai-native-hero.jpg"
                    alt="AI Native UX Interface Design"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#191919] via-[#191919]/30 to-transparent"></div>

                  <div className="floating-node-1 absolute top-4 left-4 z-20 bg-[#191919]/90 backdrop-blur-md border border-[#333333] px-3.5 py-2 rounded-[2px] shadow-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DB4745] animate-ping"></span>
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-[#F6EFD2]">Live AI Canvas Engine</span>
                  </div>

                  <div className="floating-node-2 absolute bottom-24 right-4 z-20 bg-[#262626]/90 backdrop-blur-md border border-[#DB4745]/40 px-3.5 py-2 rounded-[2px] shadow-lg flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#DB4745]" />
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-[#F6EFD2]">OOUX Mental Models</span>
                  </div>
                </div>

                <div className="p-6 bg-[#262626] border-t border-[#333333] font-['JetBrains_Mono',monospace] text-xs">
                  <div className="text-[#DB4745] uppercase tracking-wider mb-4 pb-2 border-b border-[#333333] flex justify-between items-center">
                    <span>Cohort Metadata</span>
                    <span className="text-[#B8B29C] text-[10px]">Fall 2026 Batch</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                    <div className="flex justify-between border-b border-[#333333]/50 pb-2">
                      <span className="text-[#B8B29C]">Begins</span>
                      <span className="text-[#F6EFD2] font-medium">7 September 2026</span>
                    </div>
                    <div className="flex justify-between border-b border-[#333333]/50 pb-2">
                      <span className="text-[#B8B29C]">Fee</span>
                      <span className="text-[#F6EFD2] font-medium">₹28,000 to ₹40,000</span>
                    </div>
                    <div className="flex justify-between border-b border-[#333333]/50 pb-2">
                      <span className="text-[#B8B29C]">Format</span>
                      <span className="text-[#F6EFD2] font-medium">Live, Online</span>
                    </div>
                    <div className="flex justify-between border-b border-[#333333]/50 pb-2">
                      <span className="text-[#B8B29C]">Seat Cap</span>
                      <span className="text-[#DB4745] font-medium">25 Seats Total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE PROMISE (3-column bento, on charcoal-2 surface) */}
      <section className="animate-section w-full bg-[#262626] py-20 border-b border-[#333333] relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-14">
            <div className="text-[#DB4745] font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest mb-2 font-medium">
              Section 02 · The Promise
            </div>
            <h2 className="font-['Ubuntu',sans-serif] text-3xl sm:text-4xl font-bold text-[#F6EFD2]">
              Three commitments for every learner.
            </h2>
          </div>

          <div className="stagger-group grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stagger-item bg-[#191919] border-t-2 border-[#DB4745] border-x border-b border-[#333333] p-8 rounded-[2px] flex flex-col justify-between hover:border-[#DB4745]/80 hover:-translate-y-1 transition-all duration-300 shadow-md">
              <div>
                <div className="w-10 h-10 rounded-[2px] bg-[#262626] border border-[#333333] flex items-center justify-center text-[#DB4745] mb-6">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="font-['Ubuntu',sans-serif] text-xl font-medium text-[#F6EFD2] mb-4">
                  A real product, shipped.
                </h3>
                <p className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C] leading-relaxed">
                  Your capstone starts week one on a real brief and advances every weekend for four months. By Demo Day you have a live, deployed product with a working AI feature you designed and built.
                </p>
              </div>
            </div>

            <div className="stagger-item bg-[#191919] border-t-2 border-[#DB4745] border-x border-b border-[#333333] p-8 rounded-[2px] flex flex-col justify-between hover:border-[#DB4745]/80 hover:-translate-y-1 transition-all duration-300 shadow-md">
              <div>
                <div className="w-10 h-10 rounded-[2px] bg-[#262626] border border-[#333333] flex items-center justify-center text-[#DB4745] mb-6">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-['Ubuntu',sans-serif] text-xl font-medium text-[#F6EFD2] mb-4">
                  The two AI skills employers hire for.
                </h3>
                <p className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C] leading-relaxed">
                  You'll learn to use AI to design faster, and to design products where AI is the material. Interviewers can tell the difference in one question. By the end of this course, so can you.
                </p>
              </div>
            </div>

            <div className="stagger-item bg-[#191919] border-t-2 border-[#DB4745] border-x border-b border-[#333333] p-8 rounded-[2px] flex flex-col justify-between hover:border-[#DB4745]/80 hover:-translate-y-1 transition-all duration-300 shadow-md">
              <div>
                <div className="w-10 h-10 rounded-[2px] bg-[#262626] border border-[#333333] flex items-center justify-center text-[#DB4745] mb-6">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-['Ubuntu',sans-serif] text-xl font-medium text-[#F6EFD2] mb-4">
                  Industry mentors. Every phase.
                </h3>
                <p className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C] leading-relaxed">
                  A UX researcher teaches research. An AI product designer teaches AI-native patterns. A design engineer sits beside you through build weekend. You're learning from the industry, live, every weekend.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE CURRICULUM (asymmetric bento, 12-column grid) */}
      <section className="animate-section w-full bg-[#191919] py-20 border-b border-[#333333] relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-14">
            <div className="text-[#DB4745] font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest mb-2 font-medium">
              Section 03 · The Curriculum
            </div>
            <h2 className="font-['Ubuntu',sans-serif] text-3xl sm:text-4xl font-bold text-[#F6EFD2]">
              Architected for modern product realities.
            </h2>
          </div>

          <div className="stagger-group grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="stagger-item md:col-span-8 md:row-span-2 bg-[#262626] border border-[#333333] p-8 rounded-[2px] flex flex-col justify-between hover:border-[#333333]/90 transition-all">
              <div>
                <div className="text-[#DB4745] font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider mb-2">
                  Timeline Architecture
                </div>
                <h3 className="font-['Ubuntu',sans-serif] text-2xl sm:text-3xl font-bold text-[#F6EFD2] mb-6">
                  18 weeks. 4 phases. 2 built-in breathers.
                </h3>

                <div className="w-full my-6 bg-[#191919] p-4 sm:p-6 rounded-[2px] border border-[#333333]">
                  <div className="hidden sm:block">
                    <svg viewBox="0 0 700 80" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="20" y1="40" x2="680" y2="40" stroke="#333333" strokeWidth="2" />
                      
                      <rect x="20" y="24" width="120" height="32" rx="2" fill="#262626" stroke="#DB4745" strokeWidth="1.5" />
                      <text x="80" y="44" fill="#F6EFD2" fontSize="11" fontFamily="Ubuntu" textAnchor="middle" dominantBaseline="middle">Phase 01 · Weeks 1–4</text>

                      <line x1="140" y1="40" x2="160" y2="40" stroke="#DB4745" strokeWidth="2" />

                      <rect x="160" y="24" width="120" height="32" rx="2" fill="#262626" stroke="#DB4745" strokeWidth="1.5" />
                      <text x="220" y="44" fill="#F6EFD2" fontSize="11" fontFamily="Ubuntu" textAnchor="middle" dominantBaseline="middle">Phase 02 · Weeks 5–8</text>

                      <line x1="280" y1="40" x2="300" y2="40" stroke="#DB4745" strokeWidth="2" />

                      <rect x="300" y="28" width="80" height="24" rx="2" fill="#191919" stroke="#B8B29C" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="340" y="44" fill="#B8B29C" fontSize="9.5" fontFamily="JetBrains Mono" textAnchor="middle" dominantBaseline="middle">Reset · W9</text>

                      <line x1="380" y1="40" x2="400" y2="40" stroke="#DB4745" strokeWidth="2" />

                      <rect x="400" y="24" width="120" height="32" rx="2" fill="#262626" stroke="#DB4745" strokeWidth="1.5" />
                      <text x="460" y="44" fill="#F6EFD2" fontSize="11" fontFamily="Ubuntu" textAnchor="middle" dominantBaseline="middle">Phase 03 · Weeks 10–13</text>

                      <line x1="520" y1="40" x2="540" y2="40" stroke="#DB4745" strokeWidth="2" />

                      <rect x="540" y="28" width="70" height="24" rx="2" fill="#191919" stroke="#B8B29C" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="575" y="44" fill="#B8B29C" fontSize="9.5" fontFamily="JetBrains Mono" textAnchor="middle" dominantBaseline="middle">Soft · W14</text>

                      <line x1="610" y1="40" x2="620" y2="40" stroke="#DB4745" strokeWidth="2" />

                      <rect x="620" y="24" width="70" height="32" rx="2" fill="#262626" stroke="#DB4745" strokeWidth="1.5" />
                      <text x="655" y="44" fill="#F6EFD2" fontSize="10" fontFamily="Ubuntu" textAnchor="middle" dominantBaseline="middle">P04 · 15–18</text>
                    </svg>
                  </div>

                  <div className="block sm:hidden space-y-2 font-['JetBrains_Mono',monospace] text-xs">
                    <div className="p-2 border border-[#DB4745] bg-[#262626] text-[#F6EFD2] flex justify-between">
                      <span>Phase 01 · Discover</span>
                      <span className="text-[#DB4745]">Weeks 1–4</span>
                    </div>
                    <div className="p-2 border border-[#DB4745] bg-[#262626] text-[#F6EFD2] flex justify-between">
                      <span>Phase 02 · Define & Structure</span>
                      <span className="text-[#DB4745]">Weeks 5–8</span>
                    </div>
                    <div className="p-2 border border-dashed border-[#B8B29C] bg-[#191919] text-[#B8B29C] flex justify-between">
                      <span>Reset Week (Breather)</span>
                      <span>Week 9</span>
                    </div>
                    <div className="p-2 border border-[#DB4745] bg-[#262626] text-[#F6EFD2] flex justify-between">
                      <span>Phase 03 · Design & Build</span>
                      <span className="text-[#DB4745]">Weeks 10–13</span>
                    </div>
                    <div className="p-2 border border-dashed border-[#B8B29C] bg-[#191919] text-[#B8B29C] flex justify-between">
                      <span>Soft Week (Breather)</span>
                      <span>Week 14</span>
                    </div>
                    <div className="p-2 border border-[#DB4745] bg-[#262626] text-[#F6EFD2] flex justify-between">
                      <span>Phase 04 · Validate & Land</span>
                      <span className="text-[#DB4745]">Weeks 15–18</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C] leading-relaxed mt-4">
                The classic Double Diamond was built for static interfaces. Modern AI products require continuous synthesis, rapid prototyping loops, and real-time interaction modeling that evolve with model capabilities.
              </p>
            </div>

            <div className="stagger-item md:col-span-4 bg-[#262626] border border-[#333333] p-6 rounded-[2px] flex flex-col justify-between">
              <div>
                <h3 className="font-['Ubuntu',sans-serif] text-lg font-bold text-[#F6EFD2] mb-3">
                  OOUX as your spine.
                </h3>
                <div className="my-3 py-2 bg-[#191919] px-3 rounded-[2px] border border-[#333333]">
                  <svg viewBox="0 0 260 50" className="w-full h-auto" fill="none">
                    <rect x="5" y="10" width="50" height="28" rx="2" fill="#262626" stroke="#DB4745" strokeWidth="1" />
                    <text x="30" y="27" fill="#F6EFD2" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">Object</text>
                    
                    <line x1="55" y1="24" x2="70" y2="24" stroke="#DB4745" strokeWidth="1" />
                    
                    <rect x="70" y="10" width="50" height="28" rx="2" fill="#262626" stroke="#333333" strokeWidth="1" />
                    <text x="95" y="27" fill="#F6EFD2" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">Relation</text>
                    
                    <line x1="120" y1="24" x2="135" y2="24" stroke="#DB4745" strokeWidth="1" />

                    <rect x="135" y="10" width="55" height="28" rx="2" fill="#262626" stroke="#333333" strokeWidth="1" />
                    <text x="162" y="27" fill="#F6EFD2" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">Attribute</text>

                    <line x1="190" y1="24" x2="205" y2="24" stroke="#DB4745" strokeWidth="1" />

                    <rect x="205" y="10" width="50" height="28" rx="2" fill="#262626" stroke="#DB4745" strokeWidth="1" />
                    <text x="230" y="27" fill="#F6EFD2" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">Action</text>
                  </svg>
                </div>
              </div>
              <p className="font-['Nunito_Sans',sans-serif] text-xs sm:text-sm text-[#B8B29C] leading-relaxed">
                Ground your AI mental models in structured object mapping before generating a single visual screen.
              </p>
            </div>

            <div className="stagger-item md:col-span-4 bg-[#262626] border border-[#333333] p-6 rounded-[2px] flex flex-col justify-between overflow-hidden relative group">
              <div>
                <h3 className="font-['Ubuntu',sans-serif] text-lg font-bold text-[#F6EFD2] mb-3">
                  Real brief. Real users. Real ship.
                </h3>
                
                <div className="my-2 rounded-[2px] overflow-hidden border border-[#333333] relative h-28">
                  <img
                    src="/assets/ai-spec-capstone.jpg"
                    alt="AI Prototype Spec Interface"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[#191919]/40 backdrop-blur-[1px]"></div>
                  <div className="absolute bottom-2 left-2 z-10 font-['JetBrains_Mono',monospace] text-[10px] bg-[#191919]/90 border border-[#DB4745]/40 px-2 py-0.5 rounded-[2px] text-[#F6EFD2]">
                    intent: dynamic_synthesis
                  </div>
                </div>
              </div>
              <p className="font-['Nunito_Sans',sans-serif] text-xs sm:text-sm text-[#B8B29C] leading-relaxed mt-2">
                Define explicit confidence intervals, streaming states, and progressive disclosure for non-deterministic features.
              </p>
            </div>

            <div className="stagger-item md:col-span-3 bg-[#262626] border border-[#333333] p-6 rounded-[2px] flex flex-col justify-center hover:border-[#DB4745]/50 transition-all">
              <div className="font-['Ubuntu',sans-serif] text-4xl sm:text-5xl font-bold text-[#DB4745] mb-1">
                32
              </div>
              <div className="font-['Nunito_Sans',sans-serif] text-sm text-[#F6EFD2] font-medium">
                live sessions
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-xs text-[#B8B29C] mt-2">
                Across 18 weeks
              </div>
            </div>

            <div className="stagger-item md:col-span-3 bg-[#262626] border border-[#333333] p-6 rounded-[2px] flex flex-col justify-center hover:border-[#DB4745]/50 transition-all">
              <div className="font-['Ubuntu',sans-serif] text-4xl sm:text-5xl font-bold text-[#DB4745] mb-1">
                ~90
              </div>
              <div className="font-['Nunito_Sans',sans-serif] text-sm text-[#F6EFD2] font-medium">
                contact hours
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-xs text-[#B8B29C] mt-2">
                Direct mentor instruction
              </div>
            </div>

            <div className="stagger-item md:col-span-6 bg-[#262626] border border-[#333333] p-6 rounded-[2px] flex flex-col justify-center">
              <h3 className="font-['Ubuntu',sans-serif] text-lg font-bold text-[#F6EFD2] mb-2">
                Reset week + Soft week.
              </h3>
              <p className="font-['Nunito_Sans',sans-serif] text-xs sm:text-sm text-[#B8B29C] leading-relaxed">
                Two scheduled breathers give you time to consolidate feedback, debug your prototype, and rest without falling behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE JOURNEY (full-bleed infographic, charcoal bg) */}
      <section className="animate-section w-full bg-[#191919] py-20 border-b border-[#333333]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-14 text-left">
            <div className="text-[#DB4745] font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest mb-2 font-medium">
              Section 04 · The Journey
            </div>
            <h2 className="font-['Ubuntu',sans-serif] text-3xl sm:text-4xl font-bold text-[#F6EFD2]">
              The four progression phases.
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 lg:gap-2">
            <div className="flex-1 bg-[#262626] border border-[#333333] p-5 rounded-[2px] hover:border-[#DB4745]/60 transition-all">
              <div className="font-['JetBrains_Mono',monospace] text-xs text-[#DB4745] font-medium mb-1">
                Phase 01
              </div>
              <div className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] mb-4">
                Discover
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  Research
                </span>
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  Synthesis
                </span>
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  OOUX I
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center w-6 text-[#DB4745]">
              <span className="h-[1px] w-full bg-[#DB4745]"></span>
            </div>
            <div className="lg:hidden flex justify-center py-1 text-[#DB4745]">
              <span className="w-[1px] h-4 bg-[#DB4745]"></span>
            </div>

            <div className="flex-1 bg-[#262626] border border-[#333333] p-5 rounded-[2px] hover:border-[#DB4745]/60 transition-all">
              <div className="font-['JetBrains_Mono',monospace] text-xs text-[#DB4745] font-medium mb-1">
                Phase 02
              </div>
              <div className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] mb-4">
                Define & Structure
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  IA
                </span>
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  Flows
                </span>
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  AI feature spec
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center w-4 text-[#DB4745]">
              <span className="h-[1px] w-full bg-[#DB4745]"></span>
            </div>
            <div className="lg:hidden flex justify-center py-1 text-[#DB4745]">
              <span className="w-[1px] h-4 bg-[#DB4745]"></span>
            </div>

            <div className="bg-[#191919] border border-dashed border-[#B8B29C]/50 p-4 rounded-[2px] text-center min-w-[110px]">
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#B8B29C] uppercase tracking-wider">
                Breather
              </div>
              <div className="font-['Ubuntu',sans-serif] text-xs font-medium text-[#F6EFD2] mt-0.5">
                Reset Week
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center w-4 text-[#DB4745]">
              <span className="h-[1px] w-full bg-[#DB4745]"></span>
            </div>
            <div className="lg:hidden flex justify-center py-1 text-[#DB4745]">
              <span className="w-[1px] h-4 bg-[#DB4745]"></span>
            </div>

            <div className="flex-1 bg-[#262626] border border-[#333333] p-5 rounded-[2px] hover:border-[#DB4745]/60 transition-all">
              <div className="font-['JetBrains_Mono',monospace] text-xs text-[#DB4745] font-medium mb-1">
                Phase 03
              </div>
              <div className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] mb-4">
                Design & Build
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  Visual
                </span>
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  Systems
                </span>
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  Coded prototype
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center w-4 text-[#DB4745]">
              <span className="h-[1px] w-full bg-[#DB4745]"></span>
            </div>
            <div className="lg:hidden flex justify-center py-1 text-[#DB4745]">
              <span className="w-[1px] h-4 bg-[#DB4745]"></span>
            </div>

            <div className="bg-[#191919] border border-dashed border-[#B8B29C]/50 p-4 rounded-[2px] text-center min-w-[110px]">
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#B8B29C] uppercase tracking-wider">
                Breather
              </div>
              <div className="font-['Ubuntu',sans-serif] text-xs font-medium text-[#F6EFD2] mt-0.5">
                Soft Week
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center w-4 text-[#DB4745]">
              <span className="h-[1px] w-full bg-[#DB4745]"></span>
            </div>
            <div className="lg:hidden flex justify-center py-1 text-[#DB4745]">
              <span className="w-[1px] h-4 bg-[#DB4745]"></span>
            </div>

            <div className="flex-1 bg-[#262626] border border-[#333333] p-5 rounded-[2px] hover:border-[#DB4745]/60 transition-all">
              <div className="font-['JetBrains_Mono',monospace] text-xs text-[#DB4745] font-medium mb-1">
                Phase 04
              </div>
              <div className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] mb-4">
                Validate & Land
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  Testing
                </span>
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  A11y
                </span>
                <span className="text-[11px] px-2 py-0.5 border border-[#F6EFD2]/30 text-[#F6EFD2] rounded-[2px] bg-transparent">
                  Portfolio
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FIGMA PARTNERSHIP (full-bleed accent panel) */}
      <section className="animate-section w-full bg-[#191919] py-16 border-b border-[#333333]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="bg-[#262626] border-l-[3px] border-[#DB4745] border-y border-r border-[#333333] p-8 sm:p-10 rounded-[2px] shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex items-center">
                {hasBadgeFile ? (
                  <img
                    src="/figma-partner-badge.svg"
                    alt="Official Figma Education Partner"
                    className="h-10 sm:h-12 w-auto object-contain"
                  />
                ) : (
                  <div className="inline-flex items-center gap-3.5 bg-[#191919] border border-[#333333] px-6 py-4 rounded-[2px] shadow-sm">
                    <svg width="28" height="42" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
                      <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
                      <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
                      <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
                      <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
                    </svg>
                    <div className="flex flex-col">
                      <span className="font-['Inter',sans-serif] font-bold text-xl tracking-tight text-[#F6EFD2]">
                        Figma
                      </span>
                      <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[#DB4745] uppercase tracking-wider font-medium">
                        Education Partner
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-8">
                <h3 className="font-['Ubuntu',sans-serif] text-xl sm:text-2xl font-medium text-[#F6EFD2] mb-3">
                  Official Figma Education Partner.
                </h3>
                <p className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C] leading-relaxed">
                  Every learner gets a complimentary Professional Figma licence for the full cohort. Worth ₹15,000 a year, included in your tuition. Activated the day you enrol, valid until Demo Day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: MENTORS FROM (typographic wall) */}
      <section className="animate-section w-full bg-[#191919] py-20 border-b border-[#333333]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-10 text-left max-w-3xl">
            <div className="text-[#DB4745] font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest mb-2 font-medium">
              Section 06 · Your mentors.
            </div>
            <h2 className="font-['Ubuntu',sans-serif] text-3xl sm:text-4xl font-bold text-[#F6EFD2] mb-4">
              Every phase. Led by the industry.
            </h2>
            <p className="font-['Nunito_Sans',sans-serif] text-base text-[#B8B29C] leading-relaxed">
              Our mentors have shipped work at some of the most influential product companies in the world, and at some of India's most consequential ones. This is the network you're joining.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-y-6 sm:gap-y-8 gap-x-4 py-8 border-y border-[#333333]/60 my-8">
            {["Amazon", "Meta", "Google", "Microsoft", "Walmart"].map((company) => (
              <div
                key={company}
                className="font-['Ubuntu',sans-serif] font-medium text-sm sm:text-base text-[#DB4745] text-center py-2.5 px-2 rounded-[2px] bg-[#262626]/40 border border-transparent hover:border-[#DB4745]/40 transition-all cursor-default"
              >
                {company}
              </div>
            ))}

            {["Atlassian", "IBM", "Samsung", "Salesforce", "JPMorgan Chase"].map((company) => (
              <div
                key={company}
                className="font-['Ubuntu',sans-serif] font-medium text-sm sm:text-base text-[#F6EFD2] text-center py-2.5 px-2 rounded-[2px] bg-[#262626]/20 border border-transparent hover:border-[#333333] transition-all cursor-default"
              >
                {company}
              </div>
            ))}

            {["SAP Labs", "Uber", "ServiceNow", "HILTI", "Fractal"].map((company) => (
              <div
                key={company}
                className="font-['Ubuntu',sans-serif] font-medium text-sm sm:text-base text-[#F6EFD2] text-center py-2.5 px-2 rounded-[2px] bg-[#262626]/20 border border-transparent hover:border-[#333333] transition-all cursor-default"
              >
                {company}
              </div>
            ))}

            {["UIDAI", "ISRO", "Jio", "Unacademy", "Royal Enfield"].map((company) => (
              <div
                key={company}
                className="font-['Ubuntu',sans-serif] font-medium text-sm sm:text-base text-[#DB4745] text-center py-2.5 px-2 rounded-[2px] bg-[#262626]/40 border border-transparent hover:border-[#DB4745]/40 transition-all cursor-default"
              >
                {company}
              </div>
            ))}

            {["Ather", "Rapido", "Zoomcar", "Zynga", "Winzo"].map((company) => (
              <div
                key={company}
                className="font-['Ubuntu',sans-serif] font-medium text-sm sm:text-base text-[#F6EFD2] text-center py-2.5 px-2 rounded-[2px] bg-[#262626]/20 border border-transparent hover:border-[#333333] transition-all cursor-default"
              >
                {company}
              </div>
            ))}

            {["Playshifu", "Aftershoot", "Preimage.ai", "Nextbillion.ai", "OKTAKIDZ"].map((company) => (
              <div
                key={company}
                className="font-['Ubuntu',sans-serif] font-medium text-sm sm:text-base text-[#F6EFD2] text-center py-2.5 px-2 rounded-[2px] bg-[#262626]/20 border border-transparent hover:border-[#333333] transition-all cursor-default"
              >
                {company}
              </div>
            ))}
          </div>

          <p className="font-['Nunito_Sans',sans-serif] text-xs sm:text-sm italic text-[#B8B29C]/80">
            Individual mentors are matched to each phase based on their working expertise.
          </p>
        </div>
      </section>

      {/* SECTION 7: PRICING — FEE PLANS (Updated exactly as attached image) */}
      <section className="animate-section w-full bg-[#191919] py-24 border-b border-[#333333] relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <div className="text-[#DB4745] font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest mb-3 font-medium">
              Section 07 · Investment
            </div>
            <h2 className="font-['Ubuntu',sans-serif] text-4xl sm:text-5xl font-bold text-[#F6EFD2] mb-3 tracking-tight">
              Fee Plans
            </h2>
            <p className="font-['Nunito_Sans',sans-serif] text-base sm:text-lg text-[#B8B29C]">
              Choose the payment option that works best for you
            </p>
          </div>

          {/* FEE PLANS TABLE AS PER USER'S ATTACHED IMAGE */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="overflow-hidden rounded-[2px] border border-[#333333] shadow-2xl bg-[#262626]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0B1B3D] text-[#F6EFD2] border-b border-[#333333] font-['Ubuntu',sans-serif]">
                      <th className="py-4 px-6 text-sm sm:text-base font-bold tracking-wide">Plan</th>
                      <th className="py-4 px-6 text-sm sm:text-base font-bold tracking-wide text-center">Pay in Full</th>
                      <th className="py-4 px-6 text-sm sm:text-base font-bold tracking-wide text-center">2-Part Payment</th>
                      <th className="py-4 px-6 text-sm sm:text-base font-bold tracking-wide text-center">Registration Window</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333333]/70 font-['Nunito_Sans',sans-serif]">
                    {/* Row 1: Founding Cohort (Highlighted) */}
                    <tr className="bg-[#FEF9C3]/10 hover:bg-[#FEF9C3]/15 transition-colors">
                      <td className="py-5 px-6 font-['Ubuntu',sans-serif] font-bold text-[#F6EFD2] text-base sm:text-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xl select-none">🌟</span>
                          <span>Founding Cohort</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 font-['Ubuntu',sans-serif] font-bold text-[#F6EFD2] text-base sm:text-lg text-center">
                        ₹28,000
                      </td>
                      <td className="py-5 px-6 text-[#F6EFD2] font-semibold text-sm sm:text-base text-center">
                        ₹30,000 <span className="text-xs text-[#B8B29C] font-normal">(₹15K × 2)</span>
                      </td>
                      <td className="py-5 px-6 text-[#F6EFD2] text-xs sm:text-sm text-center">
                        <div className="font-medium">Till 7 Sept 2026</div>
                        <div className="text-[#DB4745] text-xs font-semibold">First 8 seats only</div>
                      </td>
                    </tr>

                    {/* Row 2: Early Bird */}
                    <tr className="bg-[#191919] hover:bg-[#262626]/50 transition-colors">
                      <td className="py-5 px-6 font-['Ubuntu',sans-serif] font-bold text-[#F6EFD2] text-base sm:text-lg">
                        Early Bird
                      </td>
                      <td className="py-5 px-6 font-['Ubuntu',sans-serif] font-bold text-[#F6EFD2] text-base sm:text-lg text-center">
                        ₹32,000
                      </td>
                      <td className="py-5 px-6 text-[#F6EFD2] font-semibold text-sm sm:text-base text-center">
                        ₹34,000 <span className="text-xs text-[#B8B29C] font-normal">(₹17K × 2)</span>
                      </td>
                      <td className="py-5 px-6 text-[#B8B29C] text-xs sm:text-sm text-center font-medium">
                        Till 14 Sept 2026
                      </td>
                    </tr>

                    {/* Row 3: Regular */}
                    <tr className="bg-[#191919] hover:bg-[#262626]/50 transition-colors">
                      <td className="py-5 px-6 font-['Ubuntu',sans-serif] font-bold text-[#F6EFD2] text-base sm:text-lg">
                        Regular
                      </td>
                      <td className="py-5 px-6 font-['Ubuntu',sans-serif] font-bold text-[#F6EFD2] text-base sm:text-lg text-center">
                        ₹40,000
                      </td>
                      <td className="py-5 px-6 text-[#F6EFD2] font-semibold text-sm sm:text-base text-center">
                        ₹42,000 <span className="text-xs text-[#B8B29C] font-normal">(₹21K × 2)</span>
                      </td>
                      <td className="py-5 px-6 text-[#B8B29C] text-xs sm:text-sm text-center font-medium">
                        After 14 Sept 2026
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs sm:text-sm text-[#B8B29C]">
              <Info className="w-4 h-4 text-[#DB4745] shrink-0" />
              <span>
                <strong className="text-[#F6EFD2]">Installment terms:</strong> The second installment must be paid within one month of the first payment.
              </span>
            </div>
          </div>

          {/* 3 Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16 items-stretch">
            <div className="bg-[#DB4745]/[0.06] border-2 border-[#DB4745] p-6 rounded-[2px] flex flex-col justify-between relative shadow-lg">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-['JetBrains_Mono',monospace] text-xs text-[#DB4745] font-semibold uppercase">
                    Tier 01
                  </span>
                  <span className="px-2 py-0.5 rounded-[2px] bg-[#DB4745] text-white text-[10px] font-bold uppercase">
                    Best Value
                  </span>
                </div>
                <h3 className="font-['Ubuntu',sans-serif] text-xl font-bold text-[#F6EFD2] mb-2">
                  Founding Cohort
                </h3>
                <div className="font-['Ubuntu',sans-serif] text-3xl font-bold text-[#F6EFD2] mb-1">
                  ₹28,000
                </div>
                <p className="font-['Nunito_Sans',sans-serif] text-xs text-[#B8B29C] mb-3">
                  or 2-part: ₹15,000 × 2 (₹30,000 total)
                </p>
                <p className="font-['Nunito_Sans',sans-serif] text-xs text-[#F6EFD2]/90 leading-relaxed mb-4">
                  First 8 seats only. Closes 7 September 2026.
                </p>
              </div>

              <div>
                <div className="border-t border-[#DB4745]/30 pt-3 mb-4">
                  <p className="font-['Nunito_Sans',sans-serif] text-xs italic text-[#DB4745]">
                    Includes private founding-cohort thread with the programme mentor.
                  </p>
                </div>
                <a
                  href="/courses/ai-native-ux/register"
                  className="w-full inline-flex items-center justify-center py-2.5 bg-[#DB4745] text-white font-['Ubuntu',sans-serif] font-medium text-sm rounded-[2px] hover:bg-[#E67775] transition-all cursor-pointer text-center shadow-sm"
                >
                  Claim founding seat →
                </a>
              </div>
            </div>

            <div className="bg-[#262626] border border-[#333333] p-6 rounded-[2px] flex flex-col justify-between shadow-md">
              <div>
                <div className="font-['JetBrains_Mono',monospace] text-xs text-[#B8B29C] font-semibold uppercase mb-2">
                  Tier 02
                </div>
                <h3 className="font-['Ubuntu',sans-serif] text-xl font-bold text-[#F6EFD2] mb-2">
                  Early Bird
                </h3>
                <div className="font-['Ubuntu',sans-serif] text-3xl font-bold text-[#F6EFD2] mb-1">
                  ₹32,000
                </div>
                <p className="font-['Nunito_Sans',sans-serif] text-xs text-[#B8B29C] mb-3">
                  or 2-part: ₹17,000 × 2 (₹34,000 total)
                </p>
                <p className="font-['Nunito_Sans',sans-serif] text-xs text-[#F6EFD2]/90 leading-relaxed mb-4">
                  Next 12 seats. Closes 14 September 2026.
                </p>
              </div>

              <div>
                <a
                  href="/courses/ai-native-ux/register"
                  className="w-full inline-flex items-center justify-center py-2.5 bg-transparent border border-[#333333] hover:border-[#F6EFD2] text-[#F6EFD2] font-['Ubuntu',sans-serif] font-medium text-sm rounded-[2px] hover:bg-[#F6EFD2]/5 transition-all cursor-pointer text-center"
                >
                  Register early bird →
                </a>
              </div>
            </div>

            <div className="bg-[#262626] border border-[#333333] p-6 rounded-[2px] flex flex-col justify-between shadow-md">
              <div>
                <div className="font-['JetBrains_Mono',monospace] text-xs text-[#B8B29C] font-semibold uppercase mb-2">
                  Tier 03
                </div>
                <h3 className="font-['Ubuntu',sans-serif] text-xl font-bold text-[#F6EFD2] mb-2">
                  Regular
                </h3>
                <div className="font-['Ubuntu',sans-serif] text-3xl font-bold text-[#F6EFD2] mb-1">
                  ₹40,000
                </div>
                <p className="font-['Nunito_Sans',sans-serif] text-xs text-[#B8B29C] mb-3">
                  or 2-part: ₹21,000 × 2 (₹42,000 total)
                </p>
                <p className="font-['Nunito_Sans',sans-serif] text-xs text-[#F6EFD2]/90 leading-relaxed mb-4">
                  Remaining seats. After 14 September 2026.
                </p>
              </div>

              <div>
                <a
                  href="/courses/ai-native-ux/register"
                  className="w-full inline-flex items-center justify-center py-2.5 bg-transparent border border-[#333333] hover:border-[#F6EFD2] text-[#F6EFD2] font-['Ubuntu',sans-serif] font-medium text-sm rounded-[2px] hover:bg-[#F6EFD2]/5 transition-all cursor-pointer text-center"
                >
                  Register regular →
                </a>
              </div>
            </div>
          </div>

          {/* All Tiers Include Section */}
          <div className="border-t border-[#333333] pt-12 max-w-4xl mx-auto">
            <h3 className="font-['Ubuntu',sans-serif] text-xl sm:text-2xl font-medium text-[#F6EFD2] mb-8 text-center sm:text-left">
              All tiers include
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
              <div className="flex items-start gap-3">
                <span className="text-[#DB4745] font-bold text-base leading-none select-none">→</span>
                <span className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C]">
                  32 live weekend sessions across 18 weeks
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#DB4745] font-bold text-base leading-none select-none">→</span>
                <span className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C]">
                  All industry mentor sessions and weekly critique
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#DB4745] font-bold text-base leading-none select-none">→</span>
                <span className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#F6EFD2] font-bold">
                  Professional Figma licence for the full cohort duration (via our Figma Education Partnership)
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#DB4745] font-bold text-base leading-none select-none">→</span>
                <span className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C]">
                  2-week self-paced warm-up before the cohort starts
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#DB4745] font-bold text-base leading-none select-none">→</span>
                <span className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C]">
                  6-week portfolio and job clinic after Demo Day
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#DB4745] font-bold text-base leading-none select-none">→</span>
                <span className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C]">
                  A real capstone brief and Demo Day with hiring managers
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#DB4745] font-bold text-base leading-none select-none">→</span>
                <span className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C]">
                  Access to both bonus electives (Plugins, MCP)
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#DB4745] font-bold text-base leading-none select-none">→</span>
                <span className="font-['Nunito_Sans',sans-serif] text-sm sm:text-base text-[#B8B29C]">
                  Alumni community, for good
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: FAQ (2-column accordion) */}
      <section className="animate-section w-full bg-[#191919] py-20 border-b border-[#333333]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-14 text-left">
            <div className="text-[#DB4745] font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest mb-2 font-medium">
              Section 08 · Questions.
            </div>
            <h2 className="font-['Ubuntu',sans-serif] text-3xl sm:text-4xl font-bold text-[#F6EFD2]">
              The questions people ask before registering.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <details className="group bg-[#262626] border border-[#333333] rounded-[2px] p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all duration-200 hover:border-[#DB4745]/40">
                <summary className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] flex justify-between items-center select-none">
                  <span>I have zero design background. Can I do this?</span>
                  <span className="text-[#DB4745] font-mono text-lg transition-transform duration-200 group-open:rotate-45 ml-4">
                    +
                  </span>
                </summary>
                <div className="mt-4 pt-4 border-t border-[#333333] font-['Nunito_Sans',sans-serif] text-sm text-[#B8B29C] leading-relaxed cursor-text">
                  Yes. The two-week warm-up module introduces design fundamentals, Figma mechanics, and visual hierarchy before the live sessions begin. We assume curiosity and commitment, not prior professional design experience.
                </div>
              </details>

              <details className="group bg-[#262626] border border-[#333333] rounded-[2px] p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all duration-200 hover:border-[#DB4745]/40">
                <summary className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] flex justify-between items-center select-none">
                  <span>Do I need to know how to code?</span>
                  <span className="text-[#DB4745] font-mono text-lg transition-transform duration-200 group-open:rotate-45 ml-4">
                    +
                  </span>
                </summary>
                <div className="mt-4 pt-4 border-t border-[#333333] font-['Nunito_Sans',sans-serif] text-sm text-[#B8B29C] leading-relaxed cursor-text">
                  No coding background is required. While you will build working prototypes using modern AI tools and structured component models, the curriculum focuses on design architecture, logic, and interface intelligence rather than manual software engineering.
                </div>
              </details>

              <details className="group bg-[#262626] border border-[#333333] rounded-[2px] p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all duration-200 hover:border-[#DB4745]/40">
                <summary className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] flex justify-between items-center select-none">
                  <span>What's the time commitment?</span>
                  <span className="text-[#DB4745] font-mono text-lg transition-transform duration-200 group-open:rotate-45 ml-4">
                    +
                  </span>
                </summary>
                <div className="mt-4 pt-4 border-t border-[#333333] font-['Nunito_Sans',sans-serif] text-sm text-[#B8B29C] leading-relaxed cursor-text">
                  Expect 10–12 hours per week. This includes 5–6 hours of live weekend sessions on Saturday and Sunday, alongside 5–6 hours of asynchronous project build time and critique throughout the week.
                </div>
              </details>
            </div>

            <div className="space-y-4">
              <details className="group bg-[#262626] border border-[#333333] rounded-[2px] p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all duration-200 hover:border-[#DB4745]/40">
                <summary className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] flex justify-between items-center select-none">
                  <span>Is this live or recorded?</span>
                  <span className="text-[#DB4745] font-mono text-lg transition-transform duration-200 group-open:rotate-45 ml-4">
                    +
                  </span>
                </summary>
                <div className="mt-4 pt-4 border-t border-[#333333] font-['Nunito_Sans',sans-serif] text-sm text-[#B8B29C] leading-relaxed cursor-text">
                  All core sessions are live and interactive with mentors. Every session is recorded and uploaded to the student portal within 24 hours so you can revisit discussions and demonstrations at your own pace.
                </div>
              </details>

              <details className="group bg-[#262626] border border-[#333333] rounded-[2px] p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all duration-200 hover:border-[#DB4745]/40">
                <summary className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] flex justify-between items-center select-none">
                  <span>Will you place me in a job?</span>
                  <span className="text-[#DB4745] font-mono text-lg transition-transform duration-200 group-open:rotate-45 ml-4">
                    +
                  </span>
                </summary>
                <div className="mt-4 pt-4 border-t border-[#333333] font-['Nunito_Sans',sans-serif] text-sm text-[#B8B29C] leading-relaxed cursor-text">
                  We do not offer artificial placement guarantees. Instead, we run a dedicated 6-week portfolio and interview clinic after Demo Day, connecting you directly with hiring managers who evaluate your working AI capstone.
                </div>
              </details>

              <details className="group bg-[#262626] border border-[#333333] rounded-[2px] p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all duration-200 hover:border-[#DB4745]/40">
                <summary className="font-['Ubuntu',sans-serif] text-base font-medium text-[#F6EFD2] flex justify-between items-center select-none">
                  <span>What if I miss a session?</span>
                  <span className="text-[#DB4745] font-mono text-lg transition-transform duration-200 group-open:rotate-45 ml-4">
                    +
                  </span>
                </summary>
                <div className="mt-4 pt-4 border-t border-[#333333] font-['Nunito_Sans',sans-serif] text-sm text-[#B8B29C] leading-relaxed cursor-text">
                  You will have full access to high-resolution recordings, session notes, and the async community channels. You can also review your capstone progress during mid-week office hours.
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: FINAL CTA (full-bleed, charcoal) */}
      <section className="animate-section w-full bg-[#191919] py-[120px] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-[#DB4745]/15 blur-[120px] pointer-events-none"></div>

        <div className="max-w-[1200px] mx-auto px-6 flex flex-col items-center relative z-10">
          <h2 className="font-['Ubuntu',sans-serif] text-3xl sm:text-5xl lg:text-6xl font-bold text-[#F6EFD2] leading-[1.15] mb-10 max-w-2xl">
            Talent is everywhere.<br />
            Guidance <span className="text-[#DB4745]">isn't</span>.<br />
            That's what we fix.
          </h2>

          <div className="mb-10">
            <a
              href="/courses/ai-native-ux/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#DB4745] text-white font-['Ubuntu',sans-serif] font-medium text-base sm:text-lg rounded-[2px] hover:bg-[#E67775] transition-all duration-200 cursor-pointer shadow-xl hover:-translate-y-1"
            >
              Register for the September cohort →
            </a>
          </div>

          <div className="font-['JetBrains_Mono',monospace] text-xs text-[#B8B29C] space-y-2 uppercase tracking-wider">
            <div>COHORT BEGINS · 7 September 2026</div>
            <div>FOUNDING COHORT CLOSES · 7 September 2026</div>
            <div>EARLY BIRD CLOSES · 14 September 2026</div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS: awaiting real quotes from cohort 1 */}
    </div>
  );
}
