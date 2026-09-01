import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle2, Sparkles, Terminal, Users, Info, Calendar, Clock } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CohortLeadModal } from "@/components/cohort-lead-modal";

gsap.registerPlugin(ScrollTrigger);

export function AINativeUXContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadModalContext, setLeadModalContext] = useState<string>("Founding Cohort");

  const handleOpenLead = (context: string) => {
    setLeadModalContext(context);
    setIsLeadModalOpen(true);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero entrance
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .fromTo(".hero-eyebrow", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.15 })
        .fromTo(".hero-title", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, "-=0.35")
        .fromTo(".hero-subhook", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.5")
        .fromTo(".hero-body", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
        .fromTo(".hero-cta-group", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.3")
        .fromTo(".hero-image-wrap", { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" }, "-=0.6")
        .fromTo(".hero-meta", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.4");

      // ScrollTrigger fade up for sections
      gsap.utils.toArray<HTMLElement>(".animate-section").forEach((section) => {
        gsap.fromTo(
          section,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 85%" },
          }
        );
      });

      // Staggered card groups
      gsap.utils.toArray<HTMLElement>(".stagger-group").forEach((group) => {
        const items = group.querySelectorAll(".stagger-item");
        gsap.fromTo(
          items,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: { trigger: group, start: "top 80%" },
          }
        );
      });

      // Marquee
      gsap.to(".marquee-content", {
        xPercent: -50,
        ease: "none",
        duration: 22,
        repeat: -1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col selection:bg-primary selection:text-white" ref={containerRef}>
      <Navbar />

      <CohortLeadModal
        open={isLeadModalOpen}
        onOpenChange={setIsLeadModalOpen}
        context={leadModalContext}
      />

      <main className="flex-1 relative z-10">

        {/* ──────── SECTION 1: HERO ──────── */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background pt-24 pb-16">
          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
              {/* Left */}
              <div className="w-full lg:w-1/2 text-left">
                <div className="hero-eyebrow inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-medium text-foreground/80 uppercase tracking-widest mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  The 2026 cohort
                </div>

                <h1 className="hero-title text-4xl md:text-5xl lg:text-[72px] font-heading leading-[1.1] text-[#262626] mb-6">
                  AI-Native UX{" "}
                  <span className="relative inline-block">
                    Design.
                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/30 z-[-1]" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                  </span>
                </h1>

                <p className="hero-subhook text-xl md:text-2xl text-foreground/70 font-heading italic mb-6 leading-snug max-w-xl">
                  Everyone's using AI to design. Almost nobody's designing the AI.
                </p>

                <p className="hero-body text-lg text-foreground/60 mb-8 max-w-xl leading-relaxed">
                  A 4-month, fully industry-led weekend cohort that takes you from transitioning in to interview ready, with a live working AI product in your portfolio.
                </p>

                <div className="hero-cta-group flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                  <Button
                    size="lg"
                    onClick={() => handleOpenLead("Founding Cohort")}
                    className="h-14 px-8 rounded-full text-base btn-bold w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    Register for the September cohort
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleOpenLead("Brochure Download")}
                    className="h-14 px-8 rounded-full text-base bg-white w-full sm:w-auto border-black/10 hover:bg-white hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    Download the brochure
                  </Button>
                </div>

                <div className="hero-meta flex flex-wrap items-center gap-y-2 gap-x-3 text-sm text-foreground/60 font-medium">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> 18 weeks, live weekends</div>
                  <span className="opacity-30 hidden sm:inline-block">•</span>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> 25 seats only</div>
                  <span className="opacity-30 hidden lg:inline-block">•</span>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Starts 7 Sept 2026</div>
                </div>
              </div>

              {/* Right: Hero Image */}
              <div className="w-full lg:w-1/2 relative animate-section">
                <div className="hero-image-wrap relative">
                  <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-black/5">
                    <img
                      src="/assets/ai-native-hero.png"
                      alt="AI-Native UX Design course illustration"
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  {/* Floating badges */}
                  <div className="absolute -top-4 -left-4 bg-white px-4 py-3 rounded-2xl shadow-lg border border-black/5 flex items-center gap-3 z-20 animate-[bounce_6s_ease-in-out_infinite]">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-foreground/50 font-medium">Format</div>
                      <div className="text-sm font-semibold text-foreground">Live + Online</div>
                    </div>
                  </div>

                  <div className="absolute -bottom-4 -right-4 bg-white px-4 py-3 rounded-2xl shadow-lg border border-black/5 flex items-center gap-3 z-20 animate-[bounce_7s_ease-in-out_infinite_1s]">
                    <div className="w-8 h-8 rounded-full bg-pop-1/10 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-pop-1" />
                    </div>
                    <div>
                      <div className="text-xs text-foreground/50 font-medium">Capstone</div>
                      <div className="text-sm font-semibold text-foreground">Ship a real product</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──────── INTRO STRIP ──────── */}
        <section className="bg-foreground text-white py-14 overflow-hidden relative animate-section">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
          <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading leading-tight mb-4 font-light">
              Everyone's using AI to design. Almost nobody's designing the AI. This course teaches you both.
            </h2>
            <div className="inline-flex flex-wrap items-center justify-center gap-2 text-primary/90 font-medium w-full">
              <span className="w-8 h-px bg-primary/50 hidden sm:block"></span>
              4 months. Industry mentors. A real AI product in your portfolio.
              <span className="w-8 h-px bg-primary/50 hidden sm:block"></span>
            </div>
          </div>

          <div className="mt-10 overflow-hidden flex w-full relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-foreground to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-foreground to-transparent z-10"></div>
            <div className="marquee-content flex whitespace-nowrap gap-8 text-white/20 font-heading text-4xl md:text-6xl uppercase tracking-widest w-fit">
              <span>AI-NATIVE</span> <span className="text-primary/30">•</span>
              <span>UX DESIGN</span> <span className="text-primary/30">•</span>
              <span>OOUX</span> <span className="text-primary/30">•</span>
              <span>MENTORSHIP</span> <span className="text-primary/30">•</span>
              <span>CAPSTONE</span> <span className="text-primary/30">•</span>
              <span>AI-NATIVE</span> <span className="text-primary/30">•</span>
              <span>UX DESIGN</span> <span className="text-primary/30">•</span>
              <span>OOUX</span> <span className="text-primary/30">•</span>
              <span>MENTORSHIP</span> <span className="text-primary/30">•</span>
              <span>CAPSTONE</span> <span className="text-primary/30">•</span>
            </div>
          </div>
        </section>

        {/* ──────── SECTION 2: THE PROMISE ──────── */}
        <section className="py-24 md:py-32 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-primary font-mono text-xs uppercase tracking-widest mb-4">The Promise</div>
              <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-6">Three commitments for every learner.</h2>
            </div>

            <div className="stagger-group grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Terminal,
                  color: "text-primary",
                  bg: "bg-primary/10",
                  border: "border-primary/20",
                  title: "A real product, shipped.",
                  body: "Your capstone starts week one on a real brief and advances every weekend for four months. By Demo Day you have a live, deployed product with a working AI feature you designed and built.",
                },
                {
                  icon: Sparkles,
                  color: "text-pop-1",
                  bg: "bg-pop-1/10",
                  border: "border-pop-1/20",
                  title: "The two AI skills employers hire for.",
                  body: "You'll learn to use AI to design faster, and to design products where AI is the material. Interviewers can tell the difference in one question. By the end of this course, so can you.",
                },
                {
                  icon: Users,
                  color: "text-pop-2",
                  bg: "bg-pop-2/10",
                  border: "border-pop-2/20",
                  title: "Industry mentors. Every phase.",
                  body: "A UX researcher teaches research. An AI product designer teaches AI-native patterns. A design engineer sits beside you through build weekend. You're learning from the industry, live, every weekend.",
                },
              ].map((card, i) => (
                <div key={i} className={`stagger-item bg-white rounded-3xl p-8 border ${card.border} flex flex-col gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 shadow-sm`}>
                  <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <h3 className="text-xl font-heading text-[#262626]">{card.title}</h3>
                  <p className="text-foreground/70 leading-relaxed text-[15px]">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──────── SECTION 3: THE CURRICULUM ──────── */}
        <section className="py-24 bg-white border-y border-black/5 animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
              <div className="md:col-span-5 flex flex-col justify-start">
                <div className="text-primary font-mono text-xs uppercase tracking-widest mb-4">The Curriculum</div>
                <h2 className="text-4xl lg:text-5xl font-heading text-[#262626] leading-tight sticky top-32">
                  Architected for modern product realities.
                </h2>
              </div>
              <div className="md:col-span-7 prose prose-lg">
                <p className="text-2xl text-[#262626] font-light leading-relaxed mb-8">
                  18 weeks. 4 phases. 2 built-in breathers.
                </p>
                <p className="text-foreground/70 mb-8">
                  The classic Double Diamond was built for static interfaces. Modern AI products require continuous synthesis, rapid prototyping loops, and real-time interaction modeling that evolve with model capabilities.
                </p>
                <ul className="space-y-4 mb-12 list-none pl-0">
                  {[
                    "32 live weekend sessions across 18 weeks",
                    "~90 contact hours of direct mentor instruction",
                    "OOUX-grounded information architecture",
                    "Real brief. Real users. Real ship.",
                    "Two scheduled breathers for consolidation and rest",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0"></div>
                      <span className="text-foreground/80 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pl-6 border-l-2 border-primary/30">
                  <p className="text-xl text-[#262626] font-heading italic m-0">
                    Ground your AI mental models in structured object mapping before generating a single visual screen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──────── SECTION 4: THE JOURNEY ──────── */}
        <section className="py-24 md:py-32 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-16 text-center">The four progression phases.</h2>

            <div className="relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-border/80 z-0"></div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative z-10">
                {[
                  { step: "01", title: "Discover", desc: "Research, synthesis, and OOUX foundations. Start with the brief.", color: "bg-primary/10 text-primary", border: "border-primary/20", tags: ["Research", "Synthesis", "OOUX I"] },
                  { step: "02", title: "Define & Structure", desc: "IA, flows, and AI feature specs. Structure before screens.", color: "bg-pop-1/10 text-pop-1", border: "border-pop-1/20", tags: ["IA", "Flows", "AI feature spec"] },
                  { step: "03", title: "Design & Build", desc: "Visual systems, coded prototypes, and build weekends.", color: "bg-pop-2/10 text-pop-2", border: "border-pop-2/20", tags: ["Visual", "Systems", "Coded prototype"] },
                  { step: "04", title: "Validate & Land", desc: "Testing, accessibility, portfolio polish, and Demo Day.", color: "bg-pop-3/10 text-pop-3", border: "border-pop-3/20", tags: ["Testing", "A11y", "Portfolio"] },
                ].map((phase, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className={`w-24 h-24 rounded-full bg-white border-2 ${phase.border} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500 z-10 relative`}>
                      <div className={`w-20 h-20 rounded-full ${phase.color} flex items-center justify-center font-heading text-2xl`}>
                        {phase.step}
                      </div>
                    </div>
                    <h3 className="text-2xl font-heading text-[#262626] mb-3">{phase.title}</h3>
                    <p className="text-foreground/70 leading-relaxed text-sm md:text-base px-2 mb-4">{phase.desc}</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {phase.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-background border border-black/5 rounded-full text-xs text-foreground/70 font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Breather indicators */}
              <div className="hidden md:flex justify-around mt-8 max-w-3xl mx-auto text-center">
                <div className="flex items-center gap-2 text-xs text-foreground/40 font-mono uppercase tracking-wider">
                  <span className="w-8 h-px bg-border"></span>Reset week after Phase 02<span className="w-8 h-px bg-border"></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/40 font-mono uppercase tracking-wider">
                  <span className="w-8 h-px bg-border"></span>Soft week after Phase 03<span className="w-8 h-px bg-border"></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──────── SECTION 5: FIGMA PARTNERSHIP ──────── */}
        <section className="py-20 bg-white border-y border-black/5 animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="md:w-1/3 flex justify-center">
                <div className="bg-background rounded-3xl p-8 border border-black/5 shadow-sm flex items-center justify-center">
                  <img
                    src="/assets/figma-logo.png"
                    alt="Official Figma Education Partner"
                    className="h-24 w-auto object-contain"
                  />
                </div>
              </div>
              <div className="md:w-2/3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Education Partner
                </div>
                <h3 className="text-2xl md:text-3xl font-heading text-[#262626] mb-4">
                  Official Figma Education Partner.
                </h3>
                <p className="text-foreground/70 text-lg leading-relaxed mb-6">
                  Every learner gets a complimentary Professional Figma licence for the full cohort. Worth ₹15,000 a year, included in your cohort fee. Activated the day you enrol, valid until Demo Day.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Free Pro licence", "Full cohort duration", "Worth ₹15,000/year"].map((tag) => (
                    <span key={tag} className="px-4 py-2 bg-background border border-black/5 rounded-full text-sm text-foreground/80 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──────── SECTION 6: MENTORS FROM ──────── */}
        <section className="py-24 md:py-32 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="text-primary font-mono text-xs uppercase tracking-widest mb-4">Your mentors</div>
              <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-6">Every phase. Led by the industry.</h2>
              <p className="text-foreground/70 text-lg">
                Our mentors have shipped work at some of the most influential product companies in the world, and at some of India's most consequential ones.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-5xl mx-auto mb-8">
              {[
                "Amazon", "Meta", "Google", "Microsoft", "Walmart",
                "Atlassian", "IBM", "Samsung", "Salesforce", "JPMorgan Chase",
                "SAP Labs", "Uber", "ServiceNow", "HILTI", "Fractal",
                "UIDAI", "ISRO", "Jio", "Unacademy", "Royal Enfield",
                "Ather", "Rapido", "Zoomcar", "Zynga", "Winzo",
                "Playshifu", "Aftershoot", "Preimage.ai", "Nextbillion.ai", "OKTAKIDZ",
              ].map((company, i) => (
                <span
                  key={company}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default ${
                    i < 5 || (i >= 15 && i < 20)
                      ? "bg-primary/5 text-primary border-primary/20 hover:border-primary/40"
                      : "bg-white text-foreground/80 border-black/5 hover:border-black/15"
                  }`}
                >
                  {company}
                </span>
              ))}
            </div>

            <p className="text-center text-foreground/50 italic font-medium text-sm">
              Individual mentors are matched to each phase based on their working expertise.
            </p>
          </div>
        </section>

        {/* ──────── SECTION 7: FEE PLANS ──────── */}
        <section className="py-24 md:py-32 bg-white border-y border-black/5 animate-section">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="text-primary font-mono text-xs uppercase tracking-widest mb-4">Investment</div>
              <h2 className="text-4xl md:text-5xl font-heading text-[#262626] mb-4">Fee Plans</h2>
              <p className="text-foreground/70 text-lg">Choose the payment option that works best for you.</p>
            </div>

            {/* Tier Cards */}
            <div className="stagger-group grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Founding */}
              <div className="stagger-item bg-primary/[0.04] rounded-3xl p-8 border-2 border-primary/20 flex flex-col justify-between relative shadow-sm hover:shadow-xl transition-all duration-500">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-primary font-bold uppercase tracking-wider font-mono">Tier 01</span>
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">Best Value</span>
                  </div>
                  <h3 className="text-2xl font-heading text-[#262626] mb-2">Founding Cohort</h3>
                  <div className="text-3xl font-heading font-bold text-[#262626] mb-1">₹28,000</div>
                  <p className="text-foreground/60 text-sm mb-3">or 2-part: ₹15,000 × 2 (₹30,000 total)</p>
                  <p className="text-foreground/70 text-sm leading-relaxed mb-6">First 8 seats only. Closes 7 September 2026.</p>
                </div>
                <div>
                  <div className="border-t border-primary/15 pt-4 mb-5">
                    <p className="text-sm italic text-primary font-medium">Includes private founding-cohort thread with the programme mentor.</p>
                  </div>
                  <Button
                    onClick={() => handleOpenLead("Founding Cohort")}
                    className="w-full h-12 rounded-2xl text-base btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] transition-all cursor-pointer"
                  >
                    Claim founding seat <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Early Bird */}
              <div className="stagger-item bg-white rounded-3xl p-8 border border-black/5 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500">
                <div>
                  <div className="text-xs text-foreground/50 font-bold uppercase tracking-wider font-mono mb-4">Tier 02</div>
                  <h3 className="text-2xl font-heading text-[#262626] mb-2">Early Bird</h3>
                  <div className="text-3xl font-heading font-bold text-[#262626] mb-1">₹32,000</div>
                  <p className="text-foreground/60 text-sm mb-3">or 2-part: ₹17,000 × 2 (₹34,000 total)</p>
                  <p className="text-foreground/70 text-sm leading-relaxed mb-6">Next 12 seats. Closes 14 September 2026.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleOpenLead("Early Bird")}
                  className="w-full h-12 rounded-2xl text-base bg-white border-black/10 hover:bg-background hover:text-foreground shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  Register early bird <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Regular */}
              <div className="stagger-item bg-white rounded-3xl p-8 border border-black/5 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500">
                <div>
                  <div className="text-xs text-foreground/50 font-bold uppercase tracking-wider font-mono mb-4">Tier 03</div>
                  <h3 className="text-2xl font-heading text-[#262626] mb-2">Regular</h3>
                  <div className="text-3xl font-heading font-bold text-[#262626] mb-1">₹40,000</div>
                  <p className="text-foreground/60 text-sm mb-3">or 2-part: ₹21,000 × 2 (₹42,000 total)</p>
                  <p className="text-foreground/70 text-sm leading-relaxed mb-6">Remaining seats. After 14 September 2026.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleOpenLead("Regular")}
                  className="w-full h-12 rounded-2xl text-base bg-white border-black/10 hover:bg-background hover:text-foreground shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  Register regular <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-16 text-sm text-foreground/60">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong className="text-foreground/80">Installment terms:</strong> The second installment must be paid within one month of the first payment.
              </span>
            </div>

            {/* All Tiers Include */}
            <div className="bg-background rounded-3xl p-8 md:p-12 border border-black/5">
              <h3 className="text-2xl font-heading text-[#262626] mb-8">All tiers include</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                {[
                  "32 live weekend sessions across 18 weeks",
                  "All industry mentor sessions and weekly critique",
                  "Professional Figma licence for the full cohort duration",
                  "2-week self-paced warm-up before the cohort starts",
                  "6-week portfolio and job clinic after Demo Day",
                  "A real capstone brief and Demo Day with hiring managers",
                  "Access to both bonus electives (Plugins, MCP)",
                  "Alumni community, for good",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span className={`text-sm sm:text-base ${i === 2 ? "text-[#262626] font-semibold" : "text-foreground/70"}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ──────── SECTION 8: FAQ ──────── */}
        <section className="py-24 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-4">Frequently asked questions</h2>
              <p className="text-foreground/60 text-lg">The questions people ask before registering.</p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "I have zero design background. Can I do this?",
                  a: "Yes. The two-week warm-up module introduces design fundamentals, Figma mechanics, and visual hierarchy before the live sessions begin. We assume curiosity and commitment, not prior professional design experience.",
                },
                {
                  q: "Do I need to know how to code?",
                  a: "No coding background is required. While you will build working prototypes using modern AI tools and structured component models, the curriculum focuses on design architecture, logic, and interface intelligence rather than manual software engineering.",
                },
                {
                  q: "What's the time commitment?",
                  a: "Expect 10–12 hours per week. This includes 5–6 hours of live weekend sessions on Saturday and Sunday, alongside 5–6 hours of asynchronous project build time and critique throughout the week.",
                },
                {
                  q: "Is this live or recorded?",
                  a: "All core sessions are live and interactive with mentors. Every session is recorded and uploaded to the student portal within 24 hours so you can revisit discussions and demonstrations at your own pace.",
                },
                {
                  q: "Will you place me in a job?",
                  a: "We do not offer artificial placement guarantees. Instead, we run a dedicated 6-week portfolio and interview clinic after Demo Day, connecting you directly with hiring managers who evaluate your working AI capstone.",
                },
                {
                  q: "What if I miss a session?",
                  a: "You will have full access to high-resolution recordings, session notes, and the async community channels. You can also review your capstone progress during mid-week office hours.",
                },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-black/5 px-2 last:border-0">
                  <AccordionTrigger className="text-left font-medium text-[#262626] hover:text-primary hover:no-underline transition-colors py-5 text-base md:text-lg">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/70 leading-relaxed pb-6 text-base pr-8">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ──────── SECTION 9: FINAL CTA ──────── */}
        <section className="pt-24 pb-32 bg-background text-[#262626] text-center animate-section relative z-10 overflow-hidden border-t border-black/5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-4xl bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

          <div className="container mx-auto px-4 max-w-4xl relative z-20">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading leading-[1.1] mb-8">
              Talent is everywhere. <br />
              <span className="text-primary italic">Guidance isn't.</span> <br />
              That's what we fix.
            </h2>

            <p className="text-lg md:text-xl text-foreground/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Whether you're transitioning into UX, levelling up your AI design skills, or building a portfolio that lands interviews, this course is built to support that journey.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                size="lg"
                onClick={() => handleOpenLead("September Cohort Registration")}
                className="w-full sm:w-auto h-14 px-8 rounded-full text-base btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Register for the September cohort
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleOpenLead("Brochure Download")}
                className="w-full sm:w-auto h-14 px-8 rounded-full text-base bg-white border-black/10 hover:bg-white hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Download the brochure
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-xs md:text-sm text-foreground/40 font-mono tracking-widest uppercase">
              <span>Cohort begins · 7 Sept 2026</span>
              <span className="w-1 h-1 rounded-full bg-black/20"></span>
              <span>Founding closes · 7 Sept 2026</span>
              <span className="w-1 h-1 rounded-full bg-black/20"></span>
              <span>Early bird closes · 14 Sept 2026</span>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default function AINativeUXPage() {
  return <AINativeUXContent />;
}
