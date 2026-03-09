import { Button } from "@/components/ui/button";

export function EventsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
        
        <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-secondary">
          Talks, meetups, critiques, and community moments
        </h2>
        <p className="text-lg text-muted-foreground font-light max-w-3xl mx-auto mb-12">
          Designforge is not just a prep destination — it is a living ecosystem where aspirants and young designers come together for conversations, review sessions, workshops, portfolio talks, interview guidance, and shared growth.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="aspect-square bg-muted/30 rounded-xl border border-border/50 flex items-center justify-center">
            <p className="text-sm font-medium text-muted-foreground">Live Critique</p>
          </div>
          <div className="aspect-square bg-muted/30 rounded-xl border border-border/50 flex items-center justify-center">
             <p className="text-sm font-medium text-muted-foreground">Workshop</p>
          </div>
          <div className="aspect-[2/1] col-span-2 bg-muted/30 rounded-xl border border-border/50 flex items-center justify-center">
             <p className="text-sm font-medium text-muted-foreground">Community Meetup</p>
          </div>
        </div>

        <Button variant="outline" className="border-border text-foreground hover:bg-muted btn-minimal px-8 bg-white uppercase tracking-wider text-xs font-bold">
          Explore Events
        </Button>

      </div>
    </section>
  );
}
