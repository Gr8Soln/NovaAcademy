import { Bot, Send, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

import HighlightedText from "./HighlightedText";
import NovaAIResponse from "./NovaAIResponse";

// ── Mock data ───────────────────────────────────────────────
interface QA {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

const mockHistory: QA[] = [
  {
    id: "s1",
    question: "What is gradient descent?",
    answer:
      "Gradient descent is an optimization algorithm used to minimize a function by iteratively moving in the direction of steepest descent. In machine learning, it's used to update model parameters (weights) to reduce the loss function.\n\nThe learning rate controls the step size — too large and you may overshoot the minimum, too small and training will be very slow.",
    timestamp: "2:30 PM",
  },
  {
    id: "s2",
    question: "Explain the bias-variance tradeoff",
    answer:
      "The bias-variance tradeoff is a fundamental concept:\n\n• High Bias: Model is too simple, underfits the data (e.g., linear regression on nonlinear data)\n• High Variance: Model is too complex, overfits the training data (e.g., deep decision tree)\n\nThe goal is to find the sweet spot where total error (bias² + variance + irreducible error) is minimized. Techniques like cross-validation and regularization help achieve this balance.",
    timestamp: "3:15 PM",
  },
];

const sampleText =
  "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. Unlike traditional programming where rules are explicitly coded, ML algorithms identify patterns in data and make decisions with minimal human intervention. The three main types are supervised learning, unsupervised learning, and reinforcement learning.";

const sampleHighlights = [
  { start: 0, end: 16 }, // "Machine learning"
  { start: 34, end: 57 }, // "artificial intelligence"
  { start: 189, end: 208 }, // "supervised learning"
  { start: 210, end: 232 }, // "unsupervised learning"
  { start: 238, end: 260 }, // "reinforcement learning"
];

export default function StudyInterface() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>(mockHistory);

  const handleAsk = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    setHistory((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        question: trimmed,
        answer:
          "Great question! This is a placeholder answer. Once the backend is connected, NovaAI will provide contextual, document-aware explanations here.",
        timestamp: time,
      },
    ]);
    setQuestion("");
  };

  return (
    <div className="space-y-6">
      {/* Highlighted study text */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent-500" />
          <h3 className="text-sm font-semibold text-neutral-900">
            Study Material
          </h3>
        </div>
        <HighlightedText text={sampleText} highlights={sampleHighlights} />
        <p className="text-xs text-neutral-400 mt-3">
          Key terms are highlighted. Select text to ask NovaAI to explain.
        </p>
      </div>

      {/* Ask NovaAI */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Ask NovaAI
        </h3>
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about this material…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
          <button
            type="submit"
            disabled={!question.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-700 text-white hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Previous AI responses */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Previous Responses
        </h3>
        {history.map((qa) => (
          <NovaAIResponse
            key={qa.id}
            question={qa.question}
            answer={qa.answer}
            timestamp={qa.timestamp}
          />
        ))}
      </div>

      {/* Floating NovaAI icon */}
      <div className="fixed bottom-6 right-6">
        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg hover:bg-primary-600 transition-colors">
          <Bot className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
