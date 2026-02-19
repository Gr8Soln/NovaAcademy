import { Clock, PenTool, Trophy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import QuizAttempt from "./QuizAttempt";
import type { QuizQuestion } from "./QuizResult";
import QuizResult from "./QuizResult";

// ── Mock data ───────────────────────────────────────────────
interface QuizData {
  id: string;
  title: string;
  questionCount: number;
  duration: string;
  bestScore: number | null;
  questions: QuizQuestion[];
}

const mockQuizzes: QuizData[] = [
  {
    id: "q1",
    title: "ML Fundamentals — Week 1",
    questionCount: 5,
    duration: "10 min",
    bestScore: 80,
    questions: [
      {
        id: "q1-1",
        question:
          "Which of the following is an example of supervised learning?",
        options: [
          "Clustering customers by behavior",
          "Predicting house prices from labeled data",
          "Reducing dimensionality of a dataset",
          "Training a robot through trial and error",
        ],
        correctIndex: 1,
      },
      {
        id: "q1-2",
        question: "What does the learning rate control in gradient descent?",
        options: [
          "The number of hidden layers",
          "The size of each training batch",
          "The step size during parameter updates",
          "The amount of regularization applied",
        ],
        correctIndex: 2,
      },
      {
        id: "q1-3",
        question: "Overfitting occurs when a model:",
        options: [
          "Performs well on training data but poorly on test data",
          "Performs poorly on both training and test data",
          "Has too few parameters",
          "Uses too much regularization",
        ],
        correctIndex: 0,
      },
      {
        id: "q1-4",
        question: "Which activation function outputs values between 0 and 1?",
        options: ["ReLU", "Tanh", "Sigmoid", "Leaky ReLU"],
        correctIndex: 2,
      },
      {
        id: "q1-5",
        question: "K-Means is an example of which type of learning?",
        options: [
          "Supervised learning",
          "Unsupervised learning",
          "Reinforcement learning",
          "Semi-supervised learning",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "q2",
    title: "Neural Networks Basics",
    questionCount: 5,
    duration: "15 min",
    bestScore: null,
    questions: [
      {
        id: "q2-1",
        question: "What is backpropagation used for?",
        options: [
          "Forward passing input through the network",
          "Computing gradients to update weights",
          "Choosing the activation function",
          "Selecting the number of layers",
        ],
        correctIndex: 1,
      },
      {
        id: "q2-2",
        question: "A single perceptron can solve which of the following?",
        options: [
          "XOR problem",
          "Linearly separable problems",
          "Image recognition",
          "NLP tasks",
        ],
        correctIndex: 1,
      },
      {
        id: "q2-3",
        question: "Dropout is used to:",
        options: [
          "Speed up training",
          "Prevent overfitting by randomly deactivating neurons",
          "Increase the learning rate",
          "Add more training data",
        ],
        correctIndex: 1,
      },
      {
        id: "q2-4",
        question: "What does a loss function measure?",
        options: [
          "The number of training epochs",
          "The difference between predicted and actual values",
          "The size of the neural network",
          "The learning rate schedule",
        ],
        correctIndex: 1,
      },
      {
        id: "q2-5",
        question: "Which layer type is commonly used for image classification?",
        options: [
          "Recurrent",
          "Convolutional",
          "Fully connected only",
          "Embedding",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "q3",
    title: "Data Preprocessing & Feature Engineering",
    questionCount: 4,
    duration: "8 min",
    bestScore: 100,
    questions: [
      {
        id: "q3-1",
        question: "What is feature scaling?",
        options: [
          "Adding new features to the dataset",
          "Normalizing feature values to a standard range",
          "Removing irrelevant features",
          "Encoding categorical variables",
        ],
        correctIndex: 1,
      },
      {
        id: "q3-2",
        question: "One-hot encoding is used for:",
        options: [
          "Scaling numerical features",
          "Converting categorical variables into binary vectors",
          "Handling missing values",
          "Reducing dimensionality",
        ],
        correctIndex: 1,
      },
      {
        id: "q3-3",
        question: "What is imputation?",
        options: [
          "Removing outliers from a dataset",
          "Filling in missing values with estimated ones",
          "Splitting data into train and test sets",
          "Encoding text data as numbers",
        ],
        correctIndex: 1,
      },
      {
        id: "q3-4",
        question: "PCA is used for:",
        options: [
          "Classification",
          "Dimensionality reduction",
          "Data collection",
          "Model deployment",
        ],
        correctIndex: 1,
      },
    ],
  },
];

type View = "list" | "attempt" | "result";

export default function QuizList() {
  const [view, setView] = useState<View>("list");
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Record<string, number>
  >({});

  const startQuiz = (quiz: QuizData) => {
    setActiveQuiz(quiz);
    setSubmittedAnswers({});
    setView("attempt");
  };

  const handleSubmit = (answers: Record<string, number>) => {
    setSubmittedAnswers(answers);
    setView("result");
  };

  const handleRetry = () => {
    setSubmittedAnswers({});
    setView("attempt");
  };

  const backToList = () => {
    setView("list");
    setActiveQuiz(null);
  };

  // ── Attempt view ──────────────────────────────────────
  if (view === "attempt" && activeQuiz) {
    return (
      <div className="space-y-4">
        <button
          onClick={backToList}
          className="text-sm text-primary-700 hover:text-primary-600 font-medium"
        >
          ← Back to quizzes
        </button>
        <h2 className="font-display text-lg font-semibold text-neutral-900">
          {activeQuiz.title}
        </h2>
        <QuizAttempt questions={activeQuiz.questions} onSubmit={handleSubmit} />
      </div>
    );
  }

  // ── Result view ───────────────────────────────────────
  if (view === "result" && activeQuiz) {
    return (
      <div className="space-y-4">
        <button
          onClick={backToList}
          className="text-sm text-primary-700 hover:text-primary-600 font-medium"
        >
          ← Back to quizzes
        </button>
        <h2 className="font-display text-lg font-semibold text-neutral-900">
          {activeQuiz.title} — Results
        </h2>
        <QuizResult
          questions={activeQuiz.questions}
          answers={submittedAnswers}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-neutral-900">
        Available Quizzes
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockQuizzes.map((quiz) => (
          <div
            key={quiz.id}
            onClick={() => startQuiz(quiz)}
            className={cn(
              "group bg-white rounded-xl border border-neutral-200 p-5",
              "hover:shadow-md hover:border-primary-200 transition-all cursor-pointer",
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <PenTool className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                {quiz.title}
              </h4>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>{quiz.questionCount} questions</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {quiz.duration}
              </div>
              {quiz.bestScore !== null && (
                <div className="flex items-center gap-1 text-success-500">
                  <Trophy className="h-3 w-3" />
                  Best: {quiz.bestScore}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
