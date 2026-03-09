import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { PainSection } from "@/components/pain-section";
import { DifferenceSection } from "@/components/difference-section";
import { StatsSection } from "@/components/stats-section";
import { MentorshipTracks } from "@/components/mentorship-tracks";
import { CommunitySection } from "@/components/community-section";
import { FocusBatch } from "@/components/focus-batch";
import { AchieversSection } from "@/components/achievers-section";
import { PhilosophySection } from "@/components/philosophy-section";
import { FoundersSection } from "@/components/founders-section";
import { EventsSection } from "@/components/events-section";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main>
        <Hero />
        <PainSection />
        <DifferenceSection />
        <StatsSection />
        <MentorshipTracks />
        <CommunitySection />
        <FocusBatch />
        <AchieversSection />
        <PhilosophySection />
        <FoundersSection />
        <EventsSection />
      </main>
      
      {/* FINAL CTA AND FOOTER UNIFIED */}
      <footer className="bg-foreground text-white py-24 relative overflow-hidden border-t-8 border-primary">
        <div className="absolute inset-0 bg-grid-white opacity-5"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-4xl mx-auto text-center mb-28 struct-card bg-pop-1/10 border-white/20 p-12 backdrop-blur-md shadow-none hover:shadow-none translate-y-0">
            <h2 className="text-4xl md:text-6xl font-heading font-black mb-6 tracking-tight text-white">
              Prepare for design with <span className="text-pop-3">clarity.</span>
            </h2>
            <p className="text-white/80 text-xl font-medium mb-10 max-w-2xl mx-auto">
              Join a mentoring ecosystem that helps you think better, create better, and move closer to your dream design college.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button className="btn-bold btn-yellow-pop rounded-xl px-10 h-16 uppercase tracking-wider text-sm font-black w-full sm:w-auto">
                Join WhatsApp Community
              </Button>
              <Button className="btn-bold bg-white text-foreground rounded-xl px-10 h-16 uppercase tracking-wider text-sm font-black w-full sm:w-auto">
                Join Focus Batch
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 border-b-2 border-white/20 pb-16">
            <div className="md:col-span-4">
              <div className="font-heading font-black text-3xl tracking-tight mb-6 flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-pop-3 rounded-lg border-2 border-white flex items-center justify-center">
                   <span className="text-foreground text-lg">D</span>
                </div>
                Designforge<span className="text-primary text-4xl leading-none">.</span>
              </div>
              <p className="text-white/70 text-base font-medium leading-relaxed max-w-sm">
                A mentorship-led design community for aspirants who want more than coaching. Built to help students prepare smarter.
              </p>
            </div>
            
            <div className="md:col-span-2 md:col-start-7">
              <h4 className="font-heading font-black mb-6 uppercase tracking-widest text-xs text-pop-1">Explore</h4>
              <ul className="space-y-4 text-white font-bold text-sm">
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">Mentorship Tracks</a></li>
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">Student Results</a></li>
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">Community</a></li>
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">Live Events</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="font-heading font-black mb-6 uppercase tracking-widest text-xs text-pop-1">Connect</h4>
              <ul className="space-y-4 text-white font-bold text-sm">
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">WhatsApp</a></li>
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">Instagram</a></li>
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">Contact Us</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-heading font-black mb-6 uppercase tracking-widest text-xs text-pop-1">Legal</h4>
              <ul className="space-y-4 text-white font-bold text-sm">
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-pop-3 hover:translate-x-1 inline-block transition-all">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-xs font-bold uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Designforge. All rights reserved.</p>
            <p>Made with intent.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
