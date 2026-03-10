import { Navbar } from "@/components/navbar";
import { MentorshipTracks } from "@/components/mentorship-tracks";
import { FocusBatch } from "@/components/focus-batch";
import { Footer } from "@/components/footer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Mentorship() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
      <Navbar />
      <main className="flex-1 relative z-10">
        <div className="pt-32 pb-16 bg-white">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-heading mb-6 tracking-tight text-foreground">
              Our <span className="text-primary italic">Mentorship</span> Programs
            </h1>
            <p className="text-xl font-light text-foreground/60 leading-relaxed">
              Find the perfect track for your design journey. From focused batches to individual coaching, we've got you covered.
            </p>
          </div>
        </div>
        <MentorshipTracks />
        <FocusBatch />
      </main>
      <Footer />
    </div>
  );
}