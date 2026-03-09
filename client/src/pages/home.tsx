import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { FeaturedShows } from "@/components/featured-shows";
import { WhyUs } from "@/components/why-us";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main>
        <Hero />
        <WhyUs />
        <FeaturedShows />
        
        {/* Call to action section */}
        <section className="py-32 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Start building<br/>your design future.
            </h2>
            <p className="text-white/80 text-xl max-w-2xl mx-auto mb-12">
              Join a community that helps you grow with clarity, critique, and confidence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-colors shadow-xl">
                Join WhatsApp Community
              </button>
              <button className="bg-transparent text-white border-2 border-white/30 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
                Join Focus Batch
              </button>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="font-heading font-bold text-2xl tracking-tighter flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-bold leading-none">D</span>
                </div>
                Designforge
              </div>
              <p className="text-white/60 text-sm max-w-xs">
                A serious design mentoring ecosystem for future designers.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Mentorship</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">NID DAT</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">UCEED</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">CEED</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Portfolios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Community</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Events</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Results</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">WhatsApp</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            © {new Date().getFullYear()} Designforge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
