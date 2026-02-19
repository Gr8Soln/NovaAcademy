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
        <span className="text-xs font-medium text-primary-700">
          {answeredCount}/{total} answered
        </span>
      </div>
      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-700 rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <p className="text-base font-medium text-neutral-900 mb-5">
          {current.question}
        </p>

        <div className="space-y-2.5">
          {current.options.map((opt, optIdx) => {
            const selected = answers[current.id] === optIdx;
            return (
              <button
                key={optIdx}
                onClick={() => selectOption(optIdx)}
                className={cn(
                  "flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
                  selected
                    ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:bg-primary-50/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0 border",
                    selected
                      ? "bg-primary-700 text-white border-primary-700"
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
          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {currentIdx < total - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onSubmit(answers)}
            disabled={!allAnswered}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-success-500 rounded-lg hover:bg-success-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            <Send className="h-4 w-4" />
            Submit
          </button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIdx(idx)}
            className={cn(
              "h-8 w-8 rounded-full text-xs font-medium transition-colors",
              idx === currentIdx
                ? "bg-primary-700 text-white"
                : answers[q.id] !== undefined
                  ? "bg-primary-100 text-primary-700"
                  : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200",
            )}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
