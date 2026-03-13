import { useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Target, MapPin, Briefcase, GraduationCap, CheckCircle2, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "wouter";

gsap.registerPlugin(ScrollTrigger);

export default function Mentorship() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      // Fade up animation for sections
      gsap.utils.toArray('.animate-section').forEach((section: any) => {
        gsap.fromTo(section,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col" ref={containerRef}>
      <Navbar />
      
      <main className="flex-1 relative z-10 pt-20">
        
        {/* SECTION 1: HERO */}
        <section className="relative min-h-[85vh] flex items-center pt-24 pb-16 overflow-hidden bg-background">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-medium text-foreground/80 uppercase tracking-widest mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Mentorship Tracks
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-[64px] font-heading leading-[1.1] text-[#262626] mb-6">
                  Find the mentorship path that fits your next step
                </h1>
                
                <p className="text-lg md:text-xl text-foreground/70 mb-10 leading-relaxed font-light">
                  Focused guidance for design admissions, portfolios, interviews, and early career preparation — built for aspirants, students, and emerging designers.
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                  <Button size="lg" className="h-14 px-8 rounded-full text-base btn-bold w-full sm:w-auto shadow-lg shadow-primary/20 hover:-translate-y-1 transition-transform" onClick={() => document.getElementById('admissions')?.scrollIntoView({ behavior: 'smooth' })}>
                    Explore Admissions Tracks
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base bg-white w-full sm:w-auto hover:bg-foreground hover:text-white transition-colors" onClick={() => document.getElementById('job-prep')?.scrollIntoView({ behavior: 'smooth' })}>
                    Explore Job Preparation
                  </Button>
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-sm text-foreground/50 font-medium">
                  <span>Admissions guidance</span>
                  <span className="opacity-30">•</span>
                  <span>Portfolio support</span>
                  <span className="opacity-30">•</span>
                  <span>Interview readiness</span>
                </div>
              </div>
              
              <div className="relative h-[400px] lg:h-[550px] w-full hidden md:block rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* Floating cards */}
                <div className="absolute bottom-8 left-8 right-8 flex gap-4">
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl flex-1 border border-white/20 shadow-lg translate-y-4 hover:-translate-y-1 transition-transform">
                    <GraduationCap className="w-6 h-6 text-primary mb-2" />
                    <div className="text-sm font-bold text-foreground">Admissions</div>
                    <div className="text-xs text-foreground/60 mt-1">B.Des / M.Des</div>
                  </div>
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl flex-1 border border-white/20 shadow-lg translate-y-0 hover:-translate-y-1 transition-transform">
                    <Briefcase className="w-6 h-6 text-pop-1 mb-2" />
                    <div className="text-sm font-bold text-foreground">Careers</div>
                    <div className="text-xs text-foreground/60 mt-1">Portfolios & Jobs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTRO STRIP */}
        <section className="bg-[#111111] text-white py-20 relative animate-section overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-heading leading-tight mb-6 font-light">
              Different goals need different kinds of mentorship.
            </h2>
            <div className="w-20 h-1 bg-primary/50 mx-auto mb-8"></div>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed">
              Designforge Mentorship Tracks help you choose the support that matches where you are — and where you want to go next.
            </p>
          </div>
        </section>

        {/* SECTION 3: WHAT THIS PAGE COVERS */}
        <section className="py-24 md:py-32 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
              <div className="md:col-span-5">
                <div className="text-primary font-mono text-xs uppercase tracking-widest mb-4">The Context</div>
                <h2 className="text-4xl lg:text-5xl font-heading text-[#262626] leading-tight md:sticky md:top-32">
                  Choose by outcome, not by confusion
                </h2>
              </div>
              
              <div className="md:col-span-7 prose prose-lg">
                <p className="text-2xl text-[#262626] font-light leading-relaxed mb-8">
                  This page brings together Designforge's core mentorship pathways across:
                </p>
                <ul className="space-y-4 mb-12 list-none pl-0">
                  {[
                    "Design admissions (NID, IITs)",
                    "Private and international applications",
                    "Portfolio and interview preparation",
                    "Internship and job readiness"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0"></div>
                      <span className="text-foreground/80 font-medium text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pl-6 border-l-2 border-black/10">
                  <p className="text-xl text-foreground/60 font-medium italic m-0">
                    The idea is simple: help learners find the right kind of support without navigating scattered guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: MAIN TRACK SPLIT */}
        <section className="py-24 bg-white border-y border-black/5 animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Track 1 */}
              <div className="bg-background rounded-3xl p-8 md:p-12 border border-black/5 flex flex-col h-full group hover:border-primary/20 transition-colors duration-500">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                
                <div className="text-xs font-mono tracking-widest text-primary uppercase mb-3">Track 1</div>
                <h3 className="text-3xl md:text-4xl font-heading text-[#262626] mb-4">Admissions Mentorship</h3>
                
                <p className="text-foreground/70 mb-8 leading-relaxed font-light text-lg">
                  For students preparing for B.Des and M.Des admissions across top Indian, private, and international design pathways.
                </p>
                
                <div className="mb-10 flex-1">
                  <div className="text-sm font-bold uppercase tracking-wider text-foreground/40 mb-4">Includes</div>
                  <ul className="space-y-3">
                    {[
                      "NID / IITs",
                      "B.Des / M.Des",
                      "Private design colleges",
                      "Abroad applications",
                      "Portfolio and interview support"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-foreground/80 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-primary/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button className="w-full h-14 rounded-xl text-base btn-bold bg-foreground hover:bg-primary transition-colors" onClick={() => document.getElementById('admissions')?.scrollIntoView({ behavior: 'smooth' })}>
                  Explore Admissions Mentorship
                </Button>
              </div>

              {/* Track 2 */}
              <div className="bg-background rounded-3xl p-8 md:p-12 border border-black/5 flex flex-col h-full group hover:border-pop-1/20 transition-colors duration-500">
                <div className="w-14 h-14 rounded-full bg-pop-1/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Briefcase className="w-6 h-6 text-pop-1" />
                </div>
                
                <div className="text-xs font-mono tracking-widest text-pop-1 uppercase mb-3">Track 2</div>
                <h3 className="text-3xl md:text-4xl font-heading text-[#262626] mb-4">Job Preparation</h3>
                
                <p className="text-foreground/70 mb-8 leading-relaxed font-light text-lg">
                  For design students and early professionals preparing for internships, placements, interviews, and portfolio presentation.
                </p>
                
                <div className="mb-10 flex-1">
                  <div className="text-sm font-bold uppercase tracking-wider text-foreground/40 mb-4">Includes</div>
                  <ul className="space-y-3">
                    {[
                      "Portfolio reviews",
                      "Case study refinement",
                      "Mock interviews",
                      "Communication support",
                      "Career direction"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-foreground/80 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-pop-1/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button className="w-full h-14 rounded-xl text-base btn-bold bg-foreground hover:bg-pop-1 transition-colors" onClick={() => document.getElementById('job-prep')?.scrollIntoView({ behavior: 'smooth' })}>
                  Explore Job Preparation
                </Button>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 5: ADMISSIONS MENTORSHIP */}
        <section id="admissions" className="py-24 md:py-32 bg-background animate-section scroll-mt-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-16">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-6">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-4">Admissions pathways we support</h2>
              <p className="text-lg text-foreground/60 max-w-2xl font-light">Comprehensive guidance tailored to the specific demands of leading design institutions.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {[
                {
                  title: "NID / IITs — B.Des",
                  desc: "Preparation support for NID DAT, UCEED, studio tests, and interview rounds with focus on creativity, observation, and presentation.",
                  color: "border-primary/20 hover:border-primary",
                  bg: "bg-primary/5 text-primary"
                },
                {
                  title: "NID / IITs — M.Des",
                  desc: "Mentorship for NID M.Des, CEED, portfolios, and interviews with stronger emphasis on articulation, process, and maturity.",
                  color: "border-pop-1/20 hover:border-pop-1",
                  bg: "bg-pop-1/5 text-pop-1"
                },
                {
                  title: "Private Design Colleges",
                  desc: "Support for college-specific applications, creative tests, portfolios, and interviews across leading private design institutes.",
                  color: "border-pop-2/20 hover:border-pop-2",
                  bg: "bg-pop-2/5 text-pop-2"
                },
                {
                  title: "Abroad Applications",
                  desc: "Guidance for design school applications abroad, including portfolio direction, statements, presentation, and interview readiness.",
                  color: "border-pop-3/20 hover:border-pop-3",
                  bg: "bg-pop-3/5 text-pop-3"
                }
              ].map((pathway, i) => (
                <div key={i} className={`p-8 bg-white rounded-2xl border ${pathway.color} transition-colors duration-300 group cursor-default shadow-sm hover:shadow-md`}>
                  <div className={`w-10 h-10 rounded-full ${pathway.bg} flex items-center justify-center font-bold font-mono mb-6`}>
                    0{i+1}
                  </div>
                  <h3 className="text-2xl font-heading text-[#262626] mb-3 group-hover:text-primary transition-colors">{pathway.title}</h3>
                  <p className="text-foreground/70 font-light leading-relaxed">{pathway.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-xl md:text-2xl font-heading italic text-[#262626] max-w-3xl mx-auto">
                "The goal is not just to apply widely — but to apply with more clarity and intent."
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: JOB PREPARATION */}
        <section id="job-prep" className="py-24 md:py-32 bg-white border-t border-black/5 animate-section scroll-mt-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              
              <div className="lg:col-span-5 order-2 lg:order-1">
                <div className="bg-background rounded-3xl p-8 md:p-10 border border-black/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pop-1/10 rounded-bl-full -z-0"></div>
                  
                  <div className="relative z-10">
                    <Target className="w-10 h-10 text-pop-1 mb-6" />
                    <h4 className="text-2xl font-heading text-[#262626] mb-4">Areas covered:</h4>
                    <ul className="space-y-4 mb-0">
                      {[
                        "Portfolio refinement",
                        "UX / product case study storytelling",
                        "Visual presentation",
                        "Mock interviews",
                        "Communication and self-introduction",
                        "Internship and job readiness"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-foreground/80 font-medium">
                          <CheckCircle2 className="w-5 h-5 text-pop-1/60 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-7 order-1 lg:order-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pop-1/10 mb-6">
                  <Briefcase className="w-6 h-6 text-pop-1" />
                </div>
                <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-6">Job preparation track</h2>
                <p className="text-xl text-foreground/70 mb-8 font-light leading-relaxed max-w-2xl">
                  Built for learners who want to present themselves better and become more industry-ready.
                </p>
                
                <div className="pl-6 border-l-4 border-pop-1/30 py-2">
                  <p className="text-lg text-[#262626] font-medium m-0 max-w-xl leading-relaxed">
                    This track is especially useful for students moving from learning to applying — and for early professionals looking to sharpen how they present their work.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* SECTION 7: HOW MENTORSHIP WORKS */}
        <section className="py-24 md:py-32 bg-background border-t border-black/5 animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-16 text-center">How mentorship works</h2>
            
            <div className="relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-border/80 z-0"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative z-10">
                {[
                  {
                    step: "01",
                    title: "Understand",
                    desc: "We begin with your goal, stage, and direction.",
                    color: "bg-primary/10 text-primary",
                    border: "border-primary/20"
                  },
                  {
                    step: "02",
                    title: "Guide",
                    desc: "You get track-specific guidance and relevant feedback.",
                    color: "bg-pop-1/10 text-pop-1",
                    border: "border-pop-1/20"
                  },
                  {
                    step: "03",
                    title: "Improve",
                    desc: "You refine through critique, practice, and iteration.",
                    color: "bg-pop-2/10 text-pop-2",
                    border: "border-pop-2/20"
                  },
                  {
                    step: "04",
                    title: "Move Forward",
                    desc: "You prepare with more clarity, confidence, and structure.",
                    color: "bg-pop-3/10 text-pop-3",
                    border: "border-pop-3/20"
                  }
                ].map((item, i) => (
                  <div key={i} className="relative flex flex-col md:items-center md:text-center group">
                    <div className={`w-24 h-24 rounded-full bg-white border ${item.border} flex items-center justify-center mb-6 relative z-10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:shadow-md`}>
                      <span className={`text-2xl font-heading ${item.color.split(' ')[1]}`}>{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#262626] mb-3">{item.title}</h3>
                    <p className="text-foreground/70 font-light leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-center text-lg text-foreground/60 mt-20 max-w-2xl mx-auto italic">
              Each track is designed to be focused, practical, and easier to act on.
            </p>
          </div>
        </section>

        {/* SECTION 8: WHO CAN JOIN */}
        <section className="py-24 bg-white border-y border-black/5 animate-section">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="bg-foreground text-white rounded-[2rem] p-8 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
                <div className="md:col-span-4">
                  <h2 className="text-3xl md:text-4xl font-heading mb-6">Who can join</h2>
                  <div className="w-12 h-1 bg-primary/80"></div>
                </div>
                
                <div className="md:col-span-8">
                  <p className="text-xl font-light text-white/80 mb-8">These mentorship tracks are designed for:</p>
                  <ul className="space-y-4">
                    {[
                      "design aspirants preparing for B.Des or M.Des",
                      "students applying to private or international design colleges",
                      "learners building portfolios and interview confidence",
                      "design students preparing for internships or jobs",
                      "early professionals seeking direction and stronger presentation"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-white/90 text-lg">
                        <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-1" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: FINAL CTA */}
        <section className="py-32 bg-background text-center animate-section relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-4xl max-h-4xl bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-[64px] font-heading leading-[1.1] mb-8 text-[#262626]">
              Choose the mentorship that <br className="hidden md:block" /> matches your next move
            </h2>
            
            <p className="text-lg md:text-xl text-foreground/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Whether you are preparing for admissions or stepping toward internships and jobs, Designforge Mentorship Tracks are built to help you move forward with stronger direction and confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full text-base btn-bold shadow-[0_0_40px_-10px_rgba(255,107,107,0.5)]">
                Explore Admissions Mentorship
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full text-base bg-white border-black/10 hover:bg-foreground hover:text-white backdrop-blur-sm">
                Explore Job Preparation
              </Button>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 rounded-full text-base text-foreground/70 hover:text-foreground hover:bg-black/5">
                Talk to Us
              </Button>
            </div>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
}