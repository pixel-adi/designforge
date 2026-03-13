import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CheckCircle2, Heart, Users, Share2, Lightbulb, MapPin, Building2, UserPlus, Globe } from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function JoinUsPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const ctx = gsap.context(() => {
      // Standard section animation
      gsap.utils.toArray<HTMLElement>('.animate-section').forEach((section) => {
        gsap.fromTo(section, 
          { y: 40, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.8, 
            ease: "power3.out", 
            scrollTrigger: {
              trigger: section,
              start: "top 85%"
            }
          }
        );
      });
      
      // Hero specific animation
      const tl = gsap.timeline();
      tl.fromTo(".hero-elem", 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-background font-sans overflow-x-hidden selection:bg-primary/20">
      <Navbar />
      
      <main className="w-full">
        {/* SECTION 1: HERO */}
        <section className="relative pt-32 md:pt-40 pb-20 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Ambient background blob */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="hero-elem inline-block border border-black/10 px-4 py-1.5 rounded-full text-sm font-medium mb-8 text-foreground/70 bg-white/50 backdrop-blur-sm shadow-sm">
              Join Designforge
            </div>
            
            <h1 className="hero-elem text-5xl md:text-7xl font-heading mb-8 tracking-tight text-[#262626] leading-[1.1]">
              Be part of a growing <br/>
              <span className="text-primary italic">design learning community</span>
            </h1>
            
            <p className="hero-elem text-xl md:text-2xl text-foreground/70 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              Designforge is built by people who care about design, mentorship, access, and growth. If you would like to contribute your time, perspective, energy, or experience, we would love to hear from you.
            </p>
            
            <div className="hero-elem flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full text-base btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all" onClick={() => document.getElementById('join-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Express Interest
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full text-base bg-white border-black/10 hover:bg-white hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Connect With Us
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 2: WAYS TO BE ASSOCIATED */}
        <section className="py-24 bg-white animate-section">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-heading text-[#262626] mb-6">Ways you can be associated</h2>
              <p className="text-xl text-foreground/70 font-light max-w-2xl">
                There are many ways to contribute to the Designforge ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: "Mentors", icon: Lightbulb, color: "text-pop-1", bg: "bg-pop-1/10", desc: "Guide learners through feedback, sessions, and conversations" },
                { title: "Ambassadors", icon: Users, color: "text-primary", bg: "bg-primary/10", desc: "Help build stronger student communities" },
                { title: "Promoters & Supporters", icon: Share2, color: "text-pop-2", bg: "bg-pop-2/10", desc: "Help extend the reach of the mission" },
                { title: "Collaborators", icon: UserPlus, color: "text-pop-3", bg: "bg-pop-3/10", desc: "Contribute through workshops, events, outreach, or knowledge-sharing" },
                { title: "Institutions & Communities", icon: Building2, color: "text-foreground", bg: "bg-foreground/5", desc: "Partner with us to create learning opportunities" },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 p-6 rounded-2xl border border-black/5 hover:border-black/10 hover:shadow-sm transition-all bg-background">
                  <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading mb-2 text-[#262626]">{item.title}</h3>
                    <p className="text-foreground/70 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: WHY JOIN */}
        <section className="py-24 bg-background animate-section">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="bg-[#111111] rounded-[2.5rem] p-10 md:p-16 lg:p-20 text-white relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
              {/* Decorative subtle texture */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row gap-12 lg:gap-20">
                <div className="md:w-1/2">
                  <h2 className="text-3xl md:text-5xl font-heading mb-6 leading-tight">
                    Why people choose to be part of <br className="hidden md:block"/><span className="text-primary italic">Designforge</span>
                  </h2>
                  <p className="text-white/70 text-xl font-light">Because they believe in:</p>
                </div>
                
                <div className="md:w-1/2">
                  <ul className="space-y-6">
                    {[
                      "Making design more accessible",
                      "Supporting the next generation of learners",
                      "Building meaningful communities",
                      "Sharing knowledge with purpose",
                      "Creating impact through design"
                    ].map((reason, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                        <span className="text-lg text-white/90 font-light">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: WHAT WE VALUE */}
        <section className="py-24 bg-white animate-section">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Heart className="w-8 h-8" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-heading text-[#262626] mb-8">What we value</h2>
            
            <p className="text-2xl md:text-3xl text-foreground/80 leading-relaxed font-light mb-10">
              We value sincerity, mentorship, generosity, curiosity, and a genuine intent to help people grow.
            </p>
            
            <div className="w-24 h-px bg-black/10 mx-auto mb-10"></div>
            
            <p className="text-xl text-foreground/60 italic font-serif">
              "Designforge is strongest when it is shaped by people who care deeply about learning and community."
            </p>
          </div>
        </section>

        {/* SECTION 5: FORM & FINAL CTA */}
        <section className="py-24 bg-background animate-section border-t border-black/5" id="join-form">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading text-[#262626] mb-6 leading-[1.1]">
                If this mission resonates, <br className="hidden md:block"/><span className="text-primary italic">let's talk.</span>
              </h2>
              <p className="text-lg text-foreground/70 font-light max-w-xl mx-auto">
                Tell us how you'd like to be involved. Fill out this quick form or <a href="mailto:designforge05@gmail.com" className="text-primary hover:underline">email us directly</a>.
              </p>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-black/5 shadow-none">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#262626] pl-2">Full Name</label>
                    <Input placeholder="Jane Doe" className="bg-black/[0.03] border-transparent focus-visible:bg-white focus-visible:border-primary/30 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#262626] pl-2">Email</label>
                    <Input type="email" placeholder="jane@example.com" className="bg-black/[0.03] border-transparent focus-visible:bg-white focus-visible:border-primary/30 transition-all" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#262626] pl-2">Phone Number</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 flex items-center gap-2 pointer-events-none text-base">
                        <span>🇮🇳</span>
                        <span className="text-foreground/50 font-medium">+91</span>
                      </div>
                      <Input type="tel" placeholder="98765 43210" className="pl-[5.5rem] bg-black/[0.03] border-transparent focus-visible:bg-white focus-visible:border-primary/30 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#262626] pl-2">City</label>
                    <Input placeholder="Mumbai" className="bg-black/[0.03] border-transparent focus-visible:bg-white focus-visible:border-primary/30 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#262626] pl-2">How would you like to contribute?</label>
                  <select className="flex h-12 w-full items-center justify-between rounded-full border-transparent bg-black/[0.03] px-5 py-2 text-sm focus:outline-none focus:bg-white focus:border-primary/30 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all cursor-pointer">
                    <option value="" disabled selected>Select an option</option>
                    <option value="mentor">As a Mentor</option>
                    <option value="ambassador">As an Ambassador</option>
                    <option value="promoter">As a Promoter / Supporter</option>
                    <option value="collaborator">As a Collaborator</option>
                    <option value="institution">As an Institution / Community</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#262626] pl-2">Tell us a little about yourself</label>
                  <Textarea placeholder="Share a bit about your background and why you'd like to join..." className="min-h-[140px] bg-black/[0.03] border-transparent focus-visible:bg-white focus-visible:border-primary/30 resize-y transition-all" />
                </div>
                
                <div className="pt-4 flex justify-center">
                  <Button type="submit" size="lg" className="w-full sm:w-auto h-14 px-12 rounded-full text-base btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all">
                    Express Interest
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
