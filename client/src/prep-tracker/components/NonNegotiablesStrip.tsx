import { CheckCircle2, Circle, ShieldCheck } from 'lucide-react';

interface NonNegotiablesStripProps {
  drillDoneDays: number; // 0 to 6
  critiqueSubmitted: boolean;
  simulationLogged: boolean;
  sundayReviewDone: boolean;
  isSimulationRequiredThisWeek: boolean;
  className?: string;
}

export function NonNegotiablesStrip({
  drillDoneDays = 0,
  critiqueSubmitted = false,
  simulationLogged = false,
  sundayReviewDone = false,
  isSimulationRequiredThisWeek = true,
  className = '',
}: NonNegotiablesStripProps) {
  const items = [
    {
      title: 'Daily Drill',
      status: `${Math.min(drillDoneDays, 6)}/6 days`,
      done: drillDoneDays >= 6,
      sub: '45 min Mon–Sat',
    },
    {
      title: 'Weekly Critique',
      status: critiqueSubmitted ? 'Submitted' : 'Pending',
      done: critiqueSubmitted,
      sub: 'Thursday 60 min',
    },
    {
      title: 'Simulation',
      status: !isSimulationRequiredThisWeek
        ? 'Timed brief'
        : simulationLogged
        ? 'Completed'
        : 'Pending',
      done: simulationLogged,
      sub: 'Saturday paper',
    },
    {
      title: 'Sunday Review',
      status: sundayReviewDone ? 'Completed' : 'Pending',
      done: sundayReviewDone,
      sub: 'Written 30 min',
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white p-4 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#262626]">
            The Four Weekly Non-Negotiables
          </h3>
        </div>
        <span className="text-[11px] text-foreground/50 font-medium hidden sm:inline">
          Protect these every week without compromise
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border transition-all ${
              item.done
                ? 'bg-green-50/70 border-green-200'
                : 'bg-black/[0.02] border-black/5'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-[#262626]">{item.title}</span>
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-foreground/20 shrink-0" />
              )}
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span
                className={`text-xs font-black ${
                  item.done ? 'text-green-700' : 'text-foreground/70'
                }`}
              >
                {item.status}
              </span>
            </div>
            <span className="text-[10px] text-foreground/40 block mt-0.5">{item.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
