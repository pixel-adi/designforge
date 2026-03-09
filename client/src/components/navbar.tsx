import { Link } from "wouter";

export function Navbar() {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white text-sm">D</div>
              Designforge<span className="text-primary">.</span>
            </a>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/mentorship"><a className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Mentorship</a></Link>
          <Link href="/results"><a className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Results</a></Link>
          <Link href="/community"><a className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Community</a></Link>
          <Link href="/events"><a className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Events</a></Link>
        </nav>
      </div>
    </header>
  );
}
