import { Button } from "@/components/ui/button";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";

export function Footer() {
  return (
    <footer className="bg-[#111111] text-white pt-32 pb-12 relative overflow-hidden mt-20 md:mt-32 rounded-t-[3rem] z-50 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)]">
      {/* Soft atmospheric glowing backgrounds */}
      <div className="absolute top-0 left-1/4 w-[60vw] h-[60vw] bg-primary/20 rounded-full blur-[150px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="max-w-5xl mx-auto text-center mb-32 flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl font-heading mb-8 tracking-tight text-white leading-tight">
            Prepare for design <br/><span className="text-primary italic">with absolute clarity.</span>
          </h2>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-12 max-w-2xl mx-auto leading-relaxed">
            Join a mentoring ecosystem that helps you think better, create better, and grow into the designer you want to be.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <Button className="btn-bold btn-primary-pop rounded-full px-10 h-16 text-base w-full sm:w-auto text-white">
              Join WhatsApp Community
            </Button>
            <Button className="btn-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-full px-10 h-16 text-base w-full sm:w-auto backdrop-blur-sm">
              Explore Focus Batch
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 mb-16 border-t border-white/20 pt-16">
          <div className="md:col-span-4 lg:col-span-5">
            <div className="mb-8 bg-white p-4 rounded-2xl border border-white/20 w-fit backdrop-blur-sm">
              <img src={logoImg} alt="Designforge Logo" className="h-10 object-contain" />
            </div>
            <p className="text-white/70 text-lg font-light leading-relaxed max-w-sm">
              A mentorship-led design community for aspirants who want more than just standard coaching.
            </p>
          </div>
          
          <div className="md:col-span-2 md:col-start-7">
            <h4 className="font-heading text-lg mb-6 text-white">Explore</h4>
            <ul className="space-y-4 text-white/80 font-light">
              <li><a href="#" className="hover:text-primary transition-colors">Mentorship Tracks</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Student Results</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Live Events</a></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="font-heading text-lg mb-6 text-white">Connect</h4>
            <ul className="space-y-4 text-white/80 font-light">
              <li><a href="#" className="hover:text-primary transition-colors">WhatsApp</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-heading text-lg mb-6 text-white">Legal</h4>
            <ul className="space-y-4 text-white/80 font-light">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-sm font-light border-t border-white/20 pt-8">
          <p>© {new Date().getFullYear()} Designforge. All rights reserved.</p>
          <p>Designed with purpose.</p>
        </div>
      </div>
    </footer>
  );
}
