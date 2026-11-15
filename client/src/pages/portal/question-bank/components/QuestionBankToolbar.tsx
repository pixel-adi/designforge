import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, X, SlidersHorizontal, Eye, EyeOff, Zap, Plus, ChevronDown
} from 'lucide-react';
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
  onLaunchDrill?: () => void;
  showAllAnswers: boolean;
  onToggleAllAnswers: () => void;
}

export const DOMAIN_OPTIONS = [
  { id: 'all', label: 'All Topics & Domains' },
  { id: 'spatial', label: 'Visual & Spatial' },
  { id: 'design', label: 'Design Sensitivity' },
  { id: 'analytical', label: 'Analytical & Logic' },
  { id: 'color_type', label: 'Color & Typography' },
  { id: 'materials', label: 'Materials & Ergonomics' },
  { id: 'part_b', label: 'Creative Drawing (Part B)' },
];

export const QuestionBankToolbar: React.FC<QuestionBankToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalQuestions,
  unattemptedCount,
  practicedCount,
  onLaunchDrill,
  showAllAnswers,
  onToggleAllAnswers,
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Compute Active Filters
  const activeFilters: { key: keyof QuestionBankFilters; label: string; value: string; isDifficulty?: boolean }[] = [];

  if (filters.part !== 'all') {
    activeFilters.push({
      key: 'part',
      label: 'Section',
      value: filters.part === 'B' ? 'Part B · Creative Studio' : 'Part A · Aptitude & Visual',
    });
  }

  if (filters.domain !== 'all') {
    const matched = DOMAIN_OPTIONS.find(d => d.id === filters.domain);
    activeFilters.push({
      key: 'domain',
      label: 'Topic',
      value: matched ? matched.label : filters.domain,
    });
  }

  if (filters.type !== 'all') {
    const typeLabel = 
      filters.type === 'SUBJECTIVE' ? 'Subjective drawing' : 
      filters.type === 'MCQ' ? 'MCQ (Single)' : 
      filters.type === 'MSQ' ? 'MSQ (Multi-select)' : 'NAT (Numerical)';
    activeFilters.push({
      key: 'type',
      label: 'Type',
      value: typeLabel,
    });
  }

  if (filters.difficulty !== 'all') {
    activeFilters.push({
      key: 'difficulty',
      label: 'Difficulty',
      value: filters.difficulty,
      isDifficulty: true,
    });
  }

  if (filters.exam !== 'all') {
    const examLabel = 
      filters.exam === 'nid' ? 'NID DAT' :
      filters.exam === 'uceed' ? 'UCEED' :
      filters.exam === 'ceed' ? 'CEED' :
      filters.exam === 'nift' ? 'NIFT' :
      filters.exam === 'pyq' ? 'Past Year PYQ' : 'Focus Mocks';
    activeFilters.push({
      key: 'exam',
      label: 'Exam',
      value: examLabel,
    });
  }

  if (filters.practiceStatus !== 'all') {
    const statusLabel = 
      filters.practiceStatus === 'unattempted' ? 'Unattempted' :
      filters.practiceStatus === 'practiced' ? 'Practiced' : 'Starred';
    activeFilters.push({
      key: 'practiceStatus',
      label: 'Status',
      value: statusLabel,
    });
  }

  const activeFilterCount = activeFilters.length;

  return (
    <div className="space-y-4">
      {/* 1. Top Card: Search Input, Eye Toggle & Filter Dropdown Button */}
      <div className="bg-white border border-black/10 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 relative">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search concepts, keywords or tags"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-xl bg-transparent text-sm placeholder:text-foreground/40 focus:outline-none font-medium"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => onFilterChange('searchQuery', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Eye Toggle Button */}
          <button
            type="button"
            onClick={onToggleAllAnswers}
            className="w-10 h-10 rounded-xl border border-black/10 bg-white hover:bg-neutral-50 flex items-center justify-center text-foreground/70 transition-colors shrink-0"
            title={showAllAnswers ? "Hide all solutions" : "Show all solutions on page"}
          >
            {showAllAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Filters Button with Red Count Badge */}
          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown(prev => !prev)}
              className="h-10 px-4 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#ef4444] text-white rounded-full text-[10px] font-black px-1.5 py-0.2 min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {showFilterDropdown && (
              <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 bg-white rounded-2xl border border-black/10 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-xs font-black text-[#18181b]">Filter Question Bank</span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onResetFilters();
                        setShowFilterDropdown(false);
                      }}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Section Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">
                    Section
                  </label>
                  <select
                    value={filters.part}
                    onChange={(e) => onFilterChange('part', e.target.value as QuestionPart)}
                    className="w-full h-8 px-2.5 rounded-lg border border-black/10 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
                  >
                    <option value="all">All Sections (A & B)</option>
                    <option value="A">Part A: Aptitude & Visual</option>
                    <option value="B">Part B: Creative Studio (Drawing)</option>
                  </select>
                </div>

                {/* Topic Domain */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">
                    Topic Domain
                  </label>
                  <select
                    value={filters.domain}
                    onChange={(e) => onFilterChange('domain', e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-black/10 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
                  >
                    {DOMAIN_OPTIONS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Question Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">
                    Question Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => onFilterChange('type', e.target.value as QuestionType)}
                    className="w-full h-8 px-2.5 rounded-lg border border-black/10 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="MCQ">MCQ (Single)</option>
                    <option value="MSQ">MSQ (Multi-select)</option>
                    <option value="NAT">NAT (Numerical)</option>
                    <option value="SUBJECTIVE">Subjective Drawing (Part B)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => onFilterChange('difficulty', e.target.value as QuestionDifficulty)}
                    className="w-full h-8 px-2.5 rounded-lg border border-black/10 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Low">Low Difficulty</option>
                    <option value="Medium">Medium Difficulty</option>
                    <option value="High">High Difficulty</option>
                  </select>
                </div>

                {/* Exam / Source */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">
                    Exam / Source
                  </label>
                  <select
                    value={filters.exam}
                    onChange={(e) => onFilterChange('exam', e.target.value as ExamFilter)}
                    className="w-full h-8 px-2.5 rounded-lg border border-black/10 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
                  >
                    <option value="all">All Exams</option>
                    <option value="nid">NID DAT Prelims</option>
                    <option value="uceed">UCEED (IIT)</option>
                    <option value="ceed">CEED (M.Des)</option>
                    <option value="nift">NIFT</option>
                    <option value="pyq">Past Year Papers (PYQ)</option>
                    <option value="focus">Focus Mocks</option>
                  </select>
                </div>

                {/* Apply / Close button */}
                <div className="pt-2 border-t border-black/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#18181b] text-white text-xs font-bold hover:bg-black transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Active Filter Pills Row (when any filters active) */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-black/5">
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    f.isDifficulty
                      ? 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                      : 'bg-[#f4f4f5] text-foreground/85 border border-black/5'
                  }`}
                >
                  <span className="text-foreground/50 font-normal">{f.label}</span>
                  <strong className={f.isDifficulty ? 'text-[#991b1b]' : 'text-[#18181b]'}>
                    {f.value}
                  </strong>
                  <button
                    type="button"
                    onClick={() => onFilterChange(f.key, 'all')}
                    className="ml-1 text-foreground/40 hover:text-foreground hover:scale-110 transition-transform"
                    title={`Remove ${f.label} filter`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* "Clear all" red text link on the right */}
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-bold text-[#b91c1c] hover:underline cursor-pointer ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 3. Sub-Navigation Tabs (All, Unattempted, Practiced) & "⚡ Launch timed drill" Button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-black/10 pb-1">
        <div className="flex items-center gap-6 text-sm">
          {/* Tab 1: All */}
          <button
            type="button"
            onClick={() => onFilterChange('practiceStatus', 'all')}
            className={`pb-2 transition-all cursor-pointer relative font-bold text-xs sm:text-sm ${
              filters.practiceStatus === 'all'
                ? 'text-[#18181b] border-b-2 border-primary -mb-[5px] font-black'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            All <span className="font-normal">{totalQuestions}</span>
          </button>

          {/* Tab 2: Unattempted */}
          <button
            type="button"
            onClick={() => onFilterChange('practiceStatus', 'unattempted')}
            className={`pb-2 transition-all cursor-pointer relative font-bold text-xs sm:text-sm ${
              filters.practiceStatus === 'unattempted'
                ? 'text-[#18181b] border-b-2 border-primary -mb-[5px] font-black'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            Unattempted <span className="font-normal">{unattemptedCount}</span>
          </button>

          {/* Tab 3: Practiced */}
          <button
            type="button"
            onClick={() => onFilterChange('practiceStatus', 'practiced')}
            className={`pb-2 transition-all cursor-pointer relative font-bold text-xs sm:text-sm ${
              filters.practiceStatus === 'practiced'
                ? 'text-[#18181b] border-b-2 border-primary -mb-[5px] font-black'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            Practiced <span className="font-normal">{practicedCount}</span>
          </button>
        </div>

        {/* Right Button: "⚡ Launch timed drill" */}
        {onLaunchDrill && (
          <button
            type="button"
            onClick={onLaunchDrill}
            className="h-9 px-4 rounded-xl bg-[#fbdcd5] text-[#991b1b] hover:bg-[#fad0c7] text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs self-start sm:self-auto cursor-pointer active:scale-95"
            title="Launch a timed practice test using these filtered questions"
          >
            <Zap className="w-3.5 h-3.5 fill-[#991b1b]" />
            <span>Launch timed drill</span>
          </button>
        )}
      </div>
    </div>
  );
};
