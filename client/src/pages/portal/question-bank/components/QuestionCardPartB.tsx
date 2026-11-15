import React, { useState } from 'react';
import { 
  PenTool, Clock, Sparkles, CheckCircle2, Star, 
  Eye, EyeOff, BookOpen, Layers, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/sanitize';
import { QuestionItem } from '../types';

interface QuestionCardPartBProps {
  question: QuestionItem;
  questionIndex: number;
  isPracticed: boolean;
  isBookmarked: boolean;
  onTogglePracticed: (id: string, part?: 'A' | 'B') => void;
  onToggleBookmarked: (id: string) => void;
  forceShowAnswer?: boolean;
}

export const QuestionCardPartB: React.FC<QuestionCardPartBProps> = ({
  question,
  questionIndex,
  isPracticed,
  isBookmarked,
  onTogglePracticed,
  onToggleBookmarked,
  forceShowAnswer = false,
}) => {
  const [showModelApproach, setShowModelApproach] = useState(false);
  const isRevealed = forceShowAnswer || showModelApproach;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-6 shadow-xs space-y-4 w-full min-w-0 overflow-hidden ${
      isPracticed ? 'border-black/10' : 'border-purple-300 ring-1 ring-purple-100'
    }`}>
      {/* 1. Header: Studio Tags, Time Target & Bookmark */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-black text-foreground/50 bg-black/5 px-2 py-0.5 rounded-md">
            Q{questionIndex + 1}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
            <PenTool className="w-3 h-3 text-purple-600" />
            Part B Subjective Studio
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
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
              {question.pyq_tag}
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
            <Clock className="w-3 h-3 text-neutral-500" />
            20–25 Mins Target
          </span>

          {/* Practice Status */}
          {isPracticed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Practiced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Fresh Studio
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
            onClick={() => onTogglePracticed(question.id, 'B')}
            className={`p-1.5 px-2.5 rounded-lg border text-[11px] font-bold transition-all ${
              isPracticed
                ? 'bg-neutral-50 border-black/10 text-foreground/60 hover:bg-neutral-100'
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
            }`}
            title={isPracticed ? "Mark as unpracticed (fresh)" : "Mark drawing as practiced"}
          >
            {isPracticed ? 'Mark as Fresh' : 'Mark Practiced'}
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

      {/* 3. Design Studio Brief Statement */}
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-purple-800/80 block">
          Creative Design Brief
        </span>
        <div
          className="prose prose-sm max-w-none text-[#18181b] font-medium leading-relaxed break-words whitespace-normal [overflow-wrap:anywhere] [word-break:break-word]"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml((question.content_text || '').replace(/(?:&nbsp;|\u00A0)/g, ' ').replace(/\n/g, '<br/>'))
          }}
        />
      </div>

      {/* 4. Question Visual Media Prompt */}
      {question.media_url && (
        <div className="my-3 flex justify-center bg-neutral-50 rounded-xl p-3 border border-black/5 overflow-hidden">
          <img
            src={question.media_url}
            alt="Design Studio Reference"
            className="max-h-[380px] max-w-full rounded-lg object-contain shadow-2xs"
            loading="lazy"
          />
        </div>
      )}

      {/* 5. Model Approach & 5-Axis Rubric Toggle */}
      <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowModelApproach(prev => !prev)}
          className={`text-xs font-bold h-8 gap-1.5 ${
            isRevealed
              ? 'bg-black/5 hover:bg-black/10 text-foreground/80'
              : 'border-purple-300 text-purple-700 hover:bg-purple-50'
          }`}
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Hide Model Approach
            </>
          ) : (
            <>
              <BookOpen className="w-3.5 h-3.5" /> View Model Approach & 5-Axis Rubric
            </>
          )}
        </Button>
      </div>

      {/* 7. Rubric & Model Strategy Drawer */}
      {isRevealed && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3.5 text-xs text-neutral-900 mt-2">
          <div className="flex items-center gap-2 font-black text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>NID & CEED 5-Axis Subjective Evaluation Matrix:</span>
          </div>

          {/* Model Answer / Mentor Notes if present */}
          {question.sample_answer && (
            <div className="p-3.5 bg-white rounded-xl border border-purple-200/60 space-y-1.5">
              <strong className="text-purple-950 font-black block text-[11px] uppercase tracking-wider">
                Benchmark Model Approach & Sketch Strategy:
              </strong>
              <p className="text-neutral-700 leading-relaxed [overflow-wrap:anywhere] whitespace-pre-line text-xs font-medium">
                {question.sample_answer.replace(/(?:&nbsp;|\u00A0)/g, ' ')}
              </p>
            </div>
          )}

          {/* 5-Axis Criteria Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[10.5px]">
            <div className="p-2.5 bg-white rounded-lg border border-purple-100 space-y-1">
              <strong className="text-purple-950 block font-bold">1. Critical Thinking (20%)</strong>
              <p className="text-neutral-600">Addressing the root ergonomic and practical challenge.</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-purple-100 space-y-1">
              <strong className="text-purple-950 block font-bold">2. Ideation (20%)</strong>
              <p className="text-neutral-600">Originality and departure from common generic shapes.</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-purple-100 space-y-1">
              <strong className="text-purple-950 block font-bold">3. Storytelling (20%)</strong>
              <p className="text-neutral-600">User scenario context and sequence of interaction.</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-purple-100 space-y-1">
              <strong className="text-purple-950 block font-bold">4. Feasibility (20%)</strong>
              <p className="text-neutral-600">Realistic materials, manufacturing and joinery details.</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-purple-100 space-y-1">
              <strong className="text-purple-950 block font-bold">5. Representation (20%)</strong>
              <p className="text-neutral-600">Perspective accuracy, linework quality, and neat callouts.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
