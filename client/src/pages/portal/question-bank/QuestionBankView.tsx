import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  BookOpen, Loader2, Sparkles, ChevronLeft, ChevronRight, 
  RotateCcw, Zap, HelpCircle, Layers, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  QuestionItem, 
  QuestionOption, 
  QuestionBankFilters 
} from './types';
import { MOCK_QUESTIONS, MOCK_OPTIONS } from './mockQuestions';
import { QuestionBankToolbar } from './components/QuestionBankToolbar';
import { QuestionCardPartA } from './components/QuestionCardPartA';
import { QuestionCardPartB } from './components/QuestionCardPartB';

interface QuestionBankViewProps {
  candidate: any;
  onLaunchCustomDrill?: (questionIds?: string[]) => void;
}

const QUESTIONS_PER_PAGE = 10;

const DEFAULT_FILTERS: QuestionBankFilters = {
  exam: 'all',
  part: 'all',
  type: 'all',
  difficulty: 'all',
  domain: 'all',
  practiceStatus: 'all',
  searchQuery: '',
};

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  candidate,
  onLaunchCustomDrill,
}) => {
  const candidateId = candidate?.id || 'guest';
  const STORAGE_PRACTICED_KEY = `df_qb_practiced_${candidateId}`;
  const STORAGE_BOOKMARKED_KEY = `df_qb_bookmarked_${candidateId}`;

  // Filter State
  const [filters, setFilters] = useState<QuestionBankFilters>(() => {
    try {
      const saved = sessionStorage.getItem(`df_qb_filters_${candidateId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_FILTERS;
  });

  const [rawQuestions, setRawQuestions] = useState<QuestionItem[]>([]);
  const [optionsMap, setOptionsMap] = useState<Record<string, QuestionOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  // Practiced and Bookmarked State
  const [practicedIds, setPracticedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRACTICED_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set<string>();
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BOOKMARKED_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set<string>();
  });

  // Save filters to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem(`df_qb_filters_${candidateId}`, JSON.stringify(filters));
    } catch (e) {}
  }, [filters, candidateId]);

  // Load candidate's historical attempted questions from exam_responses
  useEffect(() => {
    let isMounted = true;
    const fetchHistoricalPracticed = async () => {
      if (!candidate?.id) return;
      try {
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('id')
          .eq('candidate_id', candidate.id);

        if (attempts && attempts.length > 0) {
          const attemptIds = attempts.map(a => a.id);
          // Fetch up to 1000 response question IDs in chunks
          const { data: responses } = await supabase
            .from('exam_responses')
            .select('question_id')
            .in('attempt_id', attemptIds.slice(0, 50));

          if (isMounted && responses && responses.length > 0) {
            setPracticedIds(prev => {
              const updated = new Set(prev);
              responses.forEach(r => {
                if (r.question_id) updated.add(r.question_id);
              });
              try {
                localStorage.setItem(STORAGE_PRACTICED_KEY, JSON.stringify(Array.from(updated)));
              } catch (e) {}
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load past question attempt history:', err);
      }
    };

    fetchHistoricalPracticed();
    return () => { isMounted = false; };
  }, [candidate?.id, STORAGE_PRACTICED_KEY]);

  // Fetch Questions from Supabase with Server-Side Filters
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('exam_questions')
        .select('id, type, part, difficulty, content_text, media_url, topics, pyq_tag, sample_answer, explanation, solution_text, created_at')
        .order('created_at', { ascending: false })
        .limit(250); // Increased headroom for robust search & domain filtering

      // 1. Part filter
      if (filters.part !== 'all') {
        query = query.eq('part', filters.part);
      }

      // 2. Type filter
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      // 3. Difficulty filter
      if (filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty);
      }

      // 4. Exam / Source filter
      if (filters.exam === 'nid') {
        query = query.ilike('pyq_tag', '%NID%');
      } else if (filters.exam === 'uceed') {
        query = query.ilike('pyq_tag', '%UCEED%');
      } else if (filters.exam === 'ceed') {
        query = query.ilike('pyq_tag', '%CEED%');
      } else if (filters.exam === 'nift') {
        query = query.ilike('pyq_tag', '%NIFT%');
      } else if (filters.exam === 'pyq') {
        query = query.not('pyq_tag', 'is', null);
      } else if (filters.exam === 'focus') {
        query = query.ilike('pyq_tag', '%Focus%');
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching questions:', error);
      }

      const items = (data || []) as QuestionItem[];
      if (items.length === 0) {
        // Fallback to rich curated mock questions in preview mode / offline
        let filteredMocks = [...MOCK_QUESTIONS];
        if (filters.part !== 'all') filteredMocks = filteredMocks.filter(m => m.part === filters.part);
        if (filters.type !== 'all') filteredMocks = filteredMocks.filter(m => m.type === filters.type);
        if (filters.difficulty !== 'all') filteredMocks = filteredMocks.filter(m => m.difficulty === filters.difficulty);
        if (filters.exam === 'nid') filteredMocks = filteredMocks.filter(m => (m.pyq_tag || '').includes('NID'));
        if (filters.exam === 'uceed') filteredMocks = filteredMocks.filter(m => (m.pyq_tag || '').includes('UCEED'));
        if (filters.exam === 'ceed') filteredMocks = filteredMocks.filter(m => (m.pyq_tag || '').includes('CEED'));
        setRawQuestions(filteredMocks);
        setOptionsMap(MOCK_OPTIONS);
      } else {
        setRawQuestions(items);

        // Fetch options for Part A questions
        const partAQIds = items.filter(q => q.part === 'A').map(q => q.id);
        if (partAQIds.length > 0) {
          // Fetch first batch of options
          const batch1 = partAQIds.slice(0, 40);
          const { data: optData } = await supabase
            .from('exam_options')
            .select('id, question_id, content_text, media_url, is_correct')
            .in('question_id', batch1);

          if (optData) {
            const map: Record<string, QuestionOption[]> = {};
            optData.forEach(opt => {
              if (!map[opt.question_id]) map[opt.question_id] = [];
              map[opt.question_id].push(opt);
            });
            setOptionsMap(prev => ({ ...prev, ...map }));
          }

          // Stream remaining options in background
          if (partAQIds.length > 40) {
            const remaining = partAQIds.slice(40);
            const chunkSize = 50;
            for (let i = 0; i < remaining.length; i += chunkSize) {
              const chunk = remaining.slice(i, i + chunkSize);
              supabase
                .from('exam_options')
                .select('id, question_id, content_text, media_url, is_correct')
                .in('question_id', chunk)
                .then(({ data: rData }) => {
                  if (rData) {
                    const rMap: Record<string, QuestionOption[]> = {};
                    rData.forEach(opt => {
                      if (!rMap[opt.question_id]) rMap[opt.question_id] = [];
                      rMap[opt.question_id].push(opt);
                    });
                    setOptionsMap(prev => ({ ...prev, ...rMap }));
                  }
                });
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.part, filters.type, filters.difficulty, filters.exam]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Toggle Practiced
  const handleTogglePracticed = useCallback((id: string) => {
    setPracticedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_PRACTICED_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  }, [STORAGE_PRACTICED_KEY]);

  // Toggle Bookmarked
  const handleToggleBookmarked = useCallback((id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_BOOKMARKED_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  }, [STORAGE_BOOKMARKED_KEY]);

  // Apply In-Memory Topic Domain & Search & Practice Status Filter
  const filteredQuestions = useMemo(() => {
    return rawQuestions.filter(q => {
      // 1. Topic Domain filter
      if (filters.domain !== 'all') {
        if (filters.domain === 'part_b') {
          if (q.part !== 'B') return false;
        } else {
          const domKeywords: Record<string, string[]> = {
            spatial: ['spatial', 'perception', '3d', 'cube', 'projection', 'shadow', 'isometric', 'rotation'],
            design: ['design', 'visual', 'observation', 'culture', 'symbol', 'identity', 'art'],
            analytical: ['analytical', 'reasoning', 'logic', 'sequence', 'pattern', 'mechanical'],
            color_type: ['color', 'font', 'typography', 'branding', 'palette'],
            materials: ['material', 'wood', 'plastic', 'metal', 'texture', 'ergonomic'],
          };
          const words = domKeywords[filters.domain] || [filters.domain];
          const hasMatch = 
            (q.topics || []).some(t => words.some(w => t.toLowerCase().includes(w))) ||
            words.some(w => (q.content_text || '').toLowerCase().includes(w));
          if (!hasMatch) return false;
        }
      }

      // 2. Practice Status filter
      if (filters.practiceStatus === 'unattempted') {
        if (practicedIds.has(q.id)) return false;
      } else if (filters.practiceStatus === 'practiced') {
        if (!practicedIds.has(q.id)) return false;
      } else if (filters.practiceStatus === 'bookmarked') {
        if (!bookmarkedIds.has(q.id)) return false;
      }

      // 3. Search query filter
      if (filters.searchQuery.trim()) {
        const qText = (q.content_text || '').toLowerCase();
        const term = filters.searchQuery.toLowerCase().trim();
        const pyq = (q.pyq_tag || '').toLowerCase();
        const topics = (q.topics || []).map(t => t.toLowerCase()).join(' ');
        if (!qText.includes(term) && !pyq.includes(term) && !topics.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [rawQuestions, filters.domain, filters.practiceStatus, filters.searchQuery, practicedIds, bookmarkedIds]);

  // Counts
  const totalCount = filteredQuestions.length;
  const unattemptedCount = filteredQuestions.filter(q => !practicedIds.has(q.id)).length;
  const practicedCount = filteredQuestions.filter(q => practicedIds.has(q.id)).length;
  const bookmarkedCount = bookmarkedIds.size;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalCount / QUESTIONS_PER_PAGE));
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  const handleFilterChange = (key: keyof QuestionBankFilters, value: any) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Auto-switch Part if specific question type chosen
      if (key === 'type' && value === 'SUBJECTIVE') {
        next.part = 'B';
      } else if (key === 'type' && ['MCQ', 'MSQ', 'NAT'].includes(value)) {
        if (next.part === 'B') next.part = 'A';
      }
      return next;
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const handleLaunchDrillClick = () => {
    if (onLaunchCustomDrill) {
      const qIds = filteredQuestions.map(q => q.id);
      onLaunchCustomDrill(qIds);
    }
  };

  // Active Filter Count & Tightest Filter calculation for smart empty states
  const activeFilterKeys: (keyof QuestionBankFilters)[] = [];
  if (filters.part !== 'all') activeFilterKeys.push('part');
  if (filters.domain !== 'all') activeFilterKeys.push('domain');
  if (filters.type !== 'all') activeFilterKeys.push('type');
  if (filters.difficulty !== 'all') activeFilterKeys.push('difficulty');
  if (filters.exam !== 'all') activeFilterKeys.push('exam');
  if (filters.practiceStatus !== 'all') activeFilterKeys.push('practiceStatus');
  if (filters.searchQuery.trim()) activeFilterKeys.push('searchQuery');

  const activeFilterCount = activeFilterKeys.length;

  let tightestMessage = "Try broadening some filters to see what's available.";
  let removeFilterAction = () => handleResetFilters();
  let removeFilterLabel = "Clear all filters";

  if (filters.difficulty !== 'all') {
    tightestMessage = "Difficulty is the tightest one. Remove it to see what's available.";
    removeFilterAction = () => handleFilterChange('difficulty', 'all');
    removeFilterLabel = `Remove "${filters.difficulty} difficulty"`;
  } else if (filters.searchQuery.trim()) {
    tightestMessage = `No questions matched "${filters.searchQuery}". Remove it to see what's available.`;
    removeFilterAction = () => handleFilterChange('searchQuery', '');
    removeFilterLabel = "Clear search query";
  } else if (filters.type !== 'all') {
    tightestMessage = "Question type is the tightest filter. Remove it to see what's available.";
    removeFilterAction = () => handleFilterChange('type', 'all');
    removeFilterLabel = `Remove "${filters.type}" filter`;
  } else if (filters.domain !== 'all') {
    tightestMessage = "Topic domain filter is the tightest one. Remove it to see what's available.";
    removeFilterAction = () => handleFilterChange('domain', 'all');
    removeFilterLabel = "Remove topic filter";
  } else if (filters.part !== 'all') {
    tightestMessage = "Section filter is restricting results. Remove it to see what's available.";
    removeFilterAction = () => handleFilterChange('part', 'all');
    removeFilterLabel = "Show all sections";
  } else if (filters.practiceStatus === 'unattempted') {
    tightestMessage = "You've practiced all questions in this category. Switch to All to review.";
    removeFilterAction = () => handleFilterChange('practiceStatus', 'all');
    removeFilterLabel = 'Show All Questions';
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Header & Robust Dropdown Toolbar */}
      <QuestionBankToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalQuestions={totalCount}
        unattemptedCount={unattemptedCount}
        practicedCount={practicedCount}
        onLaunchDrill={onLaunchCustomDrill ? handleLaunchDrillClick : undefined}
        showAllAnswers={showAllAnswers}
        onToggleAllAnswers={() => setShowAllAnswers(prev => !prev)}
        questions={rawQuestions}
      />

      {/* 2. Questions Feed or Empty State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-black/10 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-foreground/50">Loading question bank studio...</p>
        </div>
      ) : paginatedQuestions.length === 0 ? (
        <div className="border border-dashed border-black/15 rounded-2xl p-10 sm:p-14 text-center bg-white space-y-3">
          <h3 className="text-base sm:text-lg font-black text-[#18181b]">
            No questions match these {activeFilterCount > 0 ? activeFilterCount : ''} filters
          </h3>
          <p className="text-xs text-foreground/60 max-w-md mx-auto">
            {tightestMessage}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={removeFilterAction}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-black/10 hover:bg-neutral-50 shadow-2xs text-[#18181b] transition-all cursor-pointer"
            >
              {removeFilterLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {paginatedQuestions.map((question, idx) => {
            const actualIndex = startIndex + idx;
            const isPracticed = practicedIds.has(question.id);
            const isBookmarked = bookmarkedIds.has(question.id);

            if (question.part === 'B') {
              return (
                <QuestionCardPartB
                  key={question.id}
                  question={question}
                  questionIndex={actualIndex}
                  isPracticed={isPracticed}
                  isBookmarked={isBookmarked}
                  onTogglePracticed={handleTogglePracticed}
                  onToggleBookmarked={handleToggleBookmarked}
                  forceShowAnswer={showAllAnswers}
                />
              );
            }

            return (
              <QuestionCardPartA
                key={question.id}
                question={question}
                options={optionsMap[question.id] || []}
                questionIndex={actualIndex}
                isPracticed={isPracticed}
                isBookmarked={isBookmarked}
                onTogglePracticed={handleTogglePracticed}
                onToggleBookmarked={handleToggleBookmarked}
                forceShowAnswer={showAllAnswers}
              />
            );
          })}

          {/* 3. Server Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-black/10 text-xs font-medium">
              <span className="text-foreground/60 text-center sm:text-left">
                Showing <strong className="text-[#18181b]">{startIndex + 1}</strong> to{' '}
                <strong className="text-[#18181b]">{Math.min(startIndex + QUESTIONS_PER_PAGE, totalCount)}</strong> of{' '}
                <strong className="text-[#18181b]">{totalCount}</strong> questions
              </span>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-8 px-3 text-xs font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                </Button>

                <span className="px-3 py-1 font-mono font-bold text-xs bg-neutral-100 rounded-lg text-foreground/80">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-8 px-3 text-xs font-bold"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
