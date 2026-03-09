import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b-2 border-foreground shadow-[0_2px_0_0_rgba(0,0,0,1)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-pop-3 border-2 border-foreground flex items-center justify-center text-foreground font-bold text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)]">D</div>
              Designforge<span className="text-primary text-3xl leading-none">.</span>
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
