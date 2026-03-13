import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { PainSection } from "@/components/pain-section";
import { DifferenceSection } from "@/components/difference-section";
import { MentorshipTracks } from "@/components/mentorship-tracks";
import { CommunitySection } from "@/components/community-section";
import { PhilosophySection } from "@/components/philosophy-section";
import { FocusBatch } from "@/components/focus-batch";
import { AchieversSection } from "@/components/achievers-section";
import { FoundersSection } from "@/components/founders-section";
import { EventsSection } from "@/components/events-section";
import { Footer } from "@/components/footer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
      <Navbar />
      <main className="flex-1 relative z-10">
        <Hero />
        <PainSection />
        <DifferenceSection />
        <MentorshipTracks />
        <FocusBatch />
        <CommunitySection />
        <AchieversSection />
        <PhilosophySection />
        <FoundersSection />
        <EventsSection />
      </main>
      
      <Footer />
    </div>
  );
}
