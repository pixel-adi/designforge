import React from 'react';
import { 
  Search, X, RotateCcw, Zap, Sparkles, Filter, 
  BookOpen, CheckCircle2, Star, Layers, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  QuestionBankFilters, 
  ExamFilter, 
  QuestionPart, 
  QuestionType, 
  QuestionDifficulty, 
  PracticeStatusFilter 
} from '../types';

interface QuestionBankToolbarProps {
  filters: QuestionBankFilters;
  onFilterChange: (key: keyof QuestionBankFilters, value: any) => void;
  onResetFilters: () => void;
  totalQuestions: number;
  unattemptedCount: number;
  practicedCount: number;
  bookmarkedCount: number;
  onLaunchDrill?: () => void;
  showAllAnswers: boolean;
  onToggleAllAnswers: () => void;
}

export const DOMAINS = [
  { id: 'all', label: 'All Topics & Domains' },
  { id: 'spatial', label: '📐 Visual & Spatial Perception (3D, Projections, Shadows)' },
  { id: 'design', label: '🎨 Design Sensitivity & Visual Culture' },
  { id: 'analytical', label: '🧠 Analytical, Pattern & Mechanical Logic' },
  { id: 'color_type', label: '🔤 Color Harmony, Fonts & Branding' },
  { id: 'materials', label: '🪵 Materials, Textures & Everyday Ergonomics' },
  { id: 'part_b', label: '✏️ Creative Drawing, Storyboarding & Perspective (Part B)' },
];

export const QuestionBankToolbar: React.FC<QuestionBankToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalQuestions,
  unattemptedCount,
  practicedCount,
  bookmarkedCount,
  onLaunchDrill,
  showAllAnswers,
  onToggleAllAnswers,
}) => {
  const isFiltered = 
    filters.exam !== 'all' ||
    filters.part !== 'all' ||
    filters.type !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.domain !== 'all' ||
    filters.practiceStatus !== 'all' ||
    Boolean(filters.searchQuery.trim());

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. Header & Live Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search questions by concept, keyword, question text or tag..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-black/10 bg-neutral-50/60 focus:bg-white focus:border-primary text-xs font-medium placeholder:text-foreground/40 transition-colors focus:outline-none"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange('searchQuery', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground text-xs font-bold"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleAllAnswers}
            className="h-10 px-3 text-xs font-bold border-black/10 bg-white hover:bg-neutral-50 text-foreground/80 gap-1.5"
            title={showAllAnswers ? "Hide all answers" : "Reveal all answers on page"}
          >
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">{showAllAnswers ? 'Hide Answers' : 'Reveal Answers'}</span>
          </Button>

          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-10 px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Structured 5-Dropdown Filter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {/* Dropdown 1: Exam / Source */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block pl-0.5">
            Exam / Source
          </label>
          <select
            value={filters.exam}
            onChange={(e) => onFilterChange('exam', e.target.value as ExamFilter)}
            className="w-full h-9 px-2.5 rounded-xl border border-black/10 bg-white text-xs font-semibold text-foreground/85 focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Exams</option>
            <option value="nid">NID DAT Prelims</option>
            <option value="uceed">UCEED (IIT)</option>
            <option value="ceed">CEED (M.Des)</option>
            <option value="nift">NIFT Aptitude</option>
            <option value="pyq">Official Past Papers (PYQ)</option>
            <option value="focus">Focus Batch Mocks</option>
          </select>
        </div>

        {/* Dropdown 2: Paper Section */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block pl-0.5">
            Section
          </label>
          <select
            value={filters.part}
            onChange={(e) => onFilterChange('part', e.target.value as QuestionPart)}
            className="w-full h-9 px-2.5 rounded-xl border border-black/10 bg-white text-xs font-semibold text-foreground/85 focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Sections (A & B)</option>
            <option value="A">Part A: Aptitude & Visual</option>
            <option value="B">Part B: Creative Studio (Drawing)</option>
          </select>
        </div>

        {/* Dropdown 3: Topic / Domain */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block pl-0.5">
            Topic Domain
          </label>
          <select
            value={filters.domain}
            onChange={(e) => onFilterChange('domain', e.target.value)}
            className="w-full h-9 px-2.5 rounded-xl border border-black/10 bg-white text-xs font-semibold text-foreground/85 focus:border-primary focus:outline-none cursor-pointer text-ellipsis overflow-hidden"
          >
            {DOMAINS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 4: Question Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block pl-0.5">
            Question Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value as QuestionType)}
            className="w-full h-9 px-2.5 rounded-xl border border-black/10 bg-white text-xs font-semibold text-foreground/85 focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Question Types</option>
            {filters.part !== 'B' && (
              <>
                <option value="MCQ">MCQ (Single Choice)</option>
                <option value="MSQ">MSQ (Multiple Choice)</option>
                <option value="NAT">NAT (Numerical)</option>
              </>
            )}
            {filters.part !== 'A' && (
              <option value="SUBJECTIVE">Subjective Drawing (Part B)</option>
            )}
          </select>
        </div>

        {/* Dropdown 5: Difficulty */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block pl-0.5">
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => onFilterChange('difficulty', e.target.value as QuestionDifficulty)}
            className="w-full h-9 px-2.5 rounded-xl border border-black/10 bg-white text-xs font-semibold text-foreground/85 focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="Low">Low Difficulty</option>
            <option value="Medium">Medium Difficulty</option>
            <option value="High">High Difficulty</option>
          </select>
        </div>

        {/* Dropdown 6: Practice & Progress Status */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-primary block pl-0.5 font-bold">
            Practice Status
          </label>
          <select
            value={filters.practiceStatus}
            onChange={(e) => onFilterChange('practiceStatus', e.target.value as PracticeStatusFilter)}
            className="w-full h-9 px-2.5 rounded-xl border-2 border-primary/30 bg-primary/[0.03] text-xs font-black text-primary focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">🌟 All Questions</option>
            <option value="unattempted">🆕 Unattempted Only (Fresh)</option>
            <option value="practiced">✅ Practiced / Completed</option>
            <option value="bookmarked">⭐ Starred for Revision ({bookmarkedCount})</option>
          </select>
        </div>
      </div>

      {/* 3. Status Strip & Instant Drill Bridge */}
      <div className="pt-2 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 font-medium text-foreground/70">
          <span>Found <strong className="text-[#18181b] font-black">{totalQuestions}</strong> questions</span>
          <span className="text-foreground/30">•</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-emerald-200/60">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            {unattemptedCount} Unattempted (Fresh)
          </span>
          <span className="text-foreground/30">•</span>
          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-blue-200/60">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            {practicedCount} Practiced
          </span>
          {bookmarkedCount > 0 && (
            <>
              <span className="text-foreground/30">•</span>
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-amber-200/60">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {bookmarkedCount} Starred
              </span>
            </>
          )}
        </div>

        {/* Drill Launch Bridge */}
        {onLaunchDrill && (
          <Button
            type="button"
            size="sm"
            onClick={onLaunchDrill}
            className="h-8 px-3.5 text-xs font-black bg-primary text-white hover:bg-primary/90 shadow-2xs gap-1.5 self-start sm:self-auto rounded-xl"
            title="Launch a personalized timed practice test using these questions"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Launch Timed Drill</span>
          </Button>
        )}
      </div>
    </div>
  );
};
