export function FoundersSection() {
  return (
    <section className="py-24 bg-white border-y border-border/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-secondary">
            Meet the founders
          </h2>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Together with NIDans, IITians, and designers from the community, they are shaping Designforge into a serious mentoring ecosystem for design growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          
          <div className="bg-muted/10 p-8 rounded-2xl border border-border/50 text-center">
            <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-6 border-2 border-white shadow-sm"></div>
            <h3 className="text-xl font-bold text-secondary mb-2">Aditya Sharma</h3>
            <p className="text-primary text-sm uppercase tracking-widest font-semibold mb-4">Principal UX Architect</p>
            <p className="text-muted-foreground font-light leading-relaxed">
              Mentor, and design community builder focused on helping aspirants and young designers grow through thoughtful critique, structured guidance, and deeper design understanding.
            </p>
          </div>

          <div className="bg-muted/10 p-8 rounded-2xl border border-border/50 text-center">
            <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-6 border-2 border-white shadow-sm"></div>
            <h3 className="text-xl font-bold text-secondary mb-2">Siddhi Patil</h3>
            <p className="text-primary text-sm uppercase tracking-widest font-semibold mb-4">Mentor & Co-founder</p>
            <p className="text-muted-foreground font-light leading-relaxed">
              Focused on helping students build clarity, confidence, creative growth, and a healthier preparation process rooted in empathy and consistency.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
