import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { QuizQuestion } from "./QuizResult";

interface QuizAttemptProps {
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, number>) => void;
}

export default function QuizAttempt({ questions, onSubmit }: QuizAttemptProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const current = questions[currentIdx];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  const selectOption = (optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: optIdx }));
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          Question {currentIdx + 1} of {total}
        </span>
        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
          {answeredCount}/{total} answered
        </span>
      </div>
      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
        <p className="text-base font-semibold text-neutral-900 mb-6 leading-relaxed">
          {current.question}
        </p>

        <div className="space-y-3">
          {current.options.map((opt, optIdx) => {
            const selected = answers[current.id] === optIdx;
            return (
              <button
                key={optIdx}
                onClick={() => selectOption(optIdx)}
                className={cn(
                  "flex items-center gap-3.5 w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all duration-200",
                  selected
                    ? "border-primary-500 bg-primary-50 text-primary-700 font-semibold shadow-sm shadow-primary-500/10 scale-[1.01]"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:bg-primary-50/40 hover:scale-[1.005]",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 border-2 transition-all",
                    selected
                      ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                      : "bg-white text-neutral-500 border-neutral-300",
                  )}
                >
                  {String.fromCharCode(65 + optIdx)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {currentIdx < total - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-all shadow-sm"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onSubmit(answers)}
            disabled={!allAnswered}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm",
              allAnswered
                ? "bg-gradient-to-r from-success-500 to-emerald-500 text-white hover:shadow-md hover:scale-[1.02]"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed",
            )}
          >
            <Send className="h-4 w-4" />
            Submit Quiz
          </button>
        )}
      </div>

      {/* Question dots navigator */}
      <div className="flex items-center justify-center gap-2 pt-2">
        {questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-bold transition-all",
              idx === currentIdx
                ? "bg-primary-600 text-white shadow-sm scale-110"
                : answers[questions[idx].id] !== undefined
                ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
            )}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
