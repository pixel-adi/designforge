import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, X, SlidersHorizontal, Eye, Ban, ChevronDown, ChevronUp, CornerDownLeft, ArrowUpDown
} from 'lucide-react';
import { 
  QuestionBankFilters, 
  ExamFilter, 
  QuestionPart, 
  QuestionType, 
  QuestionDifficulty, 
  PracticeStatusFilter,
  QuestionItem
} from '../types';

export interface QuestionBankToolbarProps {
  filters: QuestionBankFilters;
  onFilterChange: (key: keyof QuestionBankFilters, value: any) => void;
  onResetFilters: () => void;
  totalQuestions: number;
  unattemptedCount: number;
  practicedCount: number;
  onLaunchDrill?: () => void;
  showAllAnswers: boolean;
  onToggleAllAnswers: () => void;
  questions?: QuestionItem[];
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

export const EXAM_OPTIONS: { id: ExamFilter; label: string; count: number }[] = [
  { id: 'all', label: 'All exams', count: 1240 },
  { id: 'uceed', label: 'UCEED', count: 512 },
  { id: 'ceed', label: 'CEED', count: 438 },
  { id: 'nid', label: 'NID DAT', count: 290 },
];

// Curated concepts taxonomy mapped to exams
const EXAM_CONCEPTS: Record<string, { name: string; count: number; domain?: string }[]> = {
  all: [
    { name: 'Perspective drawing', count: 18, domain: 'spatial' },
    { name: 'Two-point perspective', count: 7, domain: 'spatial' },
    { name: 'Isometric projection', count: 12, domain: 'spatial' },
    { name: 'Visual & Spatial reasoning', count: 24, domain: 'spatial' },
    { name: 'Form and shadow study', count: 11, domain: 'spatial' },
    { name: 'Color theory & harmony', count: 14, domain: 'color_type' },
    { name: 'Product ergonomics', count: 9, domain: 'materials' },
    { name: 'Analytical geometry', count: 15, domain: 'analytical' },
  ],
  ceed: [
    { name: 'Perspective drawing', count: 11, domain: 'spatial' },
    { name: 'Two-point perspective', count: 4, domain: 'spatial' },
    { name: 'Form and shadow study', count: 7, domain: 'spatial' },
    { name: 'Visual narration & storyboard', count: 8, domain: 'part_b' },
    { name: 'Human ergonomics & anatomy', count: 6, domain: 'materials' },
    { name: 'Material textures & rendering', count: 5, domain: 'materials' },
  ],
  uceed: [
    { name: 'Visual puzzle & spatial rotation', count: 14, domain: 'spatial' },
    { name: 'Color theory & harmony', count: 8, domain: 'color_type' },
    { name: 'Mechanical reasoning & gears', count: 10, domain: 'analytical' },
    { name: 'Analytical geometry & nets', count: 9, domain: 'analytical' },
    { name: 'Isometric projection', count: 6, domain: 'spatial' },
  ],
  nid: [
    { name: 'Design sensitivity & problem solving', count: 12, domain: 'design' },
    { name: 'Creative observation & lateral thinking', count: 10, domain: 'design' },
    { name: 'Material manipulation & model thinking', count: 8, domain: 'materials' },
    { name: 'Cultural symbolism & visual identity', count: 6, domain: 'design' },
    { name: 'Visual sequence & sequential art', count: 7, domain: 'part_b' },
  ],
};

// Helper: Highlight matching substring in yellow
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#fef08a] text-inherit rounded-xs px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

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
  questions = [],
}) => {
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const examMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (examMenuRef.current && !examMenuRef.current.contains(e.target as Node)) {
        setShowExamDropdown(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global '/' keyboard shortcut to focus search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Compute Active In-Bar Chips (State 4)
  const inBarChips: { id: string; label: string; onRemove: () => void; variant?: 'status' | 'default' }[] = [];

  if (filters.part !== 'all') {
    inBarChips.push({
      id: 'part',
      label: filters.part === 'B' ? 'Part B' : 'Part A',
      onRemove: () => onFilterChange('part', 'all'),
      variant: 'default',
    });
  }

  if (filters.type !== 'all') {
    const typeLabel = 
      filters.type === 'SUBJECTIVE' ? 'Drawing' : 
      filters.type === 'MCQ' ? 'MCQ' : 
      filters.type === 'MSQ' ? 'MSQ' : 'NAT';
    inBarChips.push({
      id: 'type',
      label: typeLabel,
      onRemove: () => onFilterChange('type', 'all'),
      variant: 'default',
    });
  }

  if (filters.domain !== 'all') {
    const matched = DOMAIN_OPTIONS.find(d => d.id === filters.domain);
    inBarChips.push({
      id: 'domain',
      label: matched ? matched.label.replace(' (Part B)', '') : filters.domain,
      onRemove: () => onFilterChange('domain', 'all'),
      variant: 'default',
    });
  }

  if (filters.difficulty !== 'all') {
    inBarChips.push({
      id: 'difficulty',
      label: `${filters.difficulty} diff`,
      onRemove: () => onFilterChange('difficulty', 'all'),
      variant: 'default',
    });
  }

  if (filters.practiceStatus !== 'all') {
    const statusLabel = 
      filters.practiceStatus === 'unattempted' ? 'Unattempted' :
      filters.practiceStatus === 'practiced' ? 'Practiced' : 'Starred';
    inBarChips.push({
      id: 'practiceStatus',
      label: statusLabel,
      onRemove: () => onFilterChange('practiceStatus', 'all'),
      variant: 'status',
    });
  }

  const activeFilterCount = inBarChips.length;

  // Current exam display text
  const currentExamObj = EXAM_OPTIONS.find(e => e.id === filters.exam) || EXAM_OPTIONS[0];
  const currentExamLabel = currentExamObj.label;

  // Autocomplete Suggestions computation (State 3)
  const query = filters.searchQuery.trim().toLowerCase();
  const showSuggestions = isInputFocused && query.length >= 1;

  const conceptPool = EXAM_CONCEPTS[filters.exam] || EXAM_CONCEPTS['all'];
  const matchedConcepts = useMemo(() => {
    if (!query) return [];
    return conceptPool.filter(c => c.name.toLowerCase().includes(query)).slice(0, 3);
  }, [conceptPool, query]);

  // Questions matching query in current exam
  const matchedQuestions = useMemo(() => {
    if (!query) return [];
    return questions
      .filter(q => (q.content_text || '').toLowerCase().includes(query))
      .slice(0, 2);
  }, [questions, query]);

  // Other exams matching concepts count
  const otherExamMatches = useMemo(() => {
    if (filters.exam === 'all' || !query) return 0;
    const allMatches = EXAM_CONCEPTS['all'].filter(c => c.name.toLowerCase().includes(query));
    return Math.max(0, allMatches.length - matchedConcepts.length);
  }, [filters.exam, query, matchedConcepts]);

  // Handle Autocomplete Keyboard Nav
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === 'Escape') {
      setIsInputFocused(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => Math.min(prev + 1, matchedConcepts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchedConcepts[selectedSuggestionIndex]) {
        const item = matchedConcepts[selectedSuggestionIndex];
        onFilterChange('searchQuery', item.name);
        if (item.domain) onFilterChange('domain', item.domain);
        setIsInputFocused(false);
      }
    }
  };

  return (
    <div className="space-y-3.5 select-none">
      {/* 1. UNIFIED SEARCH BAR CONTAINER */}
      <div 
        ref={searchContainerRef}
        className={`relative bg-white rounded-2xl border transition-all duration-200 shadow-xs flex items-center px-2.5 sm:px-3.5 py-1.5 gap-2 sm:gap-3 ${
          isInputFocused 
            ? 'border-[#f27457] ring-3 ring-[#f27457]/15 shadow-sm' 
            : 'border-neutral-200/90 hover:border-neutral-300'
        }`}
      >
        {/* A. EXAM SELECTOR BUTTON (Left Side) */}
        <div className="relative shrink-0" ref={examMenuRef}>
          <button
            type="button"
            onClick={() => setShowExamDropdown(prev => !prev)}
            className={`h-11 px-2.5 py-1 flex flex-col justify-center text-left hover:bg-neutral-50/80 rounded-xl transition-all cursor-pointer select-none relative ${
              showExamDropdown ? 'border-b-2 border-[#ef4444] rounded-b-none' : ''
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 leading-tight">
              EXAM
            </span>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#18181b] leading-tight mt-0.5">
              <span>{currentExamLabel}</span>
              {showExamDropdown ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              )}
            </div>
          </button>

          {/* EXAM SELECTOR DROPDOWN (State 2) */}
          {showExamDropdown && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-64 bg-white rounded-2xl border border-neutral-200/90 shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              {EXAM_OPTIONS.map(opt => {
                const isSelected = filters.exam === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onFilterChange('exam', opt.id);
                      setShowExamDropdown(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-[#fef2f0] text-[#ef4444] font-bold' 
                        : 'text-neutral-800 hover:bg-neutral-50 font-medium'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`text-xs ${isSelected ? 'text-[#ef4444] font-bold' : 'text-neutral-400 font-normal'}`}>
                      {opt.count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider Line */}
        <div className="h-7 w-[1px] bg-neutral-200 shrink-0 hidden xs:block" />

        {/* B. SEARCH INPUT & IN-BAR FILTER CHIPS (State 1 & State 4) */}
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-none py-1">
          {/* Search Icon */}
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />

          {/* IN-BAR FILTER CHIPS (State 4) */}
          {inBarChips.map(chip => (
            <span
              key={chip.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                chip.variant === 'status'
                  ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]'
                  : 'bg-[#fef2f0] text-[#ef4444] border border-[#fecaca]'
              }`}
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="text-inherit opacity-60 hover:opacity-100 hover:scale-110 transition-transform cursor-pointer"
                title={`Remove ${chip.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Actual Input */}
          <input
            ref={inputRef}
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              inBarChips.length > 0
                ? `Search within ${totalQuestions} results`
                : `Search ${currentExamObj.count.toLocaleString()} questions by concept, keyword or tag`
            }
            className="w-full h-8 bg-transparent text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none font-medium min-w-[120px]"
          />

          {/* Clear Button (State 3) or Shortcut Badge (State 1) */}
          {filters.searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onFilterChange('searchQuery', '');
                inputRef.current?.focus();
              }}
              className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 text-xs shrink-0 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-mono text-neutral-400 border border-neutral-200 rounded-md bg-neutral-50 shrink-0">
              /
            </kbd>
          )}
        </div>

        {/* C. RIGHT ACTIONS: RESULTS COUNT, ANSWERS TOGGLE, FILTERS BUTTON */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Result Count when filters applied (State 4) */}
          {inBarChips.length > 0 && (
            <span className="text-xs sm:text-sm font-bold text-neutral-700 shrink-0 whitespace-nowrap hidden lg:inline mr-1">
              {totalQuestions} questions
            </span>
          )}

          {/* Answers Hidden / Shown Button */}
          <button
            type="button"
            onClick={onToggleAllAnswers}
            className="h-9 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center gap-1.5 text-xs font-semibold text-neutral-700 transition-colors shrink-0 cursor-pointer shadow-2xs"
            title={showAllAnswers ? "Hide all answers" : "Show all answers"}
          >
            {showAllAnswers ? (
              <>
                <Eye className="w-3.5 h-3.5 text-neutral-600" />
                <span className="hidden sm:inline">Answers shown</span>
              </>
            ) : (
              <>
                <Ban className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Answers hidden</span>
              </>
            )}
          </button>

          {/* Filters Button (Red badge if active) */}
          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown(prev => !prev)}
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                activeFilterCount > 0
                  ? 'border border-[#ef4444] bg-white text-[#18181b] hover:bg-[#fef2f0]/30'
                  : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-inherit" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#ef4444] text-white text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {showFilterDropdown && (
              <div className="absolute right-0 top-11 z-50 w-72 sm:w-80 bg-white rounded-2xl border border-neutral-200 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-xs font-black text-[#18181b]">Filter Question Bank</span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onResetFilters();
                        setShowFilterDropdown(false);
                      }}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
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
                    className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
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
                    className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
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
                    className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
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
                    className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-foreground/80 focus:outline-none"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Low">Low Difficulty</option>
                    <option value="Medium">Medium Difficulty</option>
                    <option value="High">High Difficulty</option>
                  </select>
                </div>

                {/* Done Button */}
                <div className="pt-2 border-t border-black/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#18181b] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* D. AUTOCOMPLETE COMMAND PALETTE (State 3) */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-white rounded-2xl border border-neutral-200 shadow-2xl p-3.5 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Section 1: CONCEPTS IN [EXAM] */}
            {matchedConcepts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
                  CONCEPTS IN {currentExamLabel.toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  {matchedConcepts.map((item, idx) => {
                    const isSelected = idx === selectedSuggestionIndex;
                    return (
                      <div
                        key={item.name}
                        onClick={() => {
                          onFilterChange('searchQuery', item.name);
                          if (item.domain) onFilterChange('domain', item.domain);
                          setIsInputFocused(false);
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                        className={`px-3 py-2 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{highlightMatch(item.name, query)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 font-normal">
                            {item.count} questions
                          </span>
                          {isSelected && (
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-white border border-neutral-200 rounded">
                              Enter
                            </kbd>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: ADD AS FILTER */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
                ADD AS FILTER
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('searchQuery', `#${query}`);
                    setIsInputFocused(false);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-colors cursor-pointer"
                >
                  Tag · #{query}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('domain', 'spatial');
                    setIsInputFocused(false);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-colors cursor-pointer"
                >
                  Topic · Visual & Spatial
                </button>
              </div>
            </div>

            {/* Section 3: QUESTIONS */}
            {matchedQuestions.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
                  QUESTIONS
                </div>
                <div className="space-y-1">
                  {matchedQuestions.map(q => (
                    <div
                      key={q.id}
                      onClick={() => {
                        onFilterChange('searchQuery', query);
                        setIsInputFocused(false);
                      }}
                      className="px-3 py-2 rounded-xl text-xs text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <p className="line-clamp-1 flex-1 font-medium">
                        {highlightMatch(q.content_text, query)}
                      </p>
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md shrink-0">
                        {q.pyq_tag || `${currentExamLabel} · Part ${q.part}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other exams matches banner */}
            {otherExamMatches > 0 && (
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span>{otherExamMatches} more matches in other exams</span>
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('exam', 'all');
                    setIsInputFocused(false);
                  }}
                  className="text-[#ef4444] font-bold hover:underline cursor-pointer"
                >
                  Search all exams
                </button>
              </div>
            )}

            {/* Footer Navigation Hints */}
            <div className="pt-2 border-t border-neutral-100 flex items-center gap-4 text-[11px] text-neutral-400 font-medium">
              <span>↑ ↓ to move</span>
              <span>Enter to select</span>
              <span>Esc to close</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. QUICK SUGGESTIONS ROW (State 1) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-neutral-400 font-semibold mr-0.5">Quick:</span>
        <button
          type="button"
          onClick={() => onFilterChange('part', filters.part === 'B' ? 'all' : 'B')}
          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            filters.part === 'B'
              ? 'bg-[#fef2f0] text-[#ef4444] border-[#fecaca]'
              : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
          }`}
        >
          Part B · Studio
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('type', filters.type === 'SUBJECTIVE' ? 'all' : 'SUBJECTIVE')}
          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            filters.type === 'SUBJECTIVE'
              ? 'bg-[#fef2f0] text-[#ef4444] border-[#fecaca]'
              : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
          }`}
        >
          Drawing
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('practiceStatus', filters.practiceStatus === 'unattempted' ? 'all' : 'unattempted')}
          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            filters.practiceStatus === 'unattempted'
              ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
              : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
          }`}
        >
          Unattempted
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('domain', filters.domain === 'spatial' ? 'all' : 'spatial')}
          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            filters.domain === 'spatial'
              ? 'bg-[#fef2f0] text-[#ef4444] border-[#fecaca]'
              : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
          }`}
        >
          Visual & Spatial
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('searchQuery', 'isometric')}
          className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors cursor-pointer"
        >
          Recent: "isometric"
        </button>
      </div>

      {/* 3. SUB-NAVIGATION TABS (All, Unattempted, Practiced) & "⚡ Launch timed drill" Button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-black/10 pb-1 pt-1">
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
            <span>⚡ Launch timed drill</span>
          </button>
        )}
      </div>
    </div>
  );
};
