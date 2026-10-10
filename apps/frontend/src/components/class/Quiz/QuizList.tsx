import { BookOpen, Clock, Play, Search, Trophy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import QuizAttempt from "./QuizAttempt";
import type { QuizQuestion } from "./QuizResult";
import QuizResult from "./QuizResult";

interface QuizMeta {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  bestScore?: number;
  questions: QuizQuestion[];
}

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-600",
  Medium: "bg-amber-50 text-amber-600",
  Hard: "bg-red-50 text-red-600",
};

const mockQuizzes: QuizMeta[] = [
  {
    id: "q1",
    title: "Supervised Learning Basics",
    description:
      "Test your understanding of supervised learning algorithms, training processes, and evaluation metrics.",
    questionsCount: 4,
    duration: "10 min",
    difficulty: "Easy",
    bestScore: 85,
    questions: [
      {
        id: "1",
        question: "What is the primary goal of supervised learning?",
        options: [
          "Cluster similar data points",
          "Learn a mapping from inputs to outputs",
          "Reduce dimensionality",
          "Generate new data samples",
        ],
        correctIndex: 1,
      },
      {
        id: "2",
        question: "Which algorithm is commonly used for classification?",
        options: [
          "K-Means",
          "PCA",
          "Logistic Regression",
          "Autoencoders",
        ],
        correctIndex: 2,
      },
      {
        id: "3",
        question: "What does overfitting mean?",
        options: [
          "Model performs poorly on all data",
          "Model learns noise in training data",
          "Model is too simple",
          "Model has low bias",
        ],
        correctIndex: 1,
      },
      {
        id: "4",
        question:
          "Which metric is best for imbalanced classification?",
        options: ["Accuracy", "F1 Score", "MSE", "R-Squared"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "q2",
    title: "Neural Network Architectures",
    description:
      "Challenge yourself on CNN, RNN, Transformer architectures and their real-world applications.",
    questionsCount: 3,
    duration: "8 min",
    difficulty: "Hard",
    questions: [
      {
        id: "5",
        question: "What is the purpose of a convolutional layer?",
        options: [
          "Reduce parameters",
          "Detect spatial features",
          "Normalize inputs",
          "Store memory",
        ],
        correctIndex: 1,
      },
      {
        id: "6",
        question: "What mechanism do Transformers use?",
        options: [
          "Recurrence",
          "Convolution",
          "Self-attention",
          "Pooling",
        ],
        correctIndex: 2,
      },
      {
        id: "7",
        question: "RNNs are best suited for:",
        options: [
          "Image classification",
          "Sequential data",
          "Tabular data",
          "Clustering",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "q3",
    title: "Data Preprocessing",
    description:
      "Explore normalization, encoding, feature selection and data cleaning techniques.",
    questionsCount: 3,
    duration: "7 min",
    difficulty: "Medium",
    bestScore: 100,
    questions: [
      {
        id: "8",
        question: "What is one-hot encoding used for?",
        options: [
          "Numerical features",
          "Categorical features",
          "Missing values",
          "Dimensionality reduction",
        ],
        correctIndex: 1,
      },
      {
        id: "9",
        question: "Feature scaling is important because:",
        options: [
          "It removes outliers",
          "Algorithms converge faster",
          "It adds more features",
          "It labels data",
        ],
        correctIndex: 1,
      },
      {
        id: "10",
        question: "Which handles missing values?",
        options: [
          "Gradient descent",
          "Imputation",
          "Backpropagation",
          "Dropout",
        ],
        correctIndex: 1,
      },
    ],
  },
];

type ViewState =
  | { mode: "list" }
  | { mode: "attempt"; quiz: QuizMeta }
  | { mode: "result"; quiz: QuizMeta; answers: Record<string, number> };

export default function QuizList() {
  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [search, setSearch] = useState("");

  const filteredQuizzes = mockQuizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (view.mode === "attempt") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView({ mode: "list" })}
          className="text-sm text-primary-600 hover:underline"
        >
          ← Back to quizzes
        </button>
        <h2 className="text-lg font-bold text-neutral-900">{view.quiz.title}</h2>
        <QuizAttempt
          questions={view.quiz.questions}
          onSubmit={(answers) =>
            setView({ mode: "result", quiz: view.quiz, answers })
          }
        />
      </div>
    );
  }

  if (view.mode === "result") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView({ mode: "list" })}
          className="text-sm text-primary-600 hover:underline"
        >
          ← Back to quizzes
        </button>
        <QuizResult
          questions={view.quiz.questions}
          answers={view.answers}
          onRetry={() => setView({ mode: "attempt", quiz: view.quiz })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Quizzes</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {mockQuizzes.length} quizzes available
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search quizzes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-60"
          />
        </div>
      </div>

      {/* Quiz cards */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">No quizzes found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="group bg-white rounded-2xl border border-neutral-200/60 p-5 hover:shadow-lg hover:shadow-primary-500/5 hover:border-primary-200/60 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                    difficultyColors[quiz.difficulty],
                  )}
                >
                  {quiz.difficulty}
                </span>
              </div>

              <h3 className="font-bold text-neutral-900 text-sm mb-1.5">
                {quiz.title}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed mb-4 line-clamp-2">
                {quiz.description}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-neutral-400 mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {quiz.questionsCount} Qs
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {quiz.duration}
                </span>
                {quiz.bestScore !== undefined && (
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Trophy className="h-3.5 w-3.5" />
                    {quiz.bestScore}%
                  </span>
                )}
              </div>

              <button
                onClick={() => setView({ mode: "attempt", quiz })}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-all shadow-sm group-hover:shadow-md"
              >
                <Play className="h-4 w-4" />
                Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
