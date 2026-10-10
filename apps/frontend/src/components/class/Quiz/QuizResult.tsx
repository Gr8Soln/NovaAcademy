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

import { cn } from "@/lib/utils";
import { CheckCircle, RotateCcw, Share2, XCircle } from "lucide-react";

export default function QuizResult({ questions, answers, onRetry }: QuizResultProps) {
  const total = questions.length;
  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const pct = Math.round((correct / total) * 100);

  const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "F";
  const gradeColor = pct >= 70 ? "from-emerald-500 to-teal-500" : pct >= 50 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500";
  const emoji = pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "💪" : "📖";

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden">
        <div className={cn("bg-gradient-to-br p-8 text-center text-white", gradeColor)}>
          <span className="text-5xl mb-3 block">{emoji}</span>
          <h2 className="font-display text-3xl font-bold mb-1">
            {correct}/{total} Correct
          </h2>
          <p className="text-sm opacity-90 mb-4">
            You scored <span className="font-bold">{pct}%</span> — Grade: <span className="font-bold">{grade}</span>
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Quiz
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex divide-x divide-neutral-100">
          <div className="flex-1 p-4 text-center">
            <p className="text-lg font-bold text-success-500">{correct}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Correct</p>
          </div>
          <div className="flex-1 p-4 text-center">
            <p className="text-lg font-bold text-danger-500">{total - correct}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Wrong</p>
          </div>
          <div className="flex-1 p-4 text-center">
            <p className="text-lg font-bold text-neutral-900">{pct}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Score</p>
          </div>
        </div>
      </div>

      {/* Detailed review */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">Review Answers</h3>
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correctIndex;

          return (
            <div
              key={q.id}
              className={cn(
                "bg-white rounded-2xl border-2 p-5",
                isCorrect ? "border-success-200/80" : "border-danger-200/80",
              )}
            >
              <div className="flex items-start gap-3 mb-4">
                {isCorrect ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success-100 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-success-500" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-danger-100 flex-shrink-0">
                    <XCircle className="h-4 w-4 text-danger-500" />
                  </div>
                )}
                <p className="text-sm font-semibold text-neutral-900 pt-0.5">
                  {idx + 1}. {q.question}
                </p>
              </div>

              <div className="ml-10 space-y-2">
                {q.options.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    className={cn(
                      "text-xs px-3 py-2 rounded-xl flex items-center gap-2 transition-colors",
                      optIdx === q.correctIndex && "bg-success-50 text-success-700 font-semibold ring-1 ring-success-200",
                      optIdx === userAnswer && optIdx !== q.correctIndex && "bg-danger-50 text-danger-600 line-through ring-1 ring-danger-200",
                      optIdx !== q.correctIndex && optIdx !== userAnswer && "text-neutral-500",
                    )}
                  >
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0",
                      optIdx === q.correctIndex ? "bg-success-200 text-success-700" :
                      optIdx === userAnswer ? "bg-danger-200 text-danger-600" :
                      "bg-neutral-100 text-neutral-400"
                    )}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
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
