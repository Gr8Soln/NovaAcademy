import { quizzesApi } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  FileQuestion,
  Play,
  Shield,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/buttons";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
}

interface Quiz {
  id: string;
  document_id: string;
  questions: QuizQuestion[];
  created_at: string;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  points_earned: number;
}

type ExamPhase = "select" | "ready" | "exam" | "results";

/* ─── Timer Hook ────────────────────────────────────────────── */

function useCountdown(totalSeconds: number, isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [isActive, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;

  return { timeLeft, formatted, progress };
}

/* ─── Main Component ────────────────────────────────────────── */

export default function ExamHallPage() {
  const [phase, setPhase] = useState<ExamPhase>("select");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  // Fetch available quizzes
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ["quizzes"],
    queryFn: () => quizzesApi.list() as Promise<Quiz[]>,
  });

  // Time per question: 90 seconds
  const totalTime = selectedQuiz ? selectedQuiz.questions.length * 90 : 0;
  const { formatted: timerDisplay, timeLeft } = useCountdown(
    totalTime,
    phase === "exam",
  );

  // Auto-submit when timer runs out
  useEffect(() => {
    if (phase === "exam" && timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, phase]);

  const submitMutation = useMutation({
    mutationFn: (data: { quizId: string; answers: Record<string, string> }) =>
      quizzesApi.submit(data.quizId, data.answers) as Promise<QuizResult>,
    onSuccess: (data) => {
      setResult(data);
      setPhase("results");
    },
  });

  const handleStartExam = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setPhase("ready");
  };

  const handleBegin = () => {
    setPhase("exam");
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(() => {
    if (!selectedQuiz) return;
    submitMutation.mutate({ quizId: selectedQuiz.id, answers });
  }, [selectedQuiz, answers]);

  const handleRetry = () => {
    setPhase("select");
    setSelectedQuiz(null);
    setAnswers({});
    setResult(null);
    setCurrentQuestion(0);
  };

  const question = selectedQuiz?.questions[currentQuestion];
  const totalQuestions = selectedQuiz?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;

  // ── Select Phase ─────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 lg:pb-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-900">
              Exam Hall
            </h1>
            <p className="text-sm text-neutral-500">
              Timed, immersive quizzes to test your knowledge under pressure.
            </p>
          </div>
        </div>

        {quizzesLoading ? (
          <SectionLoader />
        ) : quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileQuestion className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="font-display text-lg font-semibold text-neutral-700 mb-2">
                No Exams Available
              </h3>
              <p className="text-sm text-neutral-500 max-w-md mb-6">
                Upload a document and generate a quiz first. Quizzes you create
                will appear here as exam options.
              </p>
              <Button onClick={() => (window.location.href = "/documents")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Go to Classroom
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="group cursor-pointer hover:border-primary-200 hover:shadow-md transition-all"
                onClick={() => handleStartExam(quiz)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors">
                      <FileQuestion className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="font-display font-semibold text-neutral-900 mb-2">
                    Quiz #{quiz.id.slice(0, 8)}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="h-3.5 w-3.5" />
                      {quiz.questions.length} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5" />~
                      {Math.ceil(quiz.questions.length * 1.5)}m
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Ready Phase ──────────────────────────────────────────────
  if (phase === "ready") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-lg w-full mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-primary-900 mb-2">
                Ready for your Exam?
              </h2>
              <p className="text-neutral-500">
                This exam has <strong>{totalQuestions} questions</strong> with a
                total time of{" "}
                <strong>{Math.ceil(totalTime / 60)} minutes</strong>.
              </p>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-sm text-warning-800 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-500 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium mb-1">Exam Rules</p>
                <ul className="space-y-1 text-xs text-warning-700">
                  <li>The timer starts immediately when you begin</li>
                  <li>You can navigate between questions freely</li>
                  <li>Unanswered questions count as incorrect</li>
                  <li>Your exam auto-submits when time runs out</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleRetry} className="flex-1">
                Go Back
              </Button>
              <Button onClick={handleBegin} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Start Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Results Phase ────────────────────────────────────────────
  if (phase === "results" && result) {
    const percentage = Math.round((result.score / result.total) * 100);
    const passed = percentage >= 60;

    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-lg w-full mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center mx-auto",
                passed ? "bg-success-100" : "bg-danger-100",
              )}
            >
              {passed ? (
                <Trophy className="h-10 w-10 text-success-600" />
              ) : (
                <XCircle className="h-10 w-10 text-danger-600" />
              )}
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-primary-900 mb-1">
                {passed ? "Excellent Work!" : "Keep Practicing!"}
              </h2>
              <p className="text-neutral-500">
                {passed
                  ? "You demonstrated solid knowledge."
                  : "Review the material and try again."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-2xl font-display font-bold text-primary-900">
                  {percentage}%
                </p>
                <p className="text-xs text-neutral-500">Score</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-2xl font-display font-bold text-success-600">
                  {result.score}
                </p>
                <p className="text-xs text-neutral-500">Correct</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-2xl font-display font-bold text-accent-600">
                  +{result.points_earned}
                </p>
                <p className="text-xs text-neutral-500">Points</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleRetry} className="flex-1">
                Back to Exam Hall
              </Button>
              <Button
                onClick={() => {
                  handleRetry();
                  if (selectedQuiz) handleStartExam(selectedQuiz);
                }}
                className="flex-1"
              >
                Retry Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Exam Phase ───────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] max-w-4xl mx-auto pb-20 lg:pb-0">
      {/* Timer & Progress Bar */}
      <div className="sticky top-0 z-20 bg-neutral-50 pt-2 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary-600" />
            <span className="font-display font-semibold text-primary-900">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-sm",
              timeLeft <= 60
                ? "bg-danger-50 text-danger-600 animate-pulse"
                : timeLeft <= totalTime * 0.25
                  ? "bg-warning-50 text-warning-600"
                  : "bg-primary-50 text-primary-700",
            )}
          >
            <Clock className="h-4 w-4" />
            {timerDisplay}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      {question && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-neutral-900 leading-relaxed">
                {question.question}
              </h2>
            </CardContent>
          </Card>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, idx) => {
              const isSelected = answers[question.id] === option;
              const letters = ["A", "B", "C", "D", "E", "F"];

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(question.id, option)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                    isSelected
                      ? "border-primary-500 bg-primary-50 shadow-sm"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold flex-shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    {letters[idx]}
                  </span>
                  <span
                    className={cn(
                      "text-sm sm:text-base font-medium",
                      isSelected ? "text-primary-900" : "text-neutral-700",
                    )}
                  >
                    {option}
                  </span>
                  {isSelected && (
                    <CheckCircle className="ml-auto h-5 w-5 text-primary-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {/* Question dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {selectedQuiz?.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={cn(
                  "h-3 w-3 rounded-full transition-all",
                  idx === currentQuestion
                    ? "bg-primary-600 scale-125"
                    : answers[q.id]
                      ? "bg-primary-300"
                      : "bg-neutral-200",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500 sm:hidden">
            {answeredCount}/{totalQuestions} answered
          </span>
        </div>

        {currentQuestion === totalQuestions - 1 ? (
          <Button
            onClick={handleSubmit}
            loading={submitMutation.isPending}
            className="bg-success-600 hover:bg-success-700"
          >
            Submit Exam
          </Button>
        ) : (
          <Button
            onClick={() =>
              setCurrentQuestion((p) => Math.min(totalQuestions - 1, p + 1))
            }
          >
            Next
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
