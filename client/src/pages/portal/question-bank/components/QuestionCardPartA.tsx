import React, { useState } from 'react';
import { 
  CheckCircle2, Star, Eye, EyeOff, RotateCcw, 
  HelpCircle, Sparkles, Check, X, Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/sanitize';
import { QuestionItem, QuestionOption } from '../types';

interface QuestionCardPartAProps {
  question: QuestionItem;
  options: QuestionOption[];
  questionIndex: number;
  isPracticed: boolean;
  isBookmarked: boolean;
  onTogglePracticed: (id: string, part?: 'A' | 'B') => void;
  onToggleBookmarked: (id: string) => void;
  forceShowAnswer?: boolean;
}

export const QuestionCardPartA: React.FC<QuestionCardPartAProps> = ({
  question,
  options,
  questionIndex,
  isPracticed,
  isBookmarked,
  onTogglePracticed,
  onToggleBookmarked,
  forceShowAnswer = false,
}) => {
  const [selectedOptIds, setSelectedOptIds] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const isMSQ = question.type === 'MSQ';
  const isNAT = question.type === 'NAT';
  const [natAnswerInput, setNatAnswerInput] = useState('');

  const isAnswerRevealed = forceShowAnswer || showAnswer;

  const handleSelectOption = (optId: string) => {
    // Automatically mark as practiced when student attempts
    if (!isPracticed) {
      onTogglePracticed(question.id, 'A');
    }

    if (isMSQ) {
      setSelectedOptIds(prev => 
        prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]
      );
    } else {
      setSelectedOptIds([optId]);
    }
  };

  const correctOptions = options.filter(o => o.is_correct);
  const correctOptionIds = correctOptions.map(o => o.id);
  const hasSelected = selectedOptIds.length > 0;
  
  const isFullyCorrect = 
    hasSelected && 
    correctOptionIds.length === selectedOptIds.length && 
    selectedOptIds.every(id => correctOptionIds.includes(id));

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-6 shadow-xs space-y-4 w-full min-w-0 overflow-hidden ${
      isPracticed ? 'border-black/10' : 'border-primary/25 ring-1 ring-primary/10'
    }`}>
      {/* 1. Header Toolbar: Meta Tags, Status & Bookmark */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-black text-foreground/50 bg-black/5 px-2 py-0.5 rounded-md">
            Q{questionIndex + 1}
          </span>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
            {question.type}
          </span>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            question.difficulty === 'High'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : question.difficulty === 'Medium'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {question.difficulty} Difficulty
          </span>

          {question.pyq_tag && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
              {question.pyq_tag}
            </span>
          )}

          {/* Practice Status Badge */}
          {isPracticed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Practiced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Fresh
            </span>
          )}
        </div>

        {/* Right Actions: Bookmark & Practiced Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleBookmarked(question.id)}
            className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
              isBookmarked
                ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
                : 'bg-white border-black/10 text-foreground/50 hover:text-foreground hover:bg-neutral-50'
            }`}
            title={isBookmarked ? "Remove bookmark" : "Star for revision"}
          >
            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span className="text-[11px] hidden sm:inline">{isBookmarked ? 'Starred' : 'Star'}</span>
          </button>

          <button
            type="button"
            onClick={() => onTogglePracticed(question.id, 'A')}
            className={`p-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all ${
              isPracticed
                ? 'bg-neutral-50 border-black/10 text-foreground/60 hover:bg-neutral-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={isPracticed ? "Mark as unpracticed (fresh)" : "Mark as solved"}
          >
            {isPracticed ? 'Mark as Fresh' : 'Mark Solved'}
          </button>
        </div>
      </div>

      {/* 2. Topics Tags */}
      {question.topics && question.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {question.topics.map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 text-neutral-600"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* 3. Question Statement */}
      <div
        className="prose prose-sm max-w-none text-[#18181b] font-medium leading-relaxed break-words whitespace-normal [overflow-wrap:anywhere] [word-break:break-word]"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml((question.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>'))
        }}
      />

      {/* 4. Question Media Image if any */}
      {question.media_url && (
        <div className="my-3 flex justify-center bg-neutral-50 rounded-xl p-3 border border-black/5 overflow-hidden">
          <img
            src={question.media_url}
            alt="Question Diagram"
            className="max-h-[380px] max-w-full rounded-lg object-contain shadow-2xs"
            loading="lazy"
          />
        </div>
      )}

      {/* 5. Options Grid (For MCQ and MSQ) */}
      {!isNAT && options.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
              {isMSQ ? 'Select One or More Correct Options (MSQ):' : 'Select Option to Practice:'}
            </span>
            {hasSelected && (
              <span className={`text-[11px] font-extrabold flex items-center gap-1 ${
                isFullyCorrect ? 'text-emerald-600' : 'text-amber-700'
              }`}>
                {isFullyCorrect ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Correct!
                  </>
                ) : (
                  <span>Click Show Answer to review</span>
                )}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {options.map((opt, optIdx) => {
              const isSelected = selectedOptIds.includes(opt.id);
              const isCorrect = Boolean(opt.is_correct);

              let cardStyles = 'bg-white border-black/10 hover:border-black/30 text-foreground/80';

              if (isAnswerRevealed) {
                if (isCorrect) {
                  cardStyles = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                } else if (isSelected && !isCorrect) {
                  cardStyles = 'bg-red-50 border-red-300 text-red-900 line-through opacity-80';
                } else {
                  cardStyles = 'bg-neutral-50/50 border-black/5 text-foreground/50 opacity-60';
                }
              } else if (isSelected) {
                cardStyles = 'bg-primary/[0.04] border-primary text-primary font-bold shadow-2xs ring-1 ring-primary/20';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  className={`p-3 sm:p-3.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-2 ${cardStyles}`}
                >
                  <div className="flex items-start gap-2.5 w-full">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      isAnswerRevealed && isCorrect
                        ? 'bg-emerald-600 text-white'
                        : isSelected
                        ? 'bg-primary text-white'
                        : 'bg-black/10 text-foreground/70'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1 mt-0.5 leading-snug">{opt.content_text}</span>
                    {isAnswerRevealed && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                  </div>

                  {opt.media_url && (
                    <div className="w-full flex items-center justify-center p-2 bg-neutral-50/70 rounded-xl border border-black/5 mt-1 overflow-hidden">
                      <img
                        src={opt.media_url}
                        alt={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="rounded-lg max-h-[300px] max-w-full w-auto h-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. NAT Input Practice */}
      {isNAT && (
        <div className="pt-2 space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50 block">
            Numerical Answer Input (NAT):
          </label>
          <div className="flex items-center gap-2 max-w-xs">
            <input
              type="text"
              placeholder="Enter numerical value..."
              value={natAnswerInput}
              onChange={(e) => {
                setNatAnswerInput(e.target.value);
                if (!isPracticed) onTogglePracticed(question.id);
              }}
              className="h-9 px-3 rounded-xl border border-black/15 bg-white text-xs font-mono font-bold w-full"
            />
          </div>
        </div>
      )}

      {/* 7. Answer & Solution Toggle Bar */}
      <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowAnswer(prev => !prev)}
          className={`text-xs font-bold h-8 gap-1.5 ${
            isAnswerRevealed
              ? 'bg-black/5 hover:bg-black/10 text-foreground/80'
              : 'border-primary/30 text-primary hover:bg-primary/5'
          }`}
        >
          {isAnswerRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Hide Solution
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" /> Show Answer & Solution
            </>
          )}
        </Button>
      </div>

      {/* 8. Solution Drawer */}
      {isAnswerRevealed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 text-xs text-emerald-950 mt-2">
          <div className="flex items-center gap-2 font-black text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {(() => {
                if (correctOptions.length > 0) {
                  const letters = correctOptions.map(o => {
                    const idx = options.findIndex(opt => opt.id === o.id);
                    return idx >= 0 ? String.fromCharCode(65 + idx) : '';
                  }).filter(Boolean);
                  const textSnippet = correctOptions.length === 1 && correctOptions[0].content_text 
                    ? ` — ${correctOptions[0].content_text}`
                    : '';
                  return `Correct Answer: Option${letters.length > 1 ? 's' : ''} ${letters.join(', ')}${textSnippet}`;
                }
                return `Correct Answer: ${question.correct_answer || question.answer_key || question.answer || 'Refer to step-by-step solution below'}`;
              })()}
            </span>
          </div>

          {(question.explanation || question.solution_text) && (
            <div className="text-emerald-900/90 pl-6 leading-relaxed border-t border-emerald-200/60 pt-2 mt-1">
              <strong className="font-bold block mb-1">Step-by-Step Solution & Concept:</strong>
              <div 
                className="prose prose-xs max-w-none [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml((question.explanation || question.solution_text || '').replace(/\n/g, '<br/>'))
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
