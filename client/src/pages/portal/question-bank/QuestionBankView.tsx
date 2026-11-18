import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  BookOpen, Loader2, Sparkles, ChevronLeft, ChevronRight, 
  RotateCcw, Zap, HelpCircle, Layers, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidUuid } from '@/lib/utils';
import { 
  QuestionItem, 
  QuestionOption, 
  QuestionBankFilters 
} from './types';
import { MOCK_QUESTIONS, MOCK_OPTIONS } from './mockQuestions';
import { QuestionBankToolbar, DOMAIN_OPTIONS, DOMAIN_TAXONOMY } from './components/QuestionBankToolbar';
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
  const STORAGE_PRACTICED_PARTS_KEY = `df_qb_practiced_parts_${candidateId}`;
  const STORAGE_BOOKMARKED_KEY = `df_qb_bookmarked_${candidateId}`;

  // Filter State
  const [filters, setFilters] = useState<QuestionBankFilters>(() => {
    try {
      const saved = sessionStorage.getItem(`df_qb_filters_${candidateId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_FILTERS;
  });

  // Debounced search query to eliminate network thrashing while keeping input silky smooth
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(filters.searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(filters.searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(5098);
  const [optionsMap, setOptionsMap] = useState<Record<string, QuestionOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const fetchRequestIdRef = useRef<number>(0);

  // In-Memory Result & Page Cache for 0ms Instant Navigation
  const queryCacheRef = useRef<Map<string, { items: QuestionItem[]; count: number; optionsMap: Record<string, QuestionOption[]> }>>(new Map());
  const filterCountsCacheRef = useRef<Map<string, number>>(new Map());

  // Live Exam Counts across all questions (cached in sessionStorage for 0ms startup)
  const [examCounts, setExamCounts] = useState<Record<string, number>>(() => {
    try {
      const cached = sessionStorage.getItem('df_exam_counts_v1');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      all: 5098,
      ceed: 1290,
      uceed: 721,
      nid: 125,
    };
  });

  // Practiced Questions Mapped by Part ('A' | 'B') for section-specific tracking
  const [practicedMap, setPracticedMap] = useState<Record<string, 'A' | 'B'>>(() => {
    try {
      const savedParts = localStorage.getItem(STORAGE_PRACTICED_PARTS_KEY);
      if (savedParts) return JSON.parse(savedParts);

      // Backwards-compatible migration from flat array
      const oldArr = localStorage.getItem(STORAGE_PRACTICED_KEY);
      if (oldArr) {
        const arr: string[] = JSON.parse(oldArr);
        const map: Record<string, 'A' | 'B'> = {};
        arr.forEach(id => { map[id] = 'A'; });
        return map;
      }
    } catch (e) {}
    return {};
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
      if (!candidate?.id || !isValidUuid(candidate.id)) return;
      try {
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('id')
          .eq('candidate_id', candidate.id);

        if (attempts && attempts.length > 0) {
          const attemptIds = attempts.map(a => a.id);
          const { data: responses } = await supabase
            .from('exam_responses')
            .select('question_id, exam_questions(part)')
            .in('attempt_id', attemptIds.slice(0, 50));

          if (isMounted && responses && responses.length > 0) {
            setPracticedMap(prev => {
              const updated = { ...prev };
              responses.forEach((r: any) => {
                if (r.question_id) {
                  const part = r.exam_questions?.part || 'A';
                  updated[r.question_id] = part;
                }
              });
              try {
                localStorage.setItem(STORAGE_PRACTICED_PARTS_KEY, JSON.stringify(updated));
                localStorage.setItem(STORAGE_PRACTICED_KEY, JSON.stringify(Object.keys(updated)));
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
  }, [candidate?.id, STORAGE_PRACTICED_KEY, STORAGE_PRACTICED_PARTS_KEY]);

  // Section-specific Practiced & Unattempted Counts
  const partAPracticedCount = useMemo(() => {
    return Object.values(practicedMap).filter(p => p === 'A').length;
  }, [practicedMap]);

  const partBPracticedCount = useMemo(() => {
    return Object.values(practicedMap).filter(p => p === 'B').length;
  }, [practicedMap]);

  const activePracticedCount = useMemo(() => {
    if (filters.part === 'A') return partAPracticedCount;
    if (filters.part === 'B') return partBPracticedCount;
    return Object.keys(practicedMap).length;
  }, [filters.part, partAPracticedCount, partBPracticedCount, practicedMap]);

  const activeUnattemptedCount = Math.max(0, totalCount - activePracticedCount);

  // Load exact exam counts in background and cache with 12h freshness window
  useEffect(() => {
    try {
      const cachedRaw = localStorage.getItem('df_exam_counts_v2') || sessionStorage.getItem('df_exam_counts_v2');
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && typeof cached.counts === 'object' && Date.now() - (cached.timestamp || 0) < 12 * 60 * 60 * 1000) {
          setExamCounts(cached.counts);
          return;
        }
      }
    } catch (e) {}

    const fetchExamCounts = async () => {
      try {
        const [
          { count: allCount },
          { count: ceedCount },
          { count: uceedCount },
          { count: nidCount },
        ] = await Promise.all([
          supabase.from('exam_questions').select('*', { count: 'exact', head: true }),
          supabase.from('exam_questions').select('*', { count: 'exact', head: true }).ilike('pyq_tag', '%CEED%'),
          supabase.from('exam_questions').select('*', { count: 'exact', head: true }).ilike('pyq_tag', '%UCEED%'),
          supabase.from('exam_questions').select('*', { count: 'exact', head: true }).ilike('pyq_tag', '%NID%'),
        ]);

        const counts = {
          all: allCount || 5098,
          ceed: ceedCount || 1290,
          uceed: uceedCount || 721,
          nid: nidCount || 125,
        };
        setExamCounts(counts);
        try {
          const payload = JSON.stringify({ counts, timestamp: Date.now() });
          localStorage.setItem('df_exam_counts_v2', payload);
          sessionStorage.setItem('df_exam_counts_v2', payload);
        } catch (e) {}
      } catch (err) {
        console.warn('Could not load live exam counts:', err);
      }
    };
    fetchExamCounts();
  }, []);

  // Compute unique Cache Key
  const cacheKey = `${filters.exam}_${filters.part}_${filters.type}_${filters.difficulty}_${filters.domain}_${filters.practiceStatus}_${debouncedSearchQuery}_${currentPage}`;

  // True Server-Side Query with 0ms In-Memory Cache
  const fetchQuestions = useCallback(async () => {
    // 1. Check in-memory cache for instant 0ms retrieval
    const cached = queryCacheRef.current.get(cacheKey);
    if (cached) {
      setQuestions(cached.items);
      setTotalCount(cached.count);
      setOptionsMap(prev => ({ ...prev, ...cached.optionsMap }));
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestId = ++fetchRequestIdRef.current;
    try {
      const from = (currentPage - 1) * QUESTIONS_PER_PAGE;
      const to = from + QUESTIONS_PER_PAGE - 1;

      const filterSignature = `${filters.exam}_${filters.part}_${filters.type}_${filters.difficulty}_${filters.domain}_${filters.practiceStatus}_${debouncedSearchQuery}`;
      const cachedFilterCount = filterCountsCacheRef.current.get(filterSignature);
      const needsExactCount = cachedFilterCount === undefined || currentPage === 1;

      let query = supabase
        .from('exam_questions')
        .select(
          '*, exam_options(id, question_id, is_correct, content_text, media_url)',
          needsExactCount ? { count: 'exact' } : undefined
        )
        .order('created_at', { ascending: false });

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

      // 4. Exam filter
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
        query = query.or('pyq_tag.ilike.%Focus%,pyq_tag.ilike.%Designforge%');
      }

      // 5. Debounced Search query filter
      if (debouncedSearchQuery.trim()) {
        const term = debouncedSearchQuery.trim();
        query = query.or(`content_text.ilike.%${term}%,pyq_tag.ilike.%${term}%`);
      }

      // 6. Topic Domain filter
      if (filters.domain !== 'all') {
        if (filters.domain === 'part_b') {
          query = query.eq('part', 'B');
        } else {
          const topicTags = DOMAIN_TAXONOMY[filters.domain];
          if (topicTags && topicTags.length > 0) {
            query = query.overlaps('topics', topicTags);
          }
        }
      }

      // 7. Practice Status filter (Respecting Part A vs Part B isolation)
      const relevantPracticedIds = Object.entries(practicedMap)
        .filter(([_, part]) => (filters.part === 'all' ? true : part === filters.part))
        .map(([id]) => id)
        .slice(0, 100);

      if (filters.practiceStatus === 'practiced') {
        if (relevantPracticedIds.length > 0) {
          query = query.in('id', relevantPracticedIds);
        } else {
          setQuestions([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      } else if (filters.practiceStatus === 'unattempted') {
        if (relevantPracticedIds.length > 0) {
          query = query.not('id', 'in', `(${relevantPracticedIds.join(',')})`);
        }
      } else if (filters.practiceStatus === 'bookmarked') {
        const bookmarkedArr = Array.from(bookmarkedIds).slice(0, 100);
        if (bookmarkedArr.length > 0) {
          query = query.in('id', bookmarkedArr);
        } else {
          setQuestions([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      }

      const { data, count, error } = await query.range(from, to);

      if (requestId !== fetchRequestIdRef.current) return;

      if (error) {
        console.error('Error fetching questions from Supabase:', error);
      }

      const items = (data || []) as (QuestionItem & { exam_options?: QuestionOption[] })[];

      if (items.length === 0 && (!data || data.length === 0) && (count === 0 || count === null)) {
        // Fallback to MOCK_QUESTIONS only if completely empty / offline
        let filteredMocks = [...MOCK_QUESTIONS];
        if (filters.part !== 'all') filteredMocks = filteredMocks.filter(m => m.part === filters.part);
        if (filters.type !== 'all') filteredMocks = filteredMocks.filter(m => m.type === filters.type);
        if (filters.difficulty !== 'all') filteredMocks = filteredMocks.filter(m => m.difficulty === filters.difficulty);
        if (filters.exam === 'nid') filteredMocks = filteredMocks.filter(m => (m.pyq_tag || '').includes('NID'));
        if (filters.exam === 'uceed') filteredMocks = filteredMocks.filter(m => (m.pyq_tag || '').includes('UCEED'));
        if (filters.exam === 'ceed') filteredMocks = filteredMocks.filter(m => (m.pyq_tag || '').includes('CEED'));

        setQuestions(filteredMocks.slice(from, to + 1));
        setTotalCount(filteredMocks.length);
        setOptionsMap(MOCK_OPTIONS);
      } else {
        // Collect joined options directly from exam_options relation
        const newOptsMap: Record<string, QuestionOption[]> = {};
        items.forEach(q => {
          if (q.exam_options && q.exam_options.length > 0) {
            newOptsMap[q.id] = q.exam_options;
          }
        });

        const effectiveCount = count ?? cachedFilterCount ?? items.length;
        if (count !== null && count !== undefined) {
          filterCountsCacheRef.current.set(filterSignature, count);
        }

        // Store in cache for 0ms instant retrieval
        queryCacheRef.current.set(cacheKey, {
          items,
          count: effectiveCount,
          optionsMap: newOptsMap,
        });

        setOptionsMap(prev => ({ ...prev, ...newOptsMap }));
        setQuestions(items);
        setTotalCount(effectiveCount);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    cacheKey,
    currentPage, 
    filters.part, 
    filters.type, 
    filters.difficulty, 
    filters.exam, 
    filters.domain, 
    filters.practiceStatus,
    debouncedSearchQuery,
    practicedMap,
    bookmarkedIds
  ]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalCount / QUESTIONS_PER_PAGE));
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;

  // Background Pre-fetch of Next Page for 0ms Instant Page Transitions
  useEffect(() => {
    if (currentPage >= totalPages || loading) return;
    const nextPage = currentPage + 1;
    const nextCacheKey = `${filters.exam}_${filters.part}_${filters.type}_${filters.difficulty}_${filters.domain}_${filters.practiceStatus}_${debouncedSearchQuery}_${nextPage}`;
    if (queryCacheRef.current.has(nextCacheKey)) return;

    const idleTimer = setTimeout(async () => {
      try {
        const from = (nextPage - 1) * QUESTIONS_PER_PAGE;
        const to = from + QUESTIONS_PER_PAGE - 1;
        let nextQuery = supabase
          .from('exam_questions')
          .select('*, exam_options(id, question_id, is_correct, content_text, media_url)')
          .order('created_at', { ascending: false });

        if (filters.part !== 'all') nextQuery = nextQuery.eq('part', filters.part);
        if (filters.type !== 'all') nextQuery = nextQuery.eq('type', filters.type);
        if (filters.difficulty !== 'all') nextQuery = nextQuery.eq('difficulty', filters.difficulty);
        if (filters.exam === 'nid') nextQuery = nextQuery.ilike('pyq_tag', '%NID%');
        else if (filters.exam === 'uceed') nextQuery = nextQuery.ilike('pyq_tag', '%UCEED%');
        else if (filters.exam === 'ceed') nextQuery = nextQuery.ilike('pyq_tag', '%CEED%');
        else if (filters.exam === 'nift') nextQuery = nextQuery.ilike('pyq_tag', '%NIFT%');
        else if (filters.exam === 'pyq') nextQuery = nextQuery.not('pyq_tag', 'is', null);
        else if (filters.exam === 'focus') nextQuery = nextQuery.or('pyq_tag.ilike.%Focus%,pyq_tag.ilike.%Designforge%');

        if (debouncedSearchQuery.trim()) {
          nextQuery = nextQuery.or(`content_text.ilike.%${debouncedSearchQuery.trim()}%,pyq_tag.ilike.%${debouncedSearchQuery.trim()}%`);
        }

        if (filters.domain !== 'all') {
          if (filters.domain === 'part_b') {
            nextQuery = nextQuery.eq('part', 'B');
          } else {
            const topicTags = DOMAIN_TAXONOMY[filters.domain];
            if (topicTags && topicTags.length > 0) {
              nextQuery = nextQuery.overlaps('topics', topicTags);
            }
          }
        }

        const relevantPracticedIds = Object.entries(practicedMap)
          .filter(([_, part]) => (filters.part === 'all' ? true : part === filters.part))
          .map(([id]) => id)
          .slice(0, 100);

        if (filters.practiceStatus === 'practiced') {
          if (relevantPracticedIds.length > 0) {
            nextQuery = nextQuery.in('id', relevantPracticedIds);
          }
        } else if (filters.practiceStatus === 'unattempted') {
          if (relevantPracticedIds.length > 0) {
            nextQuery = nextQuery.not('id', 'in', `(${relevantPracticedIds.join(',')})`);
          }
        } else if (filters.practiceStatus === 'bookmarked') {
          const bookmarkedArr = Array.from(bookmarkedIds).slice(0, 100);
          if (bookmarkedArr.length > 0) {
            nextQuery = nextQuery.in('id', bookmarkedArr);
          }
        }

        const { data: nData, count: nCount } = await nextQuery.range(from, to);
        if (nData && nData.length > 0) {
          const nextOptsMap: Record<string, QuestionOption[]> = {};
          nData.forEach((q: any) => {
            if (q.exam_options && q.exam_options.length > 0) {
              nextOptsMap[q.id] = q.exam_options;
            }
          });
          queryCacheRef.current.set(nextCacheKey, {
            items: nData,
            count: nCount ?? nData.length,
            optionsMap: nextOptsMap,
          });
        }
      } catch (e) {
        // Silently ignore prefetch background error
      }
    }, 400);

    return () => clearTimeout(idleTimer);
  }, [currentPage, totalPages, loading, filters, debouncedSearchQuery]);

  // Toggle Practiced with Part tracking ('A' | 'B')
  const handleTogglePracticed = useCallback((id: string, part?: 'A' | 'B') => {
    setPracticedMap(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        const q = questions.find(item => item.id === id);
        const resolvedPart = part || q?.part || (filters.part !== 'all' ? filters.part : 'A');
        next[id] = resolvedPart;
      }
      try {
        localStorage.setItem(STORAGE_PRACTICED_PARTS_KEY, JSON.stringify(next));
        localStorage.setItem(STORAGE_PRACTICED_KEY, JSON.stringify(Object.keys(next)));
      } catch (e) {}
      return next;
    });
  }, [questions, filters.part, candidateId, STORAGE_PRACTICED_KEY, STORAGE_PRACTICED_PARTS_KEY]);

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

  const handleFilterChange = (key: keyof QuestionBankFilters, value: any) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
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
      const qIds = questions.map(q => q.id);
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
      {/* 1. Header & Robust Unified 4-State Search Bar */}
      <QuestionBankToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalQuestions={totalCount}
        unattemptedCount={activeUnattemptedCount}
        practicedCount={activePracticedCount}
        onLaunchDrill={onLaunchCustomDrill ? handleLaunchDrillClick : undefined}
        showAllAnswers={showAllAnswers}
        onToggleAllAnswers={() => setShowAllAnswers(prev => !prev)}
        questions={questions}
        examCounts={examCounts}
      />

      {/* 2. Questions Feed or Empty State */}
      {loading && questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-black/10 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-foreground/50">Loading question bank studio...</p>
        </div>
      ) : questions.length === 0 ? (
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
          {questions.map((question, idx) => {
            const actualIndex = startIndex + idx;
            const isPracticed = Boolean(practicedMap[question.id]);
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
                options={optionsMap[question.id] || question.exam_options || []}
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
                <strong className="text-[#18181b]">{totalCount.toLocaleString()}</strong> questions
              </span>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  disabled={currentPage <= 1}
                  className="h-8 px-3 text-xs font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                </Button>

                <span className="px-3 py-1 font-mono font-bold text-xs bg-neutral-100 rounded-lg text-foreground/80">
                  Page {currentPage} of {totalPages.toLocaleString()}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  disabled={currentPage >= totalPages}
                  className="h-8 px-3 text-xs font-bold cursor-pointer"
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
