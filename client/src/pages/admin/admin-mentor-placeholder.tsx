import { ClipboardList, Coins, PenTool, TrendingUp, Sparkles } from "lucide-react";

export default function AdminMentorPlaceholder() {
  const features = [
    {
      title: "Part B Evaluation System",
      description: "Direct access to review student drawing uploads, mark scores, and append annotations and loom recordings.",
      icon: PenTool,
      color: "text-red-500 bg-red-50"
    },
    {
      title: "Interactive Payout Tracker",
      description: "Transparency reports on completed evaluations, active rates, and payout structures.",
      icon: Coins,
      color: "text-emerald-500 bg-emerald-50"
    },
    {
      title: "Performance Metrics",
      description: "Insights on student success margins, average review turnaround times, and ranking scores.",
      icon: TrendingUp,
      color: "text-indigo-500 bg-indigo-50"
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Mentors & Evaluators Portal
        </div>
        
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-heading text-[#262626] font-bold tracking-tight leading-tight">
          Your Professional Dashboard is Under Construction
        </h1>
        
        {/* Description */}
        <p className="text-[#262626]/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          We are currently engineering a state-of-the-art workspace for our design mentors. When ready, you will be able to review student submissions, provide video feedback, and track payouts transparently.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 text-left">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-black/5 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.color}`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-[#262626]">{feature.title}</h3>
                <p className="text-xs text-[#262626]/50 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Support Note */}
        <div className="pt-8">
          <p className="text-xs text-foreground/45 font-medium flex items-center justify-center gap-1.5">
            <ClipboardList className="w-4 h-4" /> Need immediate assistance? Contact our administrative team at support@designforge.co.in
          </p>
        </div>
      </div>
    </div>
  );
}
