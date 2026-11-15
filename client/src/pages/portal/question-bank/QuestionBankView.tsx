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
        bookmarkedCount={bookmarkedCount}
        onLaunchDrill={onLaunchCustomDrill ? handleLaunchDrillClick : undefined}
        showAllAnswers={showAllAnswers}
        onToggleAllAnswers={() => setShowAllAnswers(prev => !prev)}
      />

      {/* 2. Questions Feed or Empty State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-black/10 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-foreground/50">Loading question bank studio...</p>
        </div>
      ) : paginatedQuestions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-black/10 p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-foreground/20 mx-auto" />
          <h3 className="text-base font-black text-[#18181b]">No matching questions found</h3>
          <p className="text-xs text-foreground/50 max-w-md mx-auto leading-relaxed">
            {filters.practiceStatus === 'unattempted'
              ? 'Awesome! You have practiced all questions matching these filters. Try switching Practice Status to "All Questions" or selecting another topic.'
              : 'Try broadening your exam, domain or difficulty filters, or clearing your search term.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetFilters}
            className="text-xs font-bold mt-2"
          >
            Reset Filters
          </Button>
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
