import { useEffect, useRef } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Target, Users, MapPin, Building, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Basic setup
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      // Intro animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(".hero-badge", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1 })
        .fromTo(".hero-title", { y: 20, opacity: 0, rotateX: -5 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.8 }, "-=0.4")
        .fromTo(".hero-desc", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.5")
        .fromTo(".hero-trust", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4");

      // Scroll animations for sections
      const sections = gsap.utils.toArray('.animate-section');
      sections.forEach((section: any) => {
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

      // Cards staggered animation
      const cardGrids = gsap.utils.toArray('.card-grid');
      cardGrids.forEach((grid: any) => {
        const cards = grid.querySelectorAll('.stagger-card');
        if (cards.length > 0) {
          gsap.fromTo(cards,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: grid,
                start: "top 85%",
                toggleActions: "play none none none"
              }
            }
          );
        }
      });

      // Continuous fluid animation for decorative shapes
      gsap.to(".shape-1", {
        y: -30, x: 20, rotation: 10,
        duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut"
      });
      gsap.to(".shape-2", {
        y: 30, x: -20, rotation: -10,
        duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col selection:bg-primary selection:text-white" ref={containerRef}>
      <Navbar />

      <main className="flex-1 relative z-10">

        {/* Soft abstract background blur */}
        <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
          <div className="shape-1 absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-pop-3/10 rounded-full blur-[100px]"></div>
          <div className="shape-2 absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px]"></div>
        </div>

        {/* SECTION 1: HERO */}
        <section className="pt-24 pb-20 relative z-10">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <div className="hero-badge inline-block border border-border px-4 py-1.5 rounded-full text-sm font-medium mb-8 text-foreground/70 bg-white/50 backdrop-blur-sm">
              About Designforge
            </div>

            <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-heading mb-8 tracking-tight text-[#262626] leading-[1.1] max-w-4xl mx-auto">
              Built to make design more <span className="text-primary italic">accessible, practical,</span> and <span className="text-primary italic">empowering.</span>
            </h1>

            <p className="hero-desc text-xl md:text-2xl font-light text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10">
              Designforge is a mentorship-led design learning ecosystem for aspirants, students, and early professionals.
            </p>

            <div className="hero-desc max-w-3xl mx-auto text-foreground/80 leading-relaxed mb-12">
              <p>
                Founded in 2015 as Whitespace Design Foundation and renamed as Designforge in 2025, our mission has stayed the same: to democratise design and make meaningful design learning more reachable, affordable, and relevant.
              </p>
            </div>

            <div className="hero-trust inline-flex items-center gap-3 px-6 py-3 bg-white/80 border border-black/5 rounded-2xl shadow-sm">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">10k+ students and professionals supported since 2015</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: OUR STORY */}
        <section className="py-24 bg-white animate-section border-y border-border/50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-heading mb-6 text-[#262626]">Where the journey began</h2>
              <div className="w-16 h-1 bg-primary"></div>
            </div>

            <div className="prose prose-lg text-foreground/80 max-w-none">
              <p className="lead text-xl mb-6 font-medium text-foreground">
                Designforge began as Whitespace Design Foundation in 2015 with a simple belief: talent exists everywhere, but access to good design guidance often does not.
              </p>
              <p className="mb-6">
                We started by creating practical and affordable pathways for students and professionals to discover design thinking, creative problem-solving, and product innovation in a more approachable way.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: FROM WHITESPACE TO DESIGNFORGE */}
        <section className="py-24 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-heading mb-6 text-[#262626]">Why we became Designforge</h2>
                <div className="w-16 h-1 bg-primary mb-8"></div>

                <div className="space-y-6 text-foreground/80 text-lg leading-relaxed">
                  <p>
                    In 2025, Whitespace Design Foundation evolved into Designforge.
                  </p>
                  <p>
                    The mission did not change — the identity became clearer. Designforge was created to take the same vision forward with stronger mentoring, a wider community, and a sharper focus on helping people build their design journey through practice, critique, and guidance.
                  </p>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-10 md:p-12 rounded-[2rem] border border-black/5 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pop-2/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                  <div className="relative z-10 flex flex-col items-center justify-center text-center h-full space-y-8">
                    <div className="text-2xl font-serif text-foreground/40 italic">Whitespace Design Foundation</div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="w-px h-8 bg-border"></div>
                      <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-foreground/40 rotate-90" />
                      </div>
                      <div className="w-px h-8 bg-border"></div>
                    </div>

                    <div className="text-3xl font-heading font-bold text-foreground">Designforge</div>
                  </div>

                  <div className="mt-12 text-center text-lg font-medium text-primary">
                    What changed was the scale and clarity.<br />What stayed the same was the intent.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: WHAT WE DO */}
        <section className="py-24 bg-white animate-section border-y border-border/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading mb-6 text-[#262626]">What Designforge does</h2>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
                Designforge supports learners across different stages of the design journey through focused, practical, and mentorship-led experiences.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 card-grid">
              <Card className="stagger-card bg-background border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-pop-1/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-pop-1" />
                  </div>
                  <CardTitle className="text-2xl font-heading">Design Learning and Mentorship</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/70 leading-relaxed text-lg">
                    We create structured learning experiences that help students and early professionals build strong foundations in design thinking, creativity, visual communication, and problem-solving.
                  </p>
                </CardContent>
              </Card>

              <Card className="stagger-card bg-background border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-heading">Entrance Preparation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/70 leading-relaxed text-lg">
                    We mentor aspirants preparing for NID DAT, UCEED, and CEED through guided practice, critique, one-to-one feedback, and stronger creative confidence.
                  </p>
                </CardContent>
              </Card>

              <Card className="stagger-card bg-background border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-pop-3/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Palette className="w-6 h-6 text-pop-3" />
                  </div>
                  <CardTitle className="text-2xl font-heading">Portfolio and Interview Guidance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/70 leading-relaxed text-lg">
                    We help learners improve how they present their work, articulate their thinking, and prepare for studio tests, portfolios, and interviews with greater clarity.
                  </p>
                </CardContent>
              </Card>

              <Card className="stagger-card bg-background border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-pop-2/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-pop-2" />
                  </div>
                  <CardTitle className="text-2xl font-heading">Community-Led Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/70 leading-relaxed text-lg">
                    We are building a learning ecosystem where aspirants and young designers can access support, stay motivated, learn together, and grow in a more connected way.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 5: WHAT WE BELIEVE */}
        <section className="py-24 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading mb-6 text-[#262626]">What we believe</h2>
              <div className="w-16 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="text-xl md:text-2xl font-medium text-center text-foreground mb-12">
              "We believe design should not feel distant, expensive, or restricted to a few people with access."
            </div>

            <div className="prose prose-lg text-foreground/80 max-w-none mb-12 text-center md:text-left">
              <p>
                Today, the need for design thinking, innovation, product understanding, and user-centered problem-solving is stronger than ever. But for many students and professionals, the path into design still feels unclear or unaffordable.
              </p>
              <p className="mb-8">
                Designforge exists to reduce that gap by making design learning:
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-16">
              {['More accessible', 'More affordable', 'More practical', 'More mentorship-led', 'More rooted in real growth'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-black/5 shadow-sm text-foreground/80 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10 text-center">
              <p className="text-xl text-primary font-medium italic">
                Our goal is not just to help learners start, but to help them move forward with clarity and confidence.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: HOW WE MENTOR */}
        <section className="py-24 bg-[#111111] text-white animate-section relative overflow-hidden">
          {/* Subtle dark pattern background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="flex flex-col lg:flex-row gap-16">
              <div className="lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-heading mb-6 text-white">How we mentor and teach</h2>
                <div className="w-16 h-1 bg-primary mb-10"></div>

                <p className="text-xl text-white/80 leading-relaxed mb-8">
                  At Designforge, we believe meaningful design learning comes from a balance of:
                </p>

                <ul className="grid sm:grid-cols-2 gap-y-4 gap-x-8 mb-12">
                  {[
                    "Strong fundamentals",
                    "Hands-on practice",
                    "Observation and critical thinking",
                    "Honest feedback",
                    "Reflection and iteration",
                    "Real-world problem solving"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:w-1/2 flex items-center justify-center">
                {/* Abstract visualization of the learning process */}
                <div className="relative w-full max-w-md aspect-square rounded-[3rem] bg-white/5 border border-white/10 p-8 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-50 rounded-[3rem]"></div>

                  <div className="w-32 h-32 rounded-full border border-white/20 absolute top-1/4 left-1/4 animate-[spin_10s_linear_infinite]"></div>
                  <div className="w-48 h-48 rounded-full border border-primary/30 absolute bottom-1/4 right-1/4 animate-[spin_15s_linear_infinite_reverse]"></div>

                  <div className="relative z-10 w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>

                  <div className="relative z-10 text-center">
                    <div className="text-sm font-mono text-primary/80 uppercase tracking-widest mb-2">The Process</div>
                    <div className="text-2xl font-serif text-white">Think. Build. Refine.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: MENTOR SECTION */}
        <section className="py-24 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-heading mb-6 text-[#262626]">Mentored by people who understand both the journey and the profession</h2>
              <p className="text-xl text-foreground/70 leading-relaxed">
                Designforge is shaped by mentors who bring together lived experience from design education, industry practice, and real student guidance.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm mb-16">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="md:w-1/3">
                  <h3 className="text-2xl font-medium mb-4">Our Mentors Support Across:</h3>
                  <p className="text-foreground/60 mb-6">Our mentors include designers, NIDans, IITians, and professionals.</p>
                </div>
                <div className="md:w-2/3">
                  <div className="flex flex-wrap gap-3">
                    {["Design Entrance Preparation", "Portfolio Building", "Interview Readiness", "Design Thinking and Problem Solving", "Early Career Growth"].map((tag, i) => (
                      <span key={i} className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mentor Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 card-grid mb-16">

              {/* Mentor 1 */}
              <Card className="stagger-card overflow-hidden bg-white border-none shadow-sm hover:shadow-lg transition-all group duration-300 flex flex-col h-full">
                <div className="h-64 bg-background border-b border-border/50 relative overflow-hidden flex items-center justify-center shrink-0">
                  {/* Image Placeholder */}
                  <div className="w-32 h-32 rounded-full bg-border/50 border-4 border-white shadow-sm flex items-center justify-center">
                    <Users className="w-10 h-10 text-foreground/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                </div>
                <CardContent className="p-6 relative pt-8 flex flex-col flex-1 justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold font-heading mb-1">Aditya Sharma</h3>
                    <p className="text-primary font-medium text-sm mb-4">Mentor / Design Leader</p>
                    <p className="text-foreground/70 text-sm leading-relaxed mb-6">
                      Design educator and industry professional with over a decade of experience bridging the gap between design education and real-world application.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <Building className="w-3.5 h-3.5 shrink-0" /> NID | Principal UX Architect
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mentor 2 */}
              <Card className="stagger-card overflow-hidden bg-white border-none shadow-sm hover:shadow-lg transition-all group duration-300 flex flex-col h-full">
                <div className="h-64 bg-background border-b border-border/50 relative overflow-hidden flex items-center justify-center shrink-0">
                  {/* Image Placeholder */}
                  <div className="w-32 h-32 rounded-full bg-border/50 border-4 border-white shadow-sm flex items-center justify-center">
                    <Users className="w-10 h-10 text-foreground/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                </div>
                <CardContent className="p-6 relative pt-8 flex flex-col flex-1 justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold font-heading mb-1">Siddhi Patil</h3>
                    <p className="text-primary font-medium text-sm mb-4">Industry Mentor</p>
                    <p className="text-foreground/70 text-sm leading-relaxed mb-6">
                      Specialized in research and accessibility, with 6+ years of experience guiding students to translate ideas into compelling visual narratives.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <Building className="w-3.5 h-3.5 shrink-0" /> NID | Product Designer
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mentor 3 */}
              <Card className="stagger-card overflow-hidden bg-white border-none shadow-sm hover:shadow-lg transition-all group duration-300 flex flex-col h-full">
                <div className="h-64 bg-background border-b border-border/50 relative overflow-hidden flex items-center justify-center shrink-0">
                  {/* Image Placeholder */}
                  <div className="w-32 h-32 rounded-full bg-border/50 border-4 border-white shadow-sm flex items-center justify-center">
                    <Users className="w-10 h-10 text-foreground/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                </div>
                <CardContent className="p-6 relative pt-8 flex flex-col flex-1 justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold font-heading mb-1">More Mentors</h3>
                    <p className="text-primary font-medium text-sm mb-4">IITians & Industry Experts</p>
                    <p className="text-foreground/70 text-sm leading-relaxed mb-6">
                      Our growing community of mentors includes practicing designers and alumni from top institutes dedicated to giving back.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <Building className="w-3.5 h-3.5 shrink-0" /> Top Design Institutes
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="text-center text-xl font-medium text-foreground/80 italic max-w-3xl mx-auto">
              "More than teaching, our mentors help students think deeper, improve through critique, and gain confidence through consistent guidance."
            </div>
          </div>
        </section>

        {/* SECTION 8: LOGO CAROUSEL */}
        <section className="py-20 bg-white border-y border-border/50 animate-section overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl mb-12 text-center">
            <h2 className="text-3xl font-heading mb-4 text-[#262626]">Connected to respected institutions and industry experience</h2>
            <p className="text-foreground/60 max-w-3xl mx-auto">
              Our broader mentor and collaborator network brings together experiences associated with leading design institutes, academic pathways, and industry practice. This helps learners benefit from both admission-focused mentorship and a wider understanding of design as a profession.
            </p>
          </div>

          <div className="relative w-full flex overflow-x-hidden">
            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-r from-white to-transparent z-10"></div>

            {/* Scrolling container */}
            <div className="animate-marquee flex items-center whitespace-nowrap gap-12 md:gap-24 py-4 px-12">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <div key={num} className="w-32 md:w-40 h-16 bg-background rounded-lg border border-border/50 flex items-center justify-center shrink-0 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100">
                  <div className="text-xs font-mono text-foreground/40 font-medium">LOGO PLACEHOLDER</div>
                </div>
              ))}
              {/* Duplicate for seamless looping */}
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <div key={`dup-${num}`} className="w-32 md:w-40 h-16 bg-background rounded-lg border border-border/50 flex items-center justify-center shrink-0 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100">
                  <div className="text-xs font-mono text-foreground/40 font-medium">LOGO PLACEHOLDER</div>
                </div>
              ))}
            </div>

            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-foreground/40 uppercase tracking-widest font-mono">Only verified associations</p>
          </div>
        </section>

        {/* SECTION 9: IMPACT */}
        <section className="py-24 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2">
                <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10 card-grid">
                  <div className="stagger-card bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col justify-center items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md aspect-[4/3] sm:aspect-square">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-heading text-primary mb-2">10k+</div>
                    <div className="text-xs sm:text-sm text-foreground/70 font-medium">Learners Supported</div>
                  </div>
                  <div className="stagger-card bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col justify-center items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md aspect-[4/3] sm:aspect-square">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-heading text-pop-1 mb-2">10+</div>
                    <div className="text-xs sm:text-sm text-foreground/70 font-medium">Years of Legacy</div>
                  </div>
                  <div className="stagger-card bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col justify-center items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md aspect-[4/3] sm:aspect-square">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-heading text-pop-2 mb-2">NID/IIT</div>
                    <div className="text-xs sm:text-sm text-foreground/70 font-medium">Mentor Network</div>
                  </div>
                  <div className="stagger-card bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col justify-center items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md aspect-[4/3] sm:aspect-square">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-heading text-pop-3 mb-2">100%</div>
                    <div className="text-xs sm:text-sm text-foreground/70 font-medium">Community Driven</div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-heading mb-6 text-[#262626]">The journey so far</h2>
                <div className="w-16 h-1 bg-primary mb-8"></div>

                <p className="font-medium text-foreground/90 mb-4">This journey has included helping learners:</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Discover design as a serious path",
                    "Strengthen creative thinking and problem-solving",
                    "Prepare for institutes like NID and IITs",
                    "Improve portfolios, interviews, and design confidence",
                    "Access design learning in a more affordable and approachable way"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-foreground/70">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                  <p className="text-foreground/80 font-medium italic">
                    "For us, this impact is not just a number. It reflects trust, continuity, and the responsibility to keep making design more reachable."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: MISSION */}
        <section className="pt-24 pb-32 bg-[#111111] text-white text-center animate-section relative z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 to-[#111111]"></div>

          <div className="container mx-auto px-4 max-w-4xl relative z-20">
            {/* MISSION */}
            <div>
              <div className="text-primary font-mono text-sm uppercase tracking-widest mb-4">Our Mission</div>
              <h2 className="text-3xl md:text-5xl font-heading leading-tight mb-8">
                To democratise design by making design education, mentorship, and growth opportunities more accessible, affordable, and relevant for aspirants, students, and early professionals.
              </h2>
            </div>
          </div>
        </section>
      </main>

      <div className="bg-[#111111] relative z-20 -mt-10">
        <Footer />
      </div>
    </div>
  );
}