import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";

export function Navbar() {
  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      <div className="w-full bg-[#111111] text-white py-1.5 px-4 text-center text-xs sm:text-sm font-light leading-tight flex items-center justify-center">
        <p className="flex items-center justify-center gap-2 flex-wrap m-0 p-0">
          <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium mr-2">OPEN</span>
          Applications open for Designforge Focus Batch 2026 — 40-week mentored preparation.
          <Link href="/focus-batch" className="font-medium underline underline-offset-4 ml-2 hover:text-primary transition-colors">Apply Now</Link>
        </p>
      </div>
      <header className="w-full bg-background/95 backdrop-blur-xl border-b border-black/[0.03] transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center group">
              <img src={logoImg} alt="Designforge Logo" className="h-8 md:h-12 object-contain group-hover:scale-105 transition-transform duration-500" />
            </Link>
          </div>

          <nav className="hidden xl:flex items-center gap-6 bg-white/50 px-6 py-3 rounded-full border border-white/40">
            <Link href="/about" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide whitespace-nowrap">About</Link>
            <Link href="/apprenticeship" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide whitespace-nowrap">Apprenticeship</Link>
            <Link href="/mentorship" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide whitespace-nowrap">Mentorship</Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide flex items-center gap-1 outline-none">
                Community <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/community" className="w-full cursor-pointer">Community Hub</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/results" className="w-full cursor-pointer">Results</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/events" className="w-full cursor-pointer">Events</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/join-us" className="w-full cursor-pointer">Join Us</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/focus-batch" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide whitespace-nowrap">Focus Batch</Link>
          </nav>
          
          <div className="flex items-center">
            <Button className="hidden md:flex rounded-full px-6 md:px-8 btn-bold bg-foreground text-background hover:bg-primary transition-colors text-xs md:text-sm font-medium h-10 md:h-12">
              Join Waitlist
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}
