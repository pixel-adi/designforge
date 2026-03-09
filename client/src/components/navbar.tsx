import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";

export function Navbar() {
  return (
    <header className="w-full bg-background/95 backdrop-blur-md sticky top-0 z-50 border-b-2 border-foreground shadow-[0_2px_0_0_rgba(0,0,0,1)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="flex items-center">
              <img src={logoImg} alt="Designforge Logo" className="h-8 md:h-10 object-contain" />
            </a>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/mentorship"><a className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Mentorship</a></Link>
          <Link href="/results"><a className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Results</a></Link>
          <Link href="/community"><a className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Community</a></Link>
          <Link href="/events"><a className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Events</a></Link>
        </nav>
        
        <div className="flex items-center">
          <Button className="hidden md:flex rounded-lg px-6 btn-bold btn-yellow-pop uppercase tracking-wider text-xs">
            Join Waitlist
          </Button>
        </div>
      </div>
    </header>
  );
}
