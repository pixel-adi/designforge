export function AchieversSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-semibold mb-6 text-secondary">
            Real journeys. Real ranks. Real growth.
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Behind every rank is a process — uncertainty, effort, iteration, feedback, and breakthrough. We are proud not only of the results our students achieve, but of the confidence and clarity they build along the way.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { rank: "AIR 12", exam: "NID BDes" },
            { rank: "AIR 4", exam: "NID MDes" },
            { rank: "AIR 28", exam: "UCEED" },
            { rank: "AIR 15", exam: "CEED" },
          ].map((item, i) => (
            <div key={i} className="bg-muted/30 border border-border/50 rounded-xl p-6 text-center">
               <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 border border-border/80"></div>
               <p className="font-bold text-lg text-secondary">{item.rank}</p>
               <p className="text-sm text-muted-foreground font-medium">{item.exam}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
           <a href="#" className="inline-block text-primary font-bold hover:underline underline-offset-4">Explore student stories →</a>
        </div>
      </div>
    </section>
  );
}
