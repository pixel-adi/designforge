import { Button } from "@/components/ui/button";

const tracks = [
  {
    title: "NID DAT BDes",
    subtitle: "Observation & Creativity",
    description: "Build creativity, observation, visualisation, and confidence for prelims, studio tests, and interviews.",
    price: "Structured Prep",
    popular: false,
  },
  {
    title: "NID DAT MDes",
    subtitle: "Advanced Portfolios",
    description: "Develop stronger problem framing, portfolio depth, articulation, and design maturity for advanced admissions.",
    price: "Deeper Critique",
    popular: true,
  },
  {
    title: "UCEED & CEED",
    subtitle: "Analytical Design",
    description: "Prepare with stronger basics, visual reasoning, sketching, analytical thinking, and concept communication.",
    price: "Systematic Guidance",
    popular: false,
  }
];

export function MentorshipTracks() {
  return (
    <section className="py-24 bg-dots">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">
            Mentorship for every pathway
          </h2>
          <p className="text-muted-foreground">
            Whether you are preparing for NID DAT, UCEED, CEED, portfolios, or interviews, we give you the environment to grow.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 lg:gap-8">
          {tracks.map((track, i) => (
            <div 
              key={i} 
              className={`bg-white rounded-xl border ${track.popular ? 'border-primary shadow-sm md:-translate-y-4 relative' : 'border-border/60'} p-8 w-full md:w-1/3 flex flex-col text-center`}
            >
              <p className="text-primary text-sm font-semibold mb-2">{track.subtitle}</p>
              <h3 className="text-2xl font-serif font-bold text-foreground mb-4 pb-4 border-b border-border/50">{track.title}</h3>
              
              <div className="mb-6">
                 <p className="text-2xl font-bold text-secondary">{track.price}</p>
                 <p className="text-xs text-muted-foreground mt-1">tailored for you</p>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                {track.description}
              </p>
              
              <Button className={`w-full ${track.popular ? 'btn-orange text-white' : 'bg-white border border-primary text-primary hover:bg-primary/5'} rounded-md uppercase tracking-wider text-xs font-bold h-12`}>
                Explore Track
              </Button>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
