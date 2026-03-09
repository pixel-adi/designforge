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
      
      <footer className="bg-secondary text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-10"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-4xl mx-auto text-center mb-20 bg-white/5 border border-white/10 rounded-2xl p-10 backdrop-blur-sm">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 tracking-tight">
              Prepare for design with clarity.
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Join a mentoring ecosystem that helps you think better, create better, and move closer to your dream design college.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-primary hover:bg-primary/90 text-white btn-orange rounded-lg px-8 h-12 uppercase tracking-wider text-xs font-bold shadow-sm">
                Join WhatsApp Community
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-lg px-8 h-12 uppercase tracking-wider text-xs font-bold bg-transparent">
                Join Focus Batch
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-white/10 pb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="font-heading font-bold text-2xl tracking-tight mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                   <span className="text-white text-xs">D</span>
                </div>
                Designforge<span className="text-primary">.</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                A mentorship-led design community for aspirants who want more than coaching. Built to help students prepare smarter.
              </p>
            </div>
            
            <div>
              <h4 className="font-heading font-bold mb-6 uppercase tracking-widest text-xs text-primary">Explore</h4>
              <ul className="space-y-3 text-white/80 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Mentorship Tracks</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Student Results</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Live Events</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-bold mb-6 uppercase tracking-widest text-xs text-primary">Connect</h4>
              <ul className="space-y-3 text-white/80 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">WhatsApp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-xs">
            <p>© {new Date().getFullYear()} Designforge. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
