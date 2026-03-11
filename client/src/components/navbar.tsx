import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { ChevronDown, Menu } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      <div className="w-full bg-[#111111] text-white py-1.5 px-4 text-center text-xs sm:text-sm font-light flex items-center justify-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <div className="flex items-center justify-center">
            <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium mr-2">OPEN</span>
            <span>Applications open for Focus Batch 2026<span className="hidden md:inline"> — 40-week mentored preparation.</span></span>
          </div>
          <Link href="/focus-batch" className="font-medium underline underline-offset-4 hover:text-primary transition-colors whitespace-nowrap">Apply Now</Link>
        </div>
      </div>
      <header className="w-full bg-background/95 backdrop-blur-xl border-b border-black/[0.03] transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center group">
              <img src={logoImg} alt="Designforge Logo" className="h-9 md:h-10 lg:h-12 object-contain group-hover:scale-105 transition-transform duration-500" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-3 xl:gap-6 px-4 xl:px-6 py-2.5 bg-transparent border-none">
            <Link href="/about" className="text-xs xl:text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide whitespace-nowrap">About</Link>
            <Link href="/apprenticeship" className="text-xs xl:text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide whitespace-nowrap">Apprenticeship</Link>
            <Link href="/mentorship" className="text-xs xl:text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide whitespace-nowrap">Mentorship</Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="text-xs xl:text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide flex items-center gap-1 outline-none">
                Community <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-md border-white/40 shadow-sm rounded-xl">
                <DropdownMenuItem asChild className="focus:bg-primary/5 focus:text-primary cursor-pointer py-2">
                  <Link href="/community" className="w-full">Community Hub</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-primary/5 focus:text-primary cursor-pointer py-2">
                  <Link href="/results" className="w-full">Results</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-primary/5 focus:text-primary cursor-pointer py-2">
                  <Link href="/events" className="w-full">Events</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-primary/5 focus:text-primary cursor-pointer py-2">
                  <Link href="/join-us" className="w-full">Join Us</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/focus-batch" className="text-xs xl:text-sm font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide whitespace-nowrap">Focus Batch</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Button className="hidden md:flex rounded-full px-6 md:px-8 btn-bold bg-foreground text-background hover:bg-primary transition-colors text-xs md:text-sm font-medium h-10 md:h-12">Join Community</Button>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="w-10 h-10 border-0 hover:bg-transparent">
                  <Menu className="w-6 h-6 text-foreground" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-background border-l border-black/5 pt-12 flex flex-col">
                <SheetHeader className="hidden">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex flex-col gap-4">
                    <Link href="/about" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${location === '/about' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>About</Link>
                    <Link href="/apprenticeship" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${location === '/apprenticeship' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>Apprenticeship</Link>
                    <Link href="/mentorship" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${location === '/mentorship' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>Mentorship</Link>
                    
                    <div className="flex flex-col gap-3 py-2 border-y border-black/5">
                      <p className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Community</p>
                      <Link href="/community" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground hover:text-primary pl-2">Hub</Link>
                      <Link href="/results" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground hover:text-primary pl-2">Results</Link>
                      <Link href="/events" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground hover:text-primary pl-2">Events</Link>
                      <Link href="/join-us" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground hover:text-primary pl-2">Join Us</Link>
                    </div>

                    <Link href="/focus-batch" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${location === '/focus-batch' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>Focus Batch</Link>
                  </div>
                  
                  <div className="mt-auto pb-8 pt-6">
                    <Button className="w-full rounded-full h-12 btn-bold bg-primary text-primary-foreground hover:bg-primary/90 text-base" onClick={() => setIsOpen(false)}>
                      Join Community
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </div>
  );
}
