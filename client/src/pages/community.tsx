import { Navbar } from "@/components/navbar";
import { CommunitySection } from "@/components/community-section";
import { Footer } from "@/components/footer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Community() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
      <Navbar />
      <main className="flex-1 relative z-10">
        <div className="pt-32 pb-16 bg-background">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-heading mb-6 tracking-tight text-foreground">
              Join the <span className="text-pop-1 italic">Community</span>
            </h1>
            <p className="text-xl font-light text-foreground/60 leading-relaxed">
              Designforge is not just a prep destination — it is a living ecosystem where aspirants and young designers come together.
            </p>
          </div>
        </div>
        <CommunitySection />
      </main>
      <Footer />
    </div>
  );
}