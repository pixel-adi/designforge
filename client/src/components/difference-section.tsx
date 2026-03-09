import { Target, Compass, BookOpen, Lightbulb } from "lucide-react";

export function DifferenceSection() {
  return (
    <section className="py-24 relative bg-dots">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="text-center mb-24">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">
            Why Designforge is built around mentorship
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Coaching often tries to standardise performance. Mentorship helps each student discover how they think, where they struggle, and how they can grow meaningfully.
          </p>
        </div>

        {/* Scattered layout reminiscent of the image's pain points section */}
        <div className="relative min-h-[500px] w-full max-w-4xl mx-auto">
          
          <div className="md:absolute top-0 left-0 md:w-[45%] mb-8 md:mb-0">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <BookOpen strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">Coaching teaches formats</p>
              <h3 className="text-xl font-serif font-bold text-foreground">Mentorship builds judgement.</h3>
            </div>
          </div>

          <div className="md:absolute top-12 right-0 md:w-[45%] mb-8 md:mb-0 flex flex-col items-center md:items-end text-center md:text-right">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Target strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">Coaching pushes repetition</p>
            <h3 className="text-xl font-serif font-bold text-foreground">Mentorship sharpens observation.</h3>
          </div>

          {/* Central doodle connecting them */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 items-center justify-center opacity-40">
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-foreground" fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 4">
               <path d="M20 20 Q 50 10 80 20" />
               <path d="M80 80 Q 50 90 20 80" />
               <path d="M20 20 Q 10 50 20 80" />
               <path d="M80 20 Q 90 50 80 80" />
            </svg>
          </div>

          <div className="md:absolute bottom-12 left-8 md:w-[45%] mb-8 md:mb-0">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Lightbulb strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">Expected vs Unfamiliar</p>
              <h3 className="text-xl font-serif font-bold text-foreground">We prepare you for unfamiliar challenges.</h3>
            </div>
          </div>

          <div className="md:absolute bottom-0 right-8 md:w-[45%] mb-8 md:mb-0 flex flex-col items-center md:items-end text-center md:text-right">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Compass strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">Beyond the exam</p>
            <h3 className="text-xl font-serif font-bold text-foreground">Mentorship continues into design growth.</h3>
          </div>

        </div>
        
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-lg font-serif font-bold text-primary">
            "We don't want students to look prepared. We want them to become stronger thinkers and makers."
          </p>
        </div>

      </div>
    </section>
  );
}
