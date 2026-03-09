import { ArrowRight } from "lucide-react";
import mentor1 from "@/assets/images/mentor_1.jpg";
import mentor2 from "@/assets/images/mentor_2.jpg";

const shows = [
  {
    id: 1,
    title: "NID DAT BDes Mentorship",
    description: "Built to strengthen thinking, observation, expression, and confidence for NID DAT Prelims and Mains.",
    tag: "Aspirants",
    color: "bg-orange-50",
    textColor: "text-orange-900",
    image: mentor1,
  },
  {
    id: 2,
    title: "Portfolio & Interview Support",
    description: "Beyond exam prep. Learn storytelling, mock reviews, and how to present your work with confidence.",
    tag: "Young Designers",
    color: "bg-purple-50",
    textColor: "text-purple-900",
    image: mentor2,
  },
  {
    id: 3,
    title: "UCEED Mentorship",
    description: "Tackle UCEED's unique problem-solving and visualization challenges with targeted guidance.",
    tag: "Aspirants",
    color: "bg-blue-50",
    textColor: "text-blue-900",
    image: mentor1,
  }
];

export function FeaturedShows() {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-bold tracking-widest text-primary uppercase">02</span>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Mentorship built around <br className="hidden md:block"/> your journey
              </h2>
            </div>
          </div>
          <div className="max-w-md text-muted-foreground text-lg">
            Our goal is to build designers with three key characteristics—they observe deeply, they think critically, and they express clearly.
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shows.map((show) => (
            <div key={show.id} className={`${show.color} rounded-[2rem] p-8 flex flex-col h-full group hover:-translate-y-2 transition-transform duration-300 ease-out`}>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-white/60 text-xs font-bold uppercase tracking-wider mb-4">
                  {show.tag}
                </span>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6">
                  <img 
                    src={show.image} 
                    alt={show.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              
              <div className="mt-auto">
                <h3 className={`text-2xl font-bold mb-3 ${show.textColor}`}>{show.title}</h3>
                <p className={`${show.textColor} opacity-80 mb-8 leading-relaxed`}>
                  {show.description}
                </p>
                <a href="#" className={`inline-flex items-center gap-2 font-bold ${show.textColor} hover:opacity-70 transition-opacity`}>
                  Explore Track
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
