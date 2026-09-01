import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";
import { useState, useEffect } from "react";
import { RegistrationSheet } from "@/components/registration-sheet";
import { CohortLeadModal } from "@/components/cohort-lead-modal";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);

  // Auto-open cohort modal on first landing (once per session)
  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem("df_cohort_modal_seen");
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsCohortModalOpen(true);
        sessionStorage.setItem("df_cohort_modal_seen", "1");
      }, 2500); // Wait 2.5s after page load
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="sticky top-0 z-40 w-full flex flex-col">
      <div className="w-full bg-[#111111] text-white py-1.5 px-4 text-center text-xs sm:text-sm font-light flex items-center justify-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <div className="flex items-center justify-center">
            <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium mr-2">OPEN</span>
            <span>Applications open for Focus Batch 26-27<span className="hidden md:inline"> — 40-week mentored preparation.</span></span>
          </div>
          <button onClick={() => setIsRegOpen(true)} className="font-medium underline underline-offset-4 hover:text-primary transition-colors whitespace-nowrap">Apply Now</button>
        </div>
      </div>
      <RegistrationSheet open={isRegOpen} onOpenChange={setIsRegOpen} defaultProgram="Focus Batch" />
      <CohortLeadModal open={isCohortModalOpen} onOpenChange={setIsCohortModalOpen} />
      <header className="w-full bg-background/95 backdrop-blur-xl border-b border-black/[0.03] transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center group">
              <img src={logoImg} alt="Designforge Logo" className="h-9 md:h-10 lg:h-12 object-contain group-hover:scale-105 transition-transform duration-500" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-3 xl:gap-6 px-4 xl:px-6 py-2.5 bg-transparent border-none">
            <Link href="/about" className={`text-xs xl:text-sm font-medium transition-colors tracking-wide whitespace-nowrap ${location === '/about' ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}>About</Link>
            <Link href="/mentorship" className={`text-xs xl:text-sm font-medium transition-colors tracking-wide whitespace-nowrap ${location === '/mentorship' ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}>Mentorship</Link>
            <Link href="/apprenticeship" className={`text-xs xl:text-sm font-medium transition-colors tracking-wide whitespace-nowrap ${location === '/apprenticeship' ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}>Apprenticeship</Link>
            <Link href="/focus-batch" className={`text-xs xl:text-sm font-medium transition-colors tracking-wide whitespace-nowrap ${location === '/focus-batch' ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}>Focus Batch</Link>
            <Link href="/courses/ai-native-ux" className={`text-xs xl:text-sm font-medium transition-colors tracking-wide whitespace-nowrap relative inline-flex items-center gap-1.5 ${location === '/courses/ai-native-ux' ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}>
              AI-Native UX
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="outline" asChild className="hidden md:flex rounded-full px-6 h-10 md:h-12 text-xs md:text-sm font-medium border-primary/20 text-primary hover:bg-primary/5 transition-colors">
              <Link href="/portal/login">
                Student Portal
              </Link>
            </Button>
            <Button asChild className="hidden md:flex rounded-full px-6 md:px-8 btn-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs md:text-sm font-medium h-10 md:h-12 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5">
              <a href="https://chat.whatsapp.com/FJGc9od7fbz7iRXsFnzYU0" target="_blank" rel="noopener noreferrer">
                Join Community
              </a>
            </Button>

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
                    <Link href="/mentorship" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${location === '/mentorship' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>Mentorship</Link>
                    <Link href="/apprenticeship" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${location === '/apprenticeship' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>Apprenticeship</Link>
                    <Link href="/focus-batch" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${location === '/focus-batch' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>Focus Batch</Link>
                    <Link href="/courses/ai-native-ux" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors relative inline-flex items-center gap-2 ${location === '/courses/ai-native-ux' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
                      AI-Native UX
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    </Link>
                  </div>

                  <div className="mt-auto pb-8 pt-6 flex flex-col gap-3">
                    <Button variant="outline" asChild className="w-full rounded-full h-12 text-base border-primary/20 text-primary hover:bg-primary/5" onClick={() => setIsOpen(false)}>
                      <Link href="/portal/login">
                        Student Portal
                      </Link>
                    </Button>
                    <Button asChild className="w-full rounded-full h-12 btn-bold bg-primary text-primary-foreground hover:bg-primary/90 text-base" onClick={() => setIsOpen(false)}>
                      <a href="https://chat.whatsapp.com/FJGc9od7fbz7iRXsFnzYU0" target="_blank" rel="noopener noreferrer">
                        Join Community
                      </a>
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
