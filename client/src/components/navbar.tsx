import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="font-heading font-bold text-2xl tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold leading-none">D</span>
              </div>
              Designforge
            </a>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/mentorship"><a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Mentorship</a></Link>
          <Link href="/results"><a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Results</a></Link>
          <Link href="/events"><a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Events</a></Link>
          <Link href="/community"><a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Community</a></Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden lg:inline-flex rounded-full px-6 border-primary/20 hover:bg-primary/5 text-primary">
            Join Waitlist
          </Button>
          <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white shadow-sm">
            Join Community
          </Button>
        </div>
      </div>
    </header>
  );
}
