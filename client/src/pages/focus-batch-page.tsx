import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Clock, CalendarDays, Users, BookOpen, PenTool, LayoutDashboard, ArrowRight, Target, MessageCircle, Mail } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { RegistrationSheet } from "@/components/registration-sheet";
import { supabase } from "@/lib/supabaseClient";

gsap.registerPlugin(ScrollTrigger);

export default function FocusBatchPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const arcsContainerRef = useRef<HTMLDivElement>(null);
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async () => {
    if (!subEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subEmail)) return;
    setSubStatus('loading');
    try {
      const { error } = await supabase.from('subscribers').insert({ email: subEmail });
      if (error) {
        // Duplicate email returns a unique constraint error
        if (error.code === '23505') {
          setSubStatus('success'); // Already subscribed is fine
        } else {
          setSubStatus('error');
        }
      } else {
        setSubStatus('success');
        setSubEmail('');
      }
    } catch {
      setSubStatus('error');
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Basic fade-up animation for sections
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

      // Special animation for What You Get Section Arcs and Floating Chips
      if (arcsContainerRef.current) {
        const arcs = arcsContainerRef.current.querySelectorAll('.arc-line');
        const chips = arcsContainerRef.current.querySelectorAll('.floating-chip');

        // Gently draw in the arcs
        gsap.fromTo(arcs, 
          { opacity: 0, scale: 0.95 }, 
          { 
            opacity: 1, 
            scale: 1, 
            duration: 1.2, 
            stagger: 0.2, 
            ease: "power2.out",
            scrollTrigger: {
              trigger: arcsContainerRef.current,
              start: "top 75%",
            }
          }
        );

        // Pop in the chips with a slight staggered delay
        gsap.fromTo(chips,
          { y: 20, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "back.out(1.5)",
            scrollTrigger: {
              trigger: arcsContainerRef.current,
              start: "top 75%",
            }
          }
        );

        // Continuous gentle floating motion for chips
        gsap.to(chips, {
          y: "-=8",
          duration: 2.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: 0.2,
          delay: 1.5 // Start floating after entrance animation
        });
      }

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col" ref={containerRef}>
      <Navbar />
      <RegistrationSheet open={isRegOpen} onOpenChange={setIsRegOpen} defaultProgram="Focus Batch" />

      {/* SECTION 1: TOP BAR */}
      {/* Moved to navbar.tsx to act as a global banner */}

      <main className="flex-1 relative z-10">

        {/* SECTION 2: HERO */}
        <section className="pb-24 md:pt-32 md:pb-32 px-4 bg-white relative overflow-hidden animate-section">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <div className="inline-block border border-border px-4 py-1.5 rounded-full text-sm font-medium mb-8 text-foreground/70">
              Designforge Focus Batch 26-27
            </div>

            <h1 className="text-5xl md:text-7xl font-heading mb-8 tracking-tight text-foreground leading-[1.1]">
              Design your journey.<br />
              <span className="text-primary italic">Define your future.</span>
            </h1>

            <p className="text-xl md:text-2xl font-light text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10">
              A 40-week mentored program for serious design aspirants preparing for NID, UCEED, and CEED — covering Prelims, Mains, Studio Tests, Portfolios, and Interviews in one structured journey.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-foreground/80 mb-12">
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-lg border border-border"><Clock className="w-4 h-4 text-primary" /> 40 Weeks</div>
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-lg border border-border"><CalendarDays className="w-4 h-4 text-primary" /> 3 Days/Week</div>
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-lg border border-border"><BookOpen className="w-4 h-4 text-primary" /> B.Des + M.Des</div>
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-lg border border-border"><Users className="w-4 h-4 text-primary" /> 20 Seats Only</div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button size="lg" onClick={() => setIsRegOpen(true)} className="w-full sm:w-auto text-lg px-8 h-14 rounded-full btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all">Apply for Focus Batch</Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full bg-white border-black/10 hover:bg-white hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">Join Waitlist</Button>
            </div>

            <p className="text-sm font-mono text-foreground/50 uppercase tracking-wider">
              Mentorship-led. Critique-driven. Built for serious aspirants.
            </p>
          </div>
        </section>

        {/* SECTION 3: WHO THIS IS FOR */}
        <section className="py-24 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading mb-4">Who this batch is built for</h2>
              <div className="w-20 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "B.Des Aspirants", desc: "For students preparing for NID DAT, UCEED, and private design college entrance exams who want to strengthen their skills in sketching, creativity, observation, visual communication, portfolio direction, and interview preparation." },
                { title: "M.Des Aspirants", desc: "For graduates preparing for NID M.Des, CEED, UCEED, and private design college admissions, with support across aptitude, problem-solving, portfolio direction, and interview preparation." },
                { title: "Portfolio & Interview Preparation", desc: "For students who need focused support in portfolio building, studio test preparation, design articulation, and interview readiness for top design institutes." },
                { title: "Serious Learners", desc: "For students looking for structured mentorship, honest feedback, and long-term growth, beyond typical coaching templates." }
              ].map((item, i) => (
                <Card key={i} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-2xl font-heading flex items-center gap-3">
                      <Target className="w-6 h-6 text-primary" /> {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/70 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: WHAT THE PROGRAM COVERS */}
        <section className="py-24 bg-white animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-4xl md:text-5xl font-heading mb-16 text-center">One program. Complete preparation.</h2>

            <div className="grid md:grid-cols-4 gap-8 mb-16">
              {[
                { title: "Prelims Preparation", icon: PenTool, desc: "Drawing, observation, ideation, aptitude, time management, mock practice, and exam strategy." },
                { title: "Mains Preparation", icon: LayoutDashboard, desc: "Studio test thinking, material exploration, model making, presentation, and design articulation." },
                { title: "Portfolio Development", icon: BookOpen, desc: "Project selection, storytelling, documentation, layout, and college-aligned portfolio refinement." },
                { title: "Interview Readiness", icon: Users, desc: "Mock interviews, self-presentation, defending design decisions, and confidence-building." }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <item.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-xl font-medium italic text-foreground/80">
              "From first sketch to final interview, the journey is connected."
            </p>
          </div>
        </section>

        {/* SECTION 6: 40-WEEK ROADMAP */}
        <section className="py-24 bg-[#111111] text-white animate-section">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading mb-4 text-white">Your 40-week preparation journey</h2>
              <div className="w-20 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="space-y-6">
              {[
                {
                  phase: "Phase 1: Design Foundation",
                  weeks: "Week 1 – Week 4",
                  goal: "Build strong fundamentals in drawing, observation and visual communication",
                  items: ["Basics of lines, forms and perspective", "Light, shadow and object rendering", "Composition and layout techniques", "Elements and principles of design", "Observation-based sketching", "Introduction to visual storytelling", "Material exploration: textures, folds and shading", "Introduction to design process thinking"]
                },
                {
                  phase: "Phase 2: Creativity & Idea Expansion",
                  weeks: "Week 5 – Week 8",
                  goal: "Strengthen ideation, creativity and design thinking",
                  items: ["Brainstorming and lateral thinking tools (SCAMPER, mind mapping)", "Creative problem solving methods", "Enhancing visual imagination", "Thumbnail ideation techniques", "Understanding form, function and context", "Redesign challenges (product improvement exercises)", "Storyboarding and visual narratives", "Introduction to product design and visual communication"]
                },
                {
                  phase: "Phase 3: Understanding the Exam Pattern",
                  weeks: "Week 9 – Week 12",
                  goal: "Familiarize students with actual exam formats and question styles",
                  groups: [
                    { title: "PART A Preparation", items: ["Numerical aptitude", "Logical reasoning", "Spatial reasoning", "Language comprehension", "Observation and design sensitivity", "Environmental and social awareness", "Analytical ability", "Visualization and problem solving", "And many more"] },
                    { title: "NID & PART B Preparation", items: ["Creative aptitude questions", "Drawing-based problem solving", "Design awareness and general knowledge", "Visualization and storytelling through sketches"] },
                    { title: "Additional Training", items: ["Past year paper analysis", "Understanding evaluation criteria", "Answer presentation techniques", "Time-bound exercises and practice"] }
                  ]
                },
                {
                  phase: "Phase 4: Intensive Practice & Skill Development",
                  weeks: "Week 13 – Week 24",
                  goal: "Build speed, confidence and consistency",
                  items: ["Full-length exam simulations", "Weekly assignments with critique", "Peer feedback and review sessions", "Topic-wise question solving", "Sketch speed improvement", "Creative ideation challenges", "Alternate problem-solving approaches", "Time management strategies"]
                },
                {
                  phase: "Phase 5: Revision & Performance Tuning",
                  weeks: "Week 25 – Week 28",
                  goal: "Strengthen answer quality and visual communication",
                  items: ["Revision of core concepts", "Improving sketch clarity and presentation", "Structuring answers effectively", "Handling unfamiliar or unexpected questions", "Practicing product and scenario-based questions", "Mental preparation for exam performance"]
                },
                {
                  phase: "Phase 6: Full Mock Test Simulation",
                  weeks: "Week 29 – Week 32",
                  goal: "Simulate real exam conditions",
                  items: ["Multiple full-length mock tests (NID + UCEED format)", "Detailed evaluation and feedback", "Score analysis and improvement strategy", "Final exam preparation guidance"]
                },
                {
                  stageTitle: "Stage 2 — Mains Preparation",
                  stageSubtitle: "Week 33 – Week 40 | NID Studio Test • IIT Design Interviews • Portfolio Evaluation",
                  isStageDivider: true
                },
                {
                  phase: "Phase 7: Studio Test Fundamentals",
                  weeks: "Week 33 – Week 34",
                  goal: "Understand studio test formats and expectations",
                  items: ["Understanding NID and IIT studio test structures", "Interpreting open-ended design briefs", "Framing problems clearly", "Creative ideation under time constraints", "Structured thinking within constraints", "Common studio-test mistakes and solutions"]
                },
                {
                  phase: "Phase 8: Material Exploration & Model Making",
                  weeks: "Week 35 – Week 36",
                  goal: "Translate ideas into physical models and prototypes",
                  groups: [
                    { title: "Material Exploration", items: ["Material exploration using paper, wire, thermocol, clay and found objects", "Understanding structure, balance and stability", "Innovation with limited materials", "Model-making techniques for speed and clarity", "Functional and conceptual prototyping", "Studio test simulations under timed conditions"] },
                    { title: "Portfolio Learning", items: ["Documenting experiments and iterations", "Presenting failures and learning processes", "Building process-driven projects"] }
                  ]
                },
                {
                  phase: "Phase 9: Portfolio Development",
                  weeks: "Week 37 – Week 38",
                  goal: "Build a clear and impactful design portfolio",
                  items: ["What design colleges look for in portfolios", "Selecting and structuring projects", "Writing concept statements and project descriptions", "Visual storytelling through layout and hierarchy", "Documenting models and prototypes", "Customising portfolios for different institutes"]
                },
                {
                  phase: "Phase 10: Studio Test Simulation & Interview Preparation",
                  weeks: "Week 39 – Week 40",
                  goal: "Final preparation for studio tests and interviews",
                  items: ["Real studio test simulations", "Portfolio review sessions", "Mock interviews with expert feedback", "Communication and storytelling training", "Confidence building and presentation practice", "Final strategy for NID and IIT interviews"]
                }
              ].map((item, i) => {
                if (item.isStageDivider) {
                  return (
                    <div key={i} className="mt-16 mb-8 pt-16 border-t border-white/10 text-center relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111111] px-4 text-white/40">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-heading text-white mb-3">{item.stageTitle}</h3>
                      <p className="text-primary font-medium text-lg md:text-xl tracking-wide">{item.stageSubtitle}</p>
                    </div>
                  );
                }

                return (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl flex flex-col lg:flex-row gap-6 md:gap-10 hover:bg-white/[0.07] transition-colors duration-300">
                    <div className="lg:w-1/3 shrink-0">
                      <div className="inline-block bg-primary/10 text-primary font-mono text-sm px-4 py-1.5 rounded-full mb-5 font-medium border border-primary/20">{item.weeks}</div>
                      <h3 className="text-2xl font-heading mb-4 text-white/90 leading-tight">{item.phase}</h3>
                      <div className="flex items-start gap-3 mt-2">
                        <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-white/80 text-sm leading-relaxed font-medium">
                          {item.goal}
                        </p>
                      </div>
                    </div>
                    <div className="lg:w-2/3">
                      {item.items && (
                        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                          {item.items.map((listItem, j) => (
                            <li key={j} className="flex items-start gap-3 text-white/80 text-sm group">
                              <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              </div>
                              <span className="leading-relaxed group-hover:text-white transition-colors">{listItem}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {item.groups && (
                        <div className="space-y-8">
                          {item.groups.map((group, gIdx) => (
                            <div key={gIdx} className="bg-white/5 rounded-2xl p-5 border border-white/5">
                              <h4 className="text-white/90 font-medium mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
                                <span className="w-8 h-px bg-primary/50"></span>
                                {group.title}
                              </h4>
                              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                                {group.items.map((listItem, j) => (
                                  <li key={j} className="flex items-start gap-3 text-white/80 text-sm group">
                                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    </div>
                                    <span className="leading-relaxed group-hover:text-white transition-colors">{listItem}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 8: WHAT YOU GET */}
        <section className="pt-24 pb-0 bg-white animate-section overflow-hidden border-t border-black/5">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-4xl md:text-5xl font-heading mb-6 text-[#262626]">What you get inside the Focus Batch</h2>
              <p className="text-xl font-light text-foreground/60 max-w-2xl mx-auto leading-relaxed">
                Everything is designed to reduce confusion and build meaningful progress.
              </p>
            </div>

            {/* Arcs and Floating Elements Concept */}
            <div ref={arcsContainerRef} className="relative w-full h-[600px] md:h-[700px] max-w-5xl mx-auto flex flex-col items-center justify-center font-sans mb-12">
              
              {/* Semi-circles (Arcs) now Full Circles centered */}
              {/* Outer Arc */}
              <div className="arc-line absolute top-1/2 left-1/2 w-[900px] h-[900px] rounded-full border border-black/10 -translate-x-1/2 -translate-y-1/2 hidden md:block z-0"></div>
              <div className="arc-line absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full border border-black/10 -translate-x-1/2 -translate-y-1/2 md:hidden z-0"></div>

              {/* Middle Arc */}
              <div className="arc-line absolute top-1/2 left-1/2 w-[650px] h-[650px] rounded-full border border-black/10 -translate-x-1/2 -translate-y-1/2 hidden md:block z-0"></div>
              <div className="arc-line absolute top-1/2 left-1/2 w-[350px] h-[350px] rounded-full border border-black/10 -translate-x-1/2 -translate-y-1/2 md:hidden z-0"></div>
              
              {/* Inner Arc */}
              <div className="arc-line absolute top-1/2 left-1/2 w-[350px] h-[350px] rounded-full border border-black/10 border-dashed -translate-x-1/2 -translate-y-1/2 hidden md:block z-0"></div>
              <div className="arc-line absolute top-1/2 left-1/2 w-[220px] h-[220px] rounded-full border border-black/10 border-dashed -translate-x-1/2 -translate-y-1/2 md:hidden z-0"></div>

              {/* Floating Items */}
              
              {/* Top Level Items */}
              {/* Top Center */}
              <div className="floating-chip absolute top-[5%] md:top-[8%] left-1/2 -translate-x-1/2 bg-white px-4 md:px-5 py-2 md:py-3 rounded-[2rem] shadow-xl shadow-black/[0.04] border border-black/5 flex items-center gap-3 md:hover:border-primary/30 transition-colors z-20">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">Portfolio & Interviews</span>
              </div>

              {/* Upper Left */}
              <div className="floating-chip absolute top-[18%] md:top-[20%] left-[5%] md:left-[15%] bg-white px-4 md:px-5 py-2 md:py-3 rounded-[2rem] shadow-xl shadow-black/[0.04] border border-black/5 flex items-center gap-3 md:hover:border-primary/30 transition-colors z-20">
                <div className="w-8 h-8 rounded-full bg-pop-1/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-pop-1" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">Guest Sessions</span>
              </div>

              {/* Upper Right */}
              <div className="floating-chip absolute top-[18%] md:top-[20%] right-[5%] md:right-[15%] bg-white px-4 md:px-5 py-2 md:py-3 rounded-[2rem] shadow-xl shadow-black/[0.04] border border-black/5 flex items-center gap-3 md:hover:border-primary/30 transition-colors z-20">
                <div className="w-8 h-8 rounded-full bg-pop-2/10 flex items-center justify-center shrink-0">
                  <PenTool className="w-4 h-4 text-pop-2" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">Studio Practice</span>
              </div>

              {/* Mid Level Items */}
              {/* Mid Left */}
              <div className="floating-chip absolute top-[38%] md:top-[42%] left-[2%] md:left-[8%] bg-white px-4 md:px-5 py-2 md:py-3 rounded-[2rem] shadow-lg shadow-black/[0.04] border border-black/5 flex items-center gap-2 md:gap-3 md:hover:border-primary/30 transition-colors z-20">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">Weekly Assignments</span>
              </div>

              {/* Mid Right */}
              <div className="floating-chip absolute top-[38%] md:top-[42%] right-[2%] md:right-[8%] bg-white px-4 md:px-5 py-2 md:py-3 rounded-[2rem] shadow-lg shadow-black/[0.04] border border-black/5 flex items-center gap-2 md:gap-3 md:hover:border-primary/30 transition-colors z-20">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">PYQs & Material</span>
              </div>

              {/* Lower Level Items */}
              {/* Lower Left Inner */}
              <div className="floating-chip absolute top-[55%] md:top-[60%] left-[20%] md:left-[28%] bg-white px-4 md:px-5 py-2 md:py-3 rounded-[2rem] shadow-md border border-black/5 flex items-center gap-2 md:gap-3 md:hover:border-primary/30 transition-colors z-20">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">1-on-1 Guidance</span>
              </div>

              {/* Lower Right Inner */}
              <div className="floating-chip absolute top-[55%] md:top-[60%] right-[20%] md:right-[28%] bg-white px-4 md:px-5 py-2 md:py-3 rounded-[2rem] shadow-md border border-black/5 flex items-center gap-2 md:gap-3 md:hover:border-primary/30 transition-colors z-20">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">Critique Circles</span>
              </div>

              {/* Center Stats Bubbles */}
              
              {/* Bottom Left Core Bubble */}
              <div className="absolute top-[50%] left-[50%] -translate-x-[110%] md:-translate-x-[120%] -translate-y-1/2 bg-white w-28 h-28 md:w-36 md:h-36 rounded-full shadow-2xl border border-black/5 flex flex-col items-center justify-center z-30 transition-transform hover:scale-105">
                <div className="text-3xl md:text-4xl font-heading text-primary drop-shadow-sm mb-1">40</div>
                <div className="text-[9px] md:text-[10px] font-bold text-foreground/70 uppercase tracking-widest text-center px-2">Week Path</div>
              </div>

              {/* Top Center Core Bubble */}
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-[120%] bg-white w-32 h-32 md:w-44 md:h-44 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-black/5 flex flex-col items-center justify-center z-40 transition-transform hover:scale-105">
                <div className="text-4xl md:text-6xl font-heading text-primary drop-shadow-sm leading-none mb-1 md:mb-2">240<span className="text-2xl md:text-3xl">+</span></div>
                <div className="text-[10px] md:text-xs font-bold text-foreground/70 uppercase tracking-widest text-center px-4">Mentorship Hours</div>
              </div>

              {/* Bottom Right Core Bubble */}
              <div className="absolute top-[50%] left-[50%] translate-x-[10%] md:translate-x-[20%] -translate-y-1/2 bg-white w-28 h-28 md:w-36 md:h-36 rounded-full shadow-2xl border border-black/5 flex flex-col items-center justify-center z-30 transition-transform hover:scale-105">
                <div className="text-3xl md:text-4xl font-heading text-primary drop-shadow-sm mb-1">1:1</div>
                <div className="text-[9px] md:text-[10px] font-bold text-foreground/70 uppercase tracking-widest text-center px-2">Critique Sessions</div>
              </div>

              {/* Central connection aesthetic */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-border/40 z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] md:w-[260px] h-px bg-border/30 -rotate-45 z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] md:w-[260px] h-px bg-border/30 rotate-45 z-10"></div>

            </div>
          </div>
        </section>

        {/* SECTION 11: PRICING */}
        <section className="py-24 bg-background animate-section" id="apply">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <h2 className="text-4xl md:text-5xl font-heading mb-4">Fee Structure</h2>
            <p className="text-xl text-foreground/60 mb-16">For the complete 40-week Prelims + Mains program</p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              {/* Card 1 */}
              <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary transition-colors flex flex-col h-full">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-medium">One-Time Payment</CardTitle>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-5xl font-heading font-bold">₹20,000</span>
                  </div>
                  <p className="text-sm text-green-600 font-medium mt-2">Save ₹2,000</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <p className="text-foreground/70 mb-8">
                    The full fee is ₹22,000. Students choosing one-time payment receive a ₹2,000 discount.
                  </p>
                  <Button className="w-full mt-auto text-lg h-12 rounded-xl group btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all">
                    Pay One Time
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className="border border-border hover:border-foreground/20 transition-colors flex flex-col h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-medium">Installment Plan</CardTitle>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-5xl font-heading font-bold">₹22,000</span>
                    <span className="text-foreground/50">total</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-foreground/70">1st Installment (Pay Now)</span>
                      <span className="font-bold">₹12,000</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-foreground/70">2nd Installment (After 3 mos)</span>
                      <span className="font-bold">₹10,000</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-auto text-lg h-12 rounded-xl bg-white border-black/10 hover:bg-white hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    Choose Installments
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="mt-8 text-sm text-foreground/50 italic">
              * Extra discount may be available for students who clear the Designforge screening process.
            </p>
          </div>
        </section>

        {/* SECTION 14: FAQ */}
        <section className="py-24 bg-white animate-section">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading mb-4">Frequently asked questions</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {[
                { q: "Who is this program for?", a: "For serious B.Des and M.Des aspirants preparing for NID, UCEED, and CEED, especially students who also want support for mains, portfolio, and interviews." },
                { q: "Does this cover both Prelims and Mains?", a: "Yes. It is a complete 40-week program covering Prelims, Mains, Studio Tests, Portfolios, and Interviews." },
                { q: "Is this coaching or mentorship?", a: "This is a mentorship-led program with structured teaching, critique, practice, and guided growth." },
                { q: "How many students are admitted?", a: "Only 20 students per batch." },
                { q: "What is the class schedule?", a: "3 live sessions per week, 2 hours each, over 40 weeks." },
                { q: "Is studio test and material practice included?", a: "Yes. Studio simulations, material exploration, and model-making support are included." },
                { q: "Do students get portfolio help?", a: "Yes. Portfolio support is integrated into the program." }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-border py-2">
                  <AccordionTrigger className="text-left text-lg font-medium hover:text-primary hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/70 text-base leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* SECTION 15 & 16: FINAL CTA & CONTACT */}
        <section className="py-24 bg-background animate-section border-t border-border/50">
          <div className="container mx-auto px-4 max-w-5xl">

            {/* Subscription Card Format */}
            <div className="bg-white rounded-3xl p-10 md:p-16 border border-black/5 shadow-xl relative overflow-hidden mb-20 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="relative z-10 max-w-2xl">
                <div className="inline-block bg-primary/10 text-primary font-mono text-sm px-4 py-1.5 rounded-full mb-6 font-medium border border-primary/20">
                  Join the Waitlist
                </div>
                <h2 className="text-4xl md:text-5xl font-heading mb-6 leading-tight text-foreground">
                  If you are serious about design, <span className="text-primary italic">this is your time to begin.</span>
                </h2>
                <p className="text-lg text-foreground/70 mb-10 leading-relaxed">
                  Join a focused, mentored, and high-intent 40-week program designed to help you prepare deeply, think clearly, present confidently, and perform strongly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                    <input 
                      type="email"
                      value={subEmail}
                      onChange={(e) => { setSubEmail(e.target.value); setSubStatus('idle'); }}
                      placeholder="Enter your email for updates" 
                      className="w-full h-14 pl-6 pr-4 rounded-full border border-black/10 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-foreground/40"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleSubscribe}
                    disabled={subStatus === 'loading' || subStatus === 'success'}
                    className="h-14 px-8 rounded-full btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all"
                  >
                    {subStatus === 'loading' ? 'Subscribing...' : subStatus === 'success' ? '✓ Subscribed!' : 'Subscribe'}
                  </Button>
                </div>
                {subStatus === 'error' && (
                  <p className="text-sm text-red-500 font-medium ml-2 mb-2">Could not subscribe. Please try again.</p>
                )}
                
                <p className="text-sm text-foreground/50 font-medium ml-2">Or <button onClick={() => setIsRegOpen(true)} className="text-primary underline hover:text-primary/80">apply directly</button> for the upcoming Focus Batch.</p>
              </div>
            </div>

            {/* Help & Contact Layout Redo */}
            <div className="flex flex-col md:flex-row gap-12 items-center justify-between px-4 max-w-4xl mx-auto">
              <div className="md:w-1/2">
                <h3 className="text-3xl font-heading mb-4 text-foreground">Have questions? Reach out to us</h3>
                <p className="text-foreground/60 leading-relaxed">
                  Got questions or doubts? Whether you are confused about the roadmap, or just want to know if this batch is right for you — chat with us, we're here to help.
                </p>
              </div>
              <div className="md:w-1/2 flex flex-col gap-4 w-full">
                 <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-black/5 shadow-sm group hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground/50 uppercase tracking-widest mb-1">WhatsApp Us</p>
                      <a href="https://wa.me/917398580486" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-foreground hover:text-primary transition-colors">+91 7398580486</a>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-black/5 shadow-sm group hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-pop-1/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5 text-pop-1" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground/50 uppercase tracking-widest mb-1">Email Us</p>
                      <a href="mailto:designforge05@gmail.com" className="text-lg font-bold text-foreground hover:text-pop-1 transition-colors">designforge05@gmail.com</a>
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}