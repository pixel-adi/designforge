import { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles, Target, AlertTriangle } from 'lucide-react';

interface ExamCountdownTimerProps {
  currentDayNum?: number;
  phaseName?: string;
  className?: string;
}

export function ExamCountdownTimer({
  currentDayNum = 1,
  phaseName = 'Orientation & Foundation',
  className = '',
}: ExamCountdownTimerProps) {
  // Target date: Sunday 20 December 2026, 10:00:00 AM IST
  const targetDate = new Date('2026-12-20T10:00:00+05:30').getTime();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br from-[#1C1C1E] via-[#2A1B19] to-[#1F1413] p-5 text-white shadow-xl ${className}`}
    >
      {/* Background Accent Glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: Info */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/30">
              <Sparkles className="h-3.5 w-3.5" />
              NID DAT 2027 Prelims
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/70">
              <Calendar className="h-3.5 w-3.5" />
              Sun 20 Dec 2026
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
              {phaseName}
            </span>
          </div>

          <h2 className="text-lg font-extrabold tracking-tight md:text-xl">
            {timeLeft.isPast
              ? 'NID DAT 2027 Prelims Exam Day'
              : 'Countdown to the Prelims'}
          </h2>
          <p className="text-xs text-white/60">
            Official pen-and-paper test across 17 test cities in India. Practice papers run 3 hours.
          </p>
        </div>

        {/* Right: Live Timer Digits */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 min-w-[58px] sm:min-w-[68px] backdrop-blur-md">
            <span className="font-mono text-2xl font-black text-white sm:text-3xl">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Days
            </span>
          </div>

          <span className="font-mono text-xl font-bold text-white/40">:</span>

          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 min-w-[58px] sm:min-w-[68px] backdrop-blur-md">
            <span className="font-mono text-2xl font-black text-white sm:text-3xl">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Hours
            </span>
          </div>

          <span className="font-mono text-xl font-bold text-white/40">:</span>

          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 min-w-[58px] sm:min-w-[68px] backdrop-blur-md">
            <span className="font-mono text-2xl font-black text-white sm:text-3xl">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Mins
            </span>
          </div>

          <span className="font-mono text-xl font-bold text-white/40">:</span>

          <div className="flex flex-col items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 min-w-[58px] sm:min-w-[68px] backdrop-blur-md">
            <span className="font-mono text-2xl font-black text-primary sm:text-3xl">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
              Secs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
