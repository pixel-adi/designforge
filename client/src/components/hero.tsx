import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="pt-32 pb-24 relative overflow-hidden bg-dots">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          
          <div className="max-w-xl">
            <p className="text-muted-foreground font-medium mb-4 text-xs uppercase tracking-widest text-secondary">
              Mentorship-led. Community-first.
            </p>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.1] mb-6 text-foreground">
              Get mentored, not coached, for your dream <span className="text-primary">design college.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Designforge is a design aspirant-led community mentored by NIDans, IITians, and working designers — built to help students prepare smarter for NID DAT, UCEED, CEED, portfolios, and interviews.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="rounded-md h-12 px-8 text-white btn-orange font-bold uppercase tracking-wide text-xs">
                Join WhatsApp Community
              </Button>
            </div>
          </div>
          
          <div className="relative flex justify-center items-center py-10">
            {/* Minimalist doodle-like illustration */}
            <div className="relative w-full max-w-[450px] aspect-[4/3] flex items-center justify-center">
              
              {/* Abstract decorative lines imitating the reference doodle */}
              <svg className="absolute inset-0 w-full h-full text-foreground/80 stroke-current" viewBox="0 0 400 300" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Sunburst / explosion lines */}
                <path d="M200 40 L200 20" />
                <path d="M200 260 L200 280" />
                <path d="M100 150 L80 150" />
                <path d="M300 150 L320 150" />
                <path d="M130 80 L115 65" />
                <path d="M270 80 L285 65" />
                <path d="M130 220 L115 235" />
                <path d="M270 220 L285 235" />
                
                {/* Character doodle mock */}
                <circle cx="200" cy="120" r="25" />
                <path d="M200 145 L200 220" />
                <path d="M200 170 L150 140" />
                <path d="M200 170 L250 140" />
                <path d="M200 220 L170 280" />
                <path d="M200 220 L230 280" />
                
                {/* Glasses */}
                <path d="M185 115 H195 M205 115 H215" strokeWidth="2" />
                
                {/* Book or portfolio */}
                <rect x="120" y="110" width="30" height="40" rx="2" transform="rotate(-15 120 110)" />
              </svg>
              
              {/* Orange highlight blobs */}
              <div className="absolute top-[30%] left-[25%] w-8 h-8 bg-primary/20 rounded-full blur-md" />
              <div className="absolute bottom-[20%] right-[30%] w-12 h-12 bg-primary/30 rounded-full blur-lg" />
              
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
