import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Handle scroll visibility
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled past 500px
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-foreground text-background hover:bg-primary transition-all duration-300 animate-in fade-in zoom-in"
      size="icon"
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-6 h-6" />
    </Button>
  );
}
