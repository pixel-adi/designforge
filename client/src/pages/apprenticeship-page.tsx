import { useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, ArrowUpRight, CheckCircle2, CircleDashed, Globe, HeartHandshake, Layers, Lightbulb, MapPin, MonitorPlay, MousePointerClick, Puzzle, Sparkles, TerminalSquare, Users } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ApprenticeshipPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Basic GSAP animations for sections
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.animate-section').forEach((section: any) => {
        gsap.fromTo(section, 
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
            }
          }
        );
      });
      
      // Marquee animation
      gsap.to('.marquee-content', {
        xPercent: -50,
        ease: 'none',
        duration: 20,
        repeat: -1,
      });

    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col selection:bg-primary selection:text-white" ref={containerRef}>
      <Navbar />
      
      <main className="flex-1 relative z-10 pt-20">
        
        {/* SECTION 1: HERO */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background pt-24 pb-12">
          {/* Ambient Background Elements */}
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-medium text-foreground/80 uppercase tracking-widest mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Apprenticeship
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-[72px] font-heading leading-[1.1] text-[#262626] mb-6">
                Learn with mentors. <br/>
                <span className="relative inline-block mt-2">
                  Build with industry exposure.
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/30 z-[-1]" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
                
                <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-xl leading-relaxed">
                  A practical learning initiative for students, aspirants, and early professionals looking to grow through workshops, industry-ready programs, internships, and guided mentorship.
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                  <Button size="lg" className="h-14 px-8 rounded-full text-base btn-bold w-full sm:w-auto shadow-lg shadow-primary/20 hover:-translate-y-1 transition-transform">
                    Explore Opportunities
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base bg-white w-full sm:w-auto hover:bg-foreground hover:text-white transition-colors">
                    Join Upcoming Workshops
                  </Button>
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-sm text-foreground/60 font-medium">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Industry-ready learning</div>
                  <span className="opacity-30 hidden sm:inline-block">•</span>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Mentor-led growth</div>
                  <span className="opacity-30 hidden lg:inline-block">•</span>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Community-driven impact</div>
                </div>
              </div>
              
              {/* Right Visual Collage Removed for Single Column Layout */}
            </div>
        </section>

        {/* SECTION 2: INTRO STRIP */}
        <section className="bg-foreground text-white py-16 overflow-hidden relative animate-section">
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
          
          <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading leading-tight mb-6 font-light">
              Designforge Apprenticeship brings together learning, practice, mentorship, industry exposure, and social impact into one evolving ecosystem.
            </h2>
            <div className="inline-flex flex-wrap items-center justify-center gap-2 text-primary/90 font-medium w-full">
              <span className="w-8 h-px bg-primary/50 hidden sm:block"></span>
              Built to help learners move from curiosity to capability.
              <span className="w-8 h-px bg-primary/50 hidden sm:block"></span>
            </div>
          </div>
          
          {/* Marquee */}
          <div className="mt-12 overflow-hidden flex w-full relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-foreground to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-foreground to-transparent z-10"></div>
            
            <div className="marquee-content flex whitespace-nowrap gap-8 text-white/20 font-heading text-4xl md:text-6xl uppercase tracking-widest w-fit">
              <span>WORKSHOPS</span> <span className="text-primary/30">•</span> 
              <span>INTERNSHIPS</span> <span className="text-primary/30">•</span> 
              <span>MENTORSHIP</span> <span className="text-primary/30">•</span> 
              <span>PRACTICE</span> <span className="text-primary/30">•</span> 
              <span>EXPOSURE</span> <span className="text-primary/30">•</span>
              <span>WORKSHOPS</span> <span className="text-primary/30">•</span> 
              <span>INTERNSHIPS</span> <span className="text-primary/30">•</span> 
              <span>MENTORSHIP</span> <span className="text-primary/30">•</span> 
              <span>PRACTICE</span> <span className="text-primary/30">•</span> 
              <span>EXPOSURE</span> <span className="text-primary/30">•</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: WHAT IT IS (Editorial) */}
        <section className="py-24 md:py-32 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
              <div className="md:col-span-5 flex flex-col justify-start">
                <div className="text-primary font-mono text-xs uppercase tracking-widest mb-4">The Foundation</div>
                <h2 className="text-4xl lg:text-5xl font-heading text-[#262626] leading-tight sticky top-32">
                  What is the Designforge Apprenticeship?
                </h2>
              </div>
              <div className="md:col-span-7 prose prose-lg">
                <p className="text-2xl text-[#262626] font-light leading-relaxed mb-8">
                  It is a practical bridge between learning and real-world design exposure.
                </p>
                <p className="text-foreground/70 mb-8">
                  We believe that design cannot be mastered through lectures alone. It requires guided practice, constructive feedback, and the opportunity to apply skills to meaningful problems. Through this initiative, we create:
                </p>
                <ul className="space-y-4 mb-12 list-none pl-0">
                  {[
                    "Industry-ready programs",
                    "Guided workshops and masterclasses",
                    "Internship-style collaborative opportunities",
                    "Mentor-led critique sessions",
                    "Interdisciplinary learning experiences"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-2 w-2 h-2 rounded-full bg-pop-1 shrink-0"></div>
                      <span className="text-foreground/80 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pl-6 border-l-2 border-primary/30">
                  <p className="text-xl text-[#262626] font-heading italic m-0">
                    The goal is simple — help learners build stronger skills, better thinking, and more confidence in applying design meaningfully.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: FOCUS AREAS */}
        <section className="py-24 bg-white border-y border-black/5 animate-section overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-6">What learners explore</h2>
              <p className="text-lg text-foreground/70">
                The apprenticeship spans both foundational and emerging areas of design.
              </p>
            </div>
            
            {/* Visual Chips */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-5xl mx-auto mb-16">
              {[
                { name: "Design Thinking", icon: Lightbulb, color: "text-primary", bg: "bg-primary/5", border: "hover:border-primary/30" },
                { name: "UX Design", icon: MousePointerClick, color: "text-pop-1", bg: "bg-pop-1/5", border: "hover:border-pop-1/30" },
                { name: "Visual Design", icon: Layers, color: "text-pop-2", bg: "bg-pop-2/5", border: "hover:border-pop-2/30" },
                { name: "Critical Thinking", icon: Puzzle, color: "text-pop-3", bg: "bg-pop-3/5", border: "hover:border-pop-3/30" },
                { name: "IoT & Emerging Interfaces", icon: MonitorPlay, color: "text-secondary", bg: "bg-secondary/5", border: "hover:border-secondary/30" },
                { name: "Game Design", icon: CircleDashed, color: "text-primary", bg: "bg-primary/5", border: "hover:border-primary/30" },
              ].map((topic, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-full bg-white border border-black/5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default ${topic.border}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${topic.bg} flex items-center justify-center shrink-0`}>
                    <topic.icon className={`w-4 h-4 md:w-5 md:h-5 ${topic.color}`} />
                  </div>
                  <span className="font-medium text-[#262626] whitespace-nowrap text-sm md:text-base">{topic.name}</span>
                </div>
              ))}
            </div>
            
            <p className="text-center text-foreground/60 max-w-2xl mx-auto italic font-medium px-4">
              The focus is not only on tools, but on how learners think, frame, and solve problems through design.
            </p>
          </div>
        </section>

        {/* SECTION 5: HOW IT WORKS (4-Step Timeline) */}
        <section className="py-24 md:py-32 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-16 text-center">How the experience works</h2>
            
            <div className="relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-border/80 z-0"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative z-10">
                {[
                  {
                    step: "01",
                    title: "Learn",
                    desc: "Mentor-led sessions, workshops, and guided exposure to design domains.",
                    color: "bg-primary/10 text-primary",
                    border: "border-primary/20"
                  },
                  {
                    step: "02",
                    title: "Practice",
                    desc: "Applied exercises, creative exploration, and feedback loops.",
                    color: "bg-pop-1/10 text-pop-1",
                    border: "border-pop-1/20"
                  },
                  {
                    step: "03",
                    title: "Build",
                    desc: "Project-based learning, skill development, and portfolio-worthy outcomes.",
                    color: "bg-pop-2/10 text-pop-2",
                    border: "border-pop-2/20"
                  },
                  {
                    step: "04",
                    title: "Grow",
                    desc: "Industry exposure, internship pathways, and stronger confidence for future opportunities.",
                    color: "bg-pop-3/10 text-pop-3",
                    border: "border-pop-3/20"
                  }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className={`w-24 h-24 rounded-full bg-white border-2 ${item.border} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500 z-10 relative`}>
                      <div className={`w-20 h-20 rounded-full ${item.color} flex items-center justify-center font-heading text-2xl`}>
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-2xl font-heading text-[#262626] mb-3">{item.title}</h3>
                    <p className="text-foreground/70 leading-relaxed text-sm md:text-base px-2">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: INDUSTRY TRAINING COLLABORATIONS */}
        <section className="py-24 bg-white border-y border-black/5 animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-5/12">
                <h2 className="text-3xl md:text-4xl font-heading text-[#262626] mb-6">Built with industry relevance</h2>
                <div className="w-12 h-1 bg-primary mb-8"></div>
                <p className="text-foreground/70 mb-6 text-lg">
                  Designforge also works toward industry training collaborations that bring learners closer to how design is practiced in real environments.
                </p>
                <p className="text-foreground/70 mb-6">This may include:</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {["Collaborative workshops", "Expert sessions", "Studio-led discussions", "Project-based learning", "Review & critique spaces", "Internship-linked exposure"].map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-background border border-black/5 rounded-md text-sm text-foreground/80 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="font-medium text-[#262626] italic border-l-2 border-primary/30 pl-4 py-1">
                  The aim is to make learning more applied, current, and connected to industry.
                </p>
              </div>
              
              <div className="lg:w-7/12 w-full">
                <div className="bg-background rounded-3xl p-8 md:p-12 border border-black/5 shadow-sm text-center">
                  <div className="text-xs uppercase tracking-widest text-foreground/40 font-mono mb-10">Collaborators & Partners</div>
                  
                  {/* Placeholder Logo Carousel Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 items-center opacity-60 mix-blend-luminosity">
                    {/* Placeholder logos using divs */}
                    <div className="h-10 flex items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                      <div className="text-xl font-heading font-bold text-foreground">STUDIO_A</div>
                    </div>
                    <div className="h-10 flex items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                      <div className="text-xl font-heading font-bold text-foreground italic">ProductCorp</div>
                    </div>
                    <div className="h-10 flex items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                      <div className="text-xl font-heading font-bold text-foreground tracking-tighter">STARTUP_X</div>
                    </div>
                    <div className="h-10 flex items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                      <div className="text-xl font-heading font-bold text-foreground">DesignLabs</div>
                    </div>
                    <div className="h-10 flex items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                      <div className="text-xl font-heading font-bold text-foreground italic">EduPartner</div>
                    </div>
                    <div className="h-10 flex items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                      <div className="text-xl font-heading font-bold text-foreground">AGENCY<span className="font-light">CO</span></div>
                    </div>
                  </div>
                  
                  <div className="mt-12 pt-6 border-t border-black/5 text-xs text-foreground/40 font-mono uppercase">
                    Showcasing only verified associations
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: COMMUNITY SERVICE / SOCIAL IMPACT */}
        <section className="py-24 animate-section bg-[#111111] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
          
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center">
              
              {/* Image Side */}
              <div className="w-full md:w-1/2">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80" 
                    alt="Community workshop" 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm font-medium text-white/90">Community Access</div>
                  </div>
                </div>
              </div>
              
              {/* Text Side */}
              <div className="w-full md:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white/80 uppercase tracking-widest mb-6">
                  Social Impact
                </div>
                
                <h2 className="text-3xl md:text-5xl font-heading leading-tight mb-8">
                  Design awareness beyond access barriers
                </h2>
                
                <p className="text-white/70 text-lg mb-6 leading-relaxed font-light">
                  We explore community-led initiatives to bring design awareness and problem-solving exposure to tribal and remote areas.
                </p>
                
                <blockquote className="border-l-2 border-primary pl-6 py-2 bg-white/5 rounded-r-lg mb-8">
                  <p className="text-lg font-heading text-white/90 leading-snug">
                    "Design is not only about careers — it is also about access and empowerment."
                  </p>
                </blockquote>
              </div>
              
            </div>
          </div>
        </section>

        {/* SECTION 8: UPCOMING SESSIONS */}
        <section className="py-24 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-4">Upcoming sessions & workshops</h2>
                <p className="text-foreground/70 text-lg">A glimpse into the kinds of learning experiences being built through the apprenticeship ecosystem.</p>
              </div>
              <Button variant="outline" className="hidden md:flex rounded-full px-6 h-12 bg-white hover:bg-foreground hover:text-white transition-colors">
                Join Upcoming Workshops <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Featured Session */}
              <div className="lg:col-span-5 flex flex-col h-full">
                <div className="bg-primary/5 border border-primary/20 text-[#262626] rounded-3xl p-8 md:p-10 flex flex-col h-full relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 min-h-[350px]">
                  <div className="inline-flex px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium w-fit mb-8 text-primary border border-primary/20">
                    Featured Workshop
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-heading leading-tight mb-4 mt-auto">
                    Design Thinking for Real-World Problem Solving
                  </h3>
                  
                  <p className="text-foreground/70 mb-10 font-light leading-relaxed text-base">
                    Learn how to identify real problems, frame opportunities, and build better ideas through design thinking.
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-black/5 pt-6 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-foreground/60 font-medium">
                      <MapPin className="w-4 h-4" /> Virtual & Studio
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* List */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {[
                  {
                    title: "UX Foundations for Beginners",
                    desc: "Intro to users, flows, interfaces, and usability.",
                    tag: "Fundamentals",
                    textColor: "text-pop-1"
                  },
                  {
                    title: "Critical Thinking for Creative Learners",
                    desc: "Build observation, reasoning, and stronger design decisions.",
                    tag: "Thinking",
                    textColor: "text-pop-2"
                  },
                  {
                    title: "Visual Design Essentials",
                    desc: "Learn hierarchy, typography, layout, and communication.",
                    tag: "Craft",
                    textColor: "text-pop-3"
                  },
                  {
                    title: "IoT and Future Experiences",
                    desc: "Explore connected products and emerging interactions.",
                    tag: "Emerging Tech",
                    textColor: "text-secondary"
                  },
                  {
                    title: "Introduction to Game Design Thinking",
                    desc: "Understand systems, engagement, and storytelling.",
                    tag: "Interactive",
                    textColor: "text-primary"
                  }
                ].map((ws, i) => (
                  <div key={i} className="bg-white p-5 md:p-6 rounded-2xl border border-black/5 hover:border-black/15 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm hover:shadow-md cursor-pointer">
                    <div>
                      <div className={`text-xs font-medium mb-1.5 uppercase tracking-wider ${ws.textColor}`}>{ws.tag}</div>
                      <h4 className="text-lg md:text-xl font-heading text-[#262626] mb-1 group-hover:text-primary transition-colors">{ws.title}</h4>
                      <p className="text-sm text-foreground/60 leading-relaxed">{ws.desc}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                       <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-white p-6 rounded-2xl border border-dashed border-black/15">
                  <p className="text-sm text-foreground/60 italic mb-4 sm:mb-0 text-center sm:text-left">
                    More workshops, mentor sessions, and collaborative learning opportunities will be announced soon.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:hidden mt-8 text-center">
              <Button variant="outline" className="rounded-full px-6 h-14 text-base bg-white w-full shadow-sm">
                Join Upcoming Workshops
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 9: WHO THIS IS FOR & WHY IT MATTERS */}
        <section className="py-24 md:py-32 bg-white animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              
              {/* Who can join */}
              <div className="order-2 lg:order-1">
                <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-6">Who can join</h2>
                <div className="w-12 h-1 bg-primary mb-8"></div>
                <p className="text-foreground/70 mb-8 text-lg">This initiative is designed for:</p>
                
                <div className="space-y-4">
                  {[
                    "Students exploring design seriously",
                    "Aspirants and young creatives",
                    "Early professionals expanding their skillset",
                    "Institutions introducing design awareness",
                    "Communities seeking creative learning exposure"
                  ].map((aud, i) => (
                    <div key={i} className="flex items-center gap-4 bg-background px-6 py-4 rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                      <span className="font-medium text-[#262626] text-base">{aud}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Why this matters */}
              <div className="flex flex-col justify-center order-1 lg:order-2">
                <div className="bg-[#111111] text-white p-10 md:p-14 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden">
                  {/* Decorative quotes */}
                  <div className="absolute top-0 right-0 text-[15rem] font-heading leading-none text-white/[0.03] -translate-y-16 translate-x-8 select-none">
                    "
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-heading mb-8 relative z-10">Why this matters</h2>
                  <p className="text-white/80 text-lg mb-8 font-light relative z-10">
                    Today, learners need more than information. They need:
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mb-12 relative z-10">
                    {["Direction", "Exposure", "Practice", "Feedback", "Confidence"].map((need, i) => (
                      <span key={i} className="px-5 py-2.5 bg-white/10 rounded-full text-white/90 text-sm font-medium border border-white/5 backdrop-blur-sm shadow-sm">
                        {need}
                      </span>
                    ))}
                  </div>
                  
                  <div className="w-full h-px bg-gradient-to-r from-white/20 to-transparent mb-8 relative z-10"></div>
                  
                  <p className="text-xl md:text-2xl font-heading text-white relative z-10 leading-relaxed">
                    Designforge Apprenticeship is built to support that journey with learning that feels more practical, connected, and future-ready.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </section>


        {/* SECTION 12: FINAL CTA */}
        <section className="pt-24 pb-32 bg-background text-[#262626] text-center animate-section relative z-10 overflow-hidden border-t border-black/5">
          {/* Subtle lighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-4xl max-h-4xl bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
          
          <div className="container mx-auto px-4 max-w-4xl relative z-20">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading leading-[1.1] mb-8">
              Learn with intent. <br/>
              <span className="text-primary italic">Build with exposure.</span> <br/>
              Grow with purpose.
            </h2>
            
            <p className="text-lg md:text-xl text-foreground/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Whether you want to explore design, gain practical exposure, or be part of a wider mission of design awareness and impact, the Designforge Apprenticeship is built to support that journey.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full text-base btn-bold shadow-[0_0_40px_-10px_rgba(255,107,107,0.5)]">
                Apply for Apprenticeship
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full text-base bg-white border-black/10 hover:bg-foreground hover:text-white backdrop-blur-sm">
                Join Upcoming Workshops
              </Button>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 rounded-full text-base text-foreground/70 hover:text-foreground hover:bg-black/5">
                Partner With Us
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-xs md:text-sm text-foreground/40 font-mono tracking-widest uppercase">
              <span>Practical learning</span> 
              <span className="w-1 h-1 rounded-full bg-black/20"></span> 
              <span>Mentor-led growth</span> 
              <span className="w-1 h-1 rounded-full bg-black/20"></span> 
              <span>Design awareness</span>
            </div>
          </div>
        </section>

        {/* SECTION 12: FAQ (Moved to end) */}
        <section className="py-24 bg-background animate-section border-t border-black/5">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-4">Frequently asked questions</h2>
              <p className="text-foreground/60 text-lg">Everything you need to know about the apprenticeship.</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "What is the Designforge Apprenticeship?",
                  a: "It is a practical learning initiative that combines programs, workshops, mentorship, internship exposure, and community-led design awareness."
                },
                {
                  q: "Who is it for?",
                  a: "It is for students, aspirants, early professionals, and institutions or communities interested in design learning."
                },
                {
                  q: "Does this include internships?",
                  a: "Yes, depending on the format, the initiative may include internship-style or project-based learning opportunities."
                },
                {
                  q: "What topics are covered?",
                  a: "Areas include design thinking, UX design, visual design, critical thinking, IoT, game design, and related creative domains."
                },
                {
                  q: "Are workshops included?",
                  a: "Yes, workshops and focused sessions are a key part of the apprenticeship ecosystem."
                },
                {
                  q: "Do you collaborate with industry partners?",
                  a: "Yes, Designforge aims to build industry training collaborations through workshops, talks, project-based learning, and practical exposure."
                },
                {
                  q: "Is community outreach part of this initiative?",
                  a: "Yes, design awareness in tribal, remote, and underserved areas is an important part of the wider mission."
                },
                {
                  q: "How can I join upcoming sessions?",
                  a: "Through workshop announcements, apprenticeship applications, or community updates."
                }
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

      </main>
      
      <Footer />
    </div>
  );
}