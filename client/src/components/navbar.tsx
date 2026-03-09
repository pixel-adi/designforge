import { Link } from "wouter";

export function Navbar() {
  return (
    <header className="w-full bg-transparent absolute top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Designforge<span className="text-primary">.</span>
            </a>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/mentorship"><a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Mentorship</a></Link>
          <Link href="/results"><a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Results</a></Link>
          <Link href="/community"><a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Community</a></Link>
          <Link href="/events"><a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Events</a></Link>
        </nav>
      </div>
    </header>
  );
}
