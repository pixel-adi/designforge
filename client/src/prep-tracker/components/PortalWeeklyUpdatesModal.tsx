import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, Rocket, Zap, Wrench, CheckCircle2, ChevronRight, Bell } from 'lucide-react';

export interface WeeklyRelease {
  version: string;
  weekLabel: string;
  releaseDate: string; // Indian date format e.g. "Wed 23 Sep 2026"
  isLatest?: boolean;
  items: {
    type: 'feature' | 'improvement' | 'fix';
    title: string;
    description: string;
  }[];
}

export const PORTAL_RELEASES: WeeklyRelease[] = [
  {
    version: 'v2.4.0',
    weekLabel: 'Week 4 Update',
    releaseDate: 'Wed 23 Sep 2026',
    isLatest: true,
    items: [
      {
        type: 'feature',
        title: 'Multi-Exam Tracker Support',
        description: 'Easily switch between NID DAT (UG/PG), UCEED 2027, CEED 2027, and NIFT (UG/PG) with calibrated target exam countdowns and dedicated curriculum roadmaps.',
      },
      {
        type: 'feature',
        title: 'Task Counts on 92-Day Roadmap Grid',
        description: 'The 92-day roadmap calendar now displays exact daily task counts and completion badges (e.g. "3 tasks", "2/3 done") on each day cell.',
      },
      {
        type: 'feature',
        title: 'Quick "Today" Reset Button',
        description: 'Reset your daily workout strip view instantly to today\'s date with a single tap, no matter how far back or forward you navigate.',
      },
      {
        type: 'improvement',
        title: 'Streamlined Analytics & Error Ledger',
        description: 'Redesigned side panel with a responsive 2-column layout to prevent content clipping, boxiness, and horizontal overflow on all screen sizes.',
      },
      {
        type: 'fix',
        title: 'Session Persistence & Faster Loading',
        description: 'Fixed profile setup modal reappearing after browser refresh and sped up initial tracker calibration to sub-50ms via local caching.',
      },
    ],
  },
  {
    version: 'v2.3.0',
    weekLabel: 'Week 3 Update',
    releaseDate: 'Wed 16 Sep 2026',
    items: [
      {
        type: 'feature',
        title: 'Interactive Error Ledger',
        description: 'Track mistakes across Concept, Time, Clarity, and Care buckets with dedicated root-cause tags and remediation drills.',
      },
      {
        type: 'improvement',
        title: 'Daily Non-Negotiables Counter',
        description: 'Weekly tracker highlights your 4 core disciplines: Daily Drill (Mon-Sat), Critique (Thu), Full Mock (Sat), and Sunday Review.',
      },
      {
        type: 'fix',
        title: 'Automatic WhatsApp Contact Sync',
        description: 'Mandatory phone number collection with WhatsApp format validation to ensure seamless mentor critique deliveries.',
      },
    ],
  },
  {
    version: 'v2.2.0',
    weekLabel: 'Week 2 Update',
    releaseDate: 'Wed 09 Sep 2026',
    items: [
      {
        type: 'feature',
        title: 'Diagnostic Band Calibration',
        description: '6-axis baseline diagnostic evaluation (Foundation, Standard, Sharpening bands) with re-scoring benchmark set for Week 8.',
      },
      {
        type: 'improvement',
        title: 'Prelims Timing & Protocol Guidance',
        description: 'Calibrated 3-hour practice exam simulation timers with strict adherence to NID Admissions Handbook 2027-28 dates.',
      },
    ],
  },
  {
    version: 'v2.1.0',
    weekLabel: 'Week 1 Launch',
    releaseDate: 'Tue 01 Sep 2026',
    items: [
      {
        type: 'feature',
        title: '92-Day Studio & Strategy Curriculum',
        description: 'Official rollout of the Designforge Self-Study Outline Edition 02 operating system for all 2027 design aspirants.',
      },
      {
        type: 'feature',
        title: 'Class Notes & Lecture Artifacts',
        description: 'Comprehensive milestone study notes unlocked for verified candidates with step-by-step sketch guides and case studies.',
      },
    ],
  },
];

const STORAGE_KEY = 'df_portal_updates_last_read';
const CURRENT_VERSION = PORTAL_RELEASES[0]?.version || 'v2.4.0';

interface PortalWeeklyUpdatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PortalWeeklyUpdatesModal({ open, onOpenChange }: PortalWeeklyUpdatesModalProps) {
  useEffect(() => {
    if (open) {
      try {
        localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
      } catch (e) {
        // ignore local storage errors
      }
    }
  }, [open]);

  const getTypeBadge = (type: 'feature' | 'improvement' | 'fix') => {
    switch (type) {
      case 'feature':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Rocket className="w-3 h-3 text-blue-600" />
            New Feature
          </span>
        );
      case 'improvement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Zap className="w-3 h-3 text-emerald-600" />
            Improvement
          </span>
        );
      case 'fix':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600" />
            Fix
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl bg-white border border-black/10 shadow-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#09090b] text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-primary/30 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary-foreground text-[10px] font-black tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-primary" />
                Portal Changelog
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                What's New in Designforge
              </DialogTitle>
              <DialogDescription className="text-xs text-white/70">
                Weekly updates, platform improvements, and new study tools rolled out to your portal.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body: Timeline */}
        <div className="p-6 sm:p-7 space-y-6">
          {PORTAL_RELEASES.map((release, releaseIdx) => (
            <div
              key={release.version}
              className={`relative pl-6 pb-6 ${
                releaseIdx !== PORTAL_RELEASES.length - 1 ? 'border-l-2 border-black/10' : ''
              }`}
            >
              {/* Timeline marker */}
              <div
                className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                  release.isLatest ? 'bg-primary ring-4 ring-primary/20' : 'bg-black/30'
                }`}
              />

              {/* Release Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#1e293b]">
                    {release.weekLabel}
                  </h3>
                  <span className="text-[11px] font-bold text-foreground/50">
                    ({release.version})
                  </span>
                  {release.isLatest && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary">
                      Latest Release
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-foreground/50">
                  <Calendar className="w-3.5 h-3.5 text-foreground/40" />
                  <span>{release.releaseDate}</span>
                </div>
              </div>

              {/* Release Items */}
              <div className="space-y-3 bg-[#f8fafc] p-4 rounded-xl border border-black/5">
                {release.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(item.type)}
                      <h4 className="text-xs font-black text-[#1e293b]">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-[12px] text-foreground/70 leading-relaxed pl-1">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#f8fafc] border-t border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-foreground/60 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Updated weekly every Wednesday</span>
          </div>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 text-xs font-bold bg-[#1e293b] hover:bg-black text-white"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Trigger button that shows an unread ping dot if there are unread updates.
 */
export function WeeklyUpdatesTriggerButton({ onClick }: { onClick: () => void }) {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    try {
      const lastRead = localStorage.getItem(STORAGE_KEY);
      if (lastRead !== CURRENT_VERSION) {
        setHasUnread(true);
      }
    } catch (e) {
      setHasUnread(false);
    }
  }, []);

  const handleClick = () => {
    setHasUnread(false);
    onClick();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="h-9 gap-1.5 text-xs font-bold border-black/15 bg-white hover:bg-black/5 text-[#262626] shadow-2xs relative"
      title="View weekly portal updates and new features"
    >
      <Sparkles className="w-3.5 h-3.5 text-primary" />
      <span>What's New</span>
      {hasUnread && (
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      )}
    </Button>
  );
}
