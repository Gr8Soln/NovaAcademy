import { CheckCircle, RotateCcw, Trophy, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizResultProps {
  questions: QuizQuestion[];
  answers: Record<string, number>;
  onRetry: () => void;
}

export default function QuizResult({
  questions,
  answers,
  onRetry,
}: QuizResultProps) {
  const total = questions.length;
  const correct = questions.filter(
    (q) => answers[q.id] === q.correctIndex,
  ).length;
  const pct = Math.round((correct / total) * 100);

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center">
        <div
          className={cn(
            "inline-flex h-16 w-16 items-center justify-center rounded-full mb-4",
            pct >= 70
              ? "bg-success-50 text-success-500"
              : "bg-danger-50 text-danger-500",
          )}
        >
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-neutral-900 mb-1">
          {correct}/{total} Correct
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          You scored <span className="font-semibold">{pct}%</span> on this quiz
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-600 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Quiz
        </button>
      </div>

      {/* Detailed review */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Review Answers
        </h3>
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correctIndex;

          return (
            <div
              key={q.id}
              className={cn(
                "bg-white rounded-xl border p-4",
                isCorrect ? "border-success-200" : "border-danger-200",
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-success-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger-500 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium text-neutral-900">
                  {idx + 1}. {q.question}
                </p>
              </div>

              <div className="ml-8 space-y-1.5">
                {q.options.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    className={cn(
                      "text-sm px-3 py-1.5 rounded-lg",
                      optIdx === q.correctIndex &&
                        "bg-success-50 text-success-700 font-medium",
                      optIdx === userAnswer &&
                        optIdx !== q.correctIndex &&
                        "bg-danger-50 text-danger-600 line-through",
                      optIdx !== q.correctIndex &&
                        optIdx !== userAnswer &&
                        "text-neutral-500",
                    )}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
