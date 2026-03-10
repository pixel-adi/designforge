import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";

export function Navbar() {
  return (
    <header className="w-full bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-black/[0.03] transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 h-24 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center group">
            <img src={logoImg} alt="Designforge Logo" className="h-10 md:h-12 object-contain group-hover:scale-105 transition-transform duration-500" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-10 bg-white/50 px-8 py-3 rounded-full border border-white/40 shadow-sm">
          <Link href="/mentorship" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide">Mentorship</Link>
          <Link href="/results" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide">Results</Link>
          <Link href="/community" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide">Community</Link>
          <Link href="/events" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide">Events</Link>
        </nav>
        
        <div className="flex items-center">
          <Button className="hidden md:flex rounded-full px-8 btn-bold bg-foreground text-white hover:bg-primary transition-colors text-sm font-medium h-12">
            Join Waitlist
          </Button>
        </div>
      </div>
    </header>
  );
}
