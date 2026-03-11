import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Clock, CalendarDays, Users, BookOpen, PenTool, LayoutDashboard, ArrowRight, Target } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export default function FocusBatchPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Basic fade-up animation for sections
      gsap.utils.toArray('.animate-section').forEach((section: any) => {
        gsap.fromTo(section, 
          { opacity: 0, y: 50 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
            }
          }
        );
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col" ref={containerRef}>
      <Navbar />
      
      {/* SECTION 1: TOP BAR */}
      {/* Moved to navbar.tsx to act as a global banner */}

      <main className="flex-1 relative z-10">
        
        {/* SECTION 2: HERO */}
        <section className="pt-20 pb-24 md:pt-32 md:pb-32 px-4 bg-white relative overflow-hidden animate-section">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <div className="inline-block border border-border px-4 py-1.5 rounded-full text-sm font-medium mb-8 text-foreground/70">
              Designforge Focus Batch 2026
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
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full">Apply for Focus Batch</Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full">Join Waitlist</Button>
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
                { title: "B.Des Aspirants", desc: "For students preparing for NID DAT and UCEED who want stronger skills in sketching, creativity, observation, and visual communication." },
                { title: "M.Des Aspirants", desc: "For graduates preparing for NID M.Des and CEED with support across aptitude, problem-solving, portfolio direction, and interview prep." },
                { title: "Mains Aspirants", desc: "For students who need support for studio tests, portfolio evaluations, design articulation, and interviews." },
                { title: "Serious Learners", desc: "For students looking for structured mentorship, honest feedback, and long-term growth instead of coaching templates." }
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
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading mb-4 text-white">Your 40-week preparation journey</h2>
              <div className="w-20 h-1 bg-primary mx-auto"></div>
            </div>
            
            <div className="space-y-6">
              {[
                { phase: "Phase 1: Foundation", weeks: "Weeks 1–8", items: ["Drawing fundamentals", "Perspective, light, shadow", "Composition and visual communication", "Observation sketching", "Design basics", "Early storytelling and ideation"] },
                { phase: "Phase 2: Creativity + Exam Familiarity", weeks: "Weeks 9–16", items: ["Brainstorming and idea expansion", "Problem-solving and redesign exercises", "UCEED / CEED / NID question familiarity", "Past paper understanding", "Time-bound exercises"] },
                { phase: "Phase 3: Intensive Practice", weeks: "Weeks 17–28", items: ["Weekly assignments", "Mock tests", "Critique rounds", "Speed and clarity improvement", "Accuracy and originality"] },
                { phase: "Phase 4: Prelims Revision + Transition", weeks: "Weeks 29–32", items: ["Full mocks", "Feedback and score analysis", "Final prelims tuning", "Strategy for next stage"] },
                { phase: "Phase 5: Mains, Portfolio, Interview Prep", weeks: "Weeks 33–40", items: ["Studio test thinking", "Material exploration", "Model making and prototyping", "Portfolio building and presentation", "Mock interviews", "Design articulation and confidence"] }
              ].map((phase, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <div className="text-primary font-mono text-sm mb-2">{phase.weeks}</div>
                    <h3 className="text-2xl font-heading">{phase.phase}</h3>
                  </div>
                  <div className="md:w-2/3">
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {phase.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-white/70 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8: WHAT YOU GET */}
        <section className="py-24 bg-white animate-section">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="md:w-1/2">
                <h2 className="text-4xl md:text-5xl font-heading mb-6">What you get inside the Focus Batch</h2>
                <p className="text-lg text-foreground/60 mb-8 leading-relaxed">
                  Everything is designed to reduce confusion and build meaningful progress.
                </p>
                <div className="space-y-4">
                  {[
                    "Personalized mentor guidance",
                    "Design thinking and ideation classes",
                    "Structured live sessions across 40 weeks",
                    "Peer and mentor critique circles",
                    "Weekly assignments & Mock tests with feedback",
                    "Study material + past year question support",
                    "Studio test simulations & Material practice",
                    "Portfolio review & Mock interviews",
                    "Guest sessions with NID / IIT / design mentors"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="aspect-square rounded-3xl bg-background border border-border p-8 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="text-center relative z-10">
                    <div className="text-6xl font-heading text-primary mb-4">240+</div>
                    <div className="text-xl font-medium text-foreground/70 uppercase tracking-widest">Hours of Live Mentorship</div>
                  </div>
                </div>
              </div>
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
              <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary transition-colors">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-medium">One-Time Payment</CardTitle>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-5xl font-heading font-bold">₹20,000</span>
                  </div>
                  <p className="text-sm text-green-600 font-medium mt-2">Save ₹2,000</p>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/70 mb-8">
                    The full fee is ₹22,000. Students choosing one-time payment receive a ₹2,000 discount.
                  </p>
                  <Button className="w-full text-lg h-12 rounded-xl group">
                    Pay One Time
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className="border border-border hover:border-foreground/20 transition-colors">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-medium">Installment Plan</CardTitle>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-5xl font-heading font-bold">₹22,000</span>
                    <span className="text-foreground/50">total</span>
                  </div>
                </CardHeader>
                <CardContent>
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
                  <Button variant="outline" className="w-full text-lg h-12 rounded-xl border-2">
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
        <section className="py-24 bg-primary text-primary-foreground animate-section">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-4xl md:text-6xl font-heading mb-6 leading-tight text-white">
              If you are serious about design, this is your time to begin
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join a focused, mentored, and high-intent 40-week program designed to help you prepare deeply, think clearly, present confidently, and perform strongly.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Button size="lg" variant="secondary" className="text-lg px-8 h-14 rounded-full text-primary hover:bg-white/90">Apply for Focus Batch</Button>
              <Button size="lg" className="text-lg px-8 h-14 rounded-full border border-white/30 bg-transparent hover:bg-white/10 text-white">Join Waitlist</Button>
            </div>
            
            <p className="text-sm font-mono text-primary-foreground/60 mb-16 uppercase tracking-wider">
              Only 20 seats per batch · B.Des + M.Des · Prelims + Mains support
            </p>
            
            <div className="border-t border-white/20 pt-12 mt-12">
              <h3 className="text-2xl font-heading mb-4 text-white">Have questions? Reach out to us</h3>
              <p className="text-primary-foreground/80 mb-6">Got questions or doubts? Chat with us — we're here to help.</p>
              <div className="flex justify-center gap-6 text-lg">
                <a href="tel:+917398580486" className="font-medium hover:underline text-white">+91 7398580486</a>
                <span className="text-white/40">|</span>
                <a href="mailto:designforge05@gmail.com" className="font-medium hover:underline text-white">designforge05@gmail.com</a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}