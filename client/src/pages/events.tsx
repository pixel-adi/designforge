import { Navbar } from "@/components/navbar";
import { EventsSection } from "@/components/events-section";
import { Footer } from "@/components/footer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Events() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
      <Navbar />
      <main className="flex-1 relative z-10">
        <div className="pt-32 pb-16 bg-white">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-heading mb-6 tracking-tight text-foreground">
              Live <span className="text-pop-3 italic">Events</span>
            </h1>
            <p className="text-xl font-light text-foreground/60 leading-relaxed">
              Join our regular talks, meetups, and open critique sessions to broaden your design perspective.
            </p>
          </div>
        </div>
        <EventsSection />
      </main>
      <Footer />
    </div>
  );
}