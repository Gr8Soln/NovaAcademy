import { BookOpen, Bot, Lightbulb, Send, Sparkles, Wand2 } from "lucide-react";
import { useState, type FormEvent } from "react";



import HighlightedText from "./HighlightedText";
import NovaAIResponse from "./NovaAIResponse";

/* ── Mock data ───────────────────────────────────────────── */
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
    answer: "Gradient descent is an optimization algorithm used to minimize a function by iteratively moving in the direction of steepest descent. In machine learning, it's used to update model parameters (weights) to reduce the loss function.\n\nThe learning rate controls the step size — too large and you may overshoot the minimum, too small and training will be very slow.",
    timestamp: "2:30 PM",
  },
  {
    id: "s2",
    question: "Explain the bias-variance tradeoff",
    answer: "The bias-variance tradeoff is a fundamental concept:\n\n• High Bias: Model is too simple, underfits the data (e.g., linear regression on nonlinear data)\n• High Variance: Model is too complex, overfits the training data (e.g., deep decision tree)\n\nThe goal is to find the sweet spot where total error (bias² + variance + irreducible error) is minimized. Techniques like cross-validation and regularization help achieve this balance.",
    timestamp: "3:15 PM",
  },
];

const sampleText =
  "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. Unlike traditional programming where rules are explicitly coded, ML algorithms identify patterns in data and make decisions with minimal human intervention. The three main types are supervised learning, unsupervised learning, and reinforcement learning.";

const sampleHighlights = [
  { start: 0, end: 16 },
  { start: 34, end: 57 },
  { start: 189, end: 208 },
  { start: 210, end: 232 },
  { start: 238, end: 260 },
];

const suggestedPrompts = [
  { icon: Lightbulb, text: "Explain this in simpler terms" },
  { icon: Wand2, text: "Give me an example" },
  { icon: BookOpen, text: "Create flashcards from this" },
];

export default function StudyInterface() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>(mockHistory);

  const handleAsk = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    setHistory((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        question: trimmed,
        answer: "Great question! This is a placeholder answer. Once the backend is connected, NovaAI will provide contextual, document-aware explanations here. 🤖",
        timestamp: time,
      },
    ]);
    setQuestion("");
  };

  const handlePrompt = (text: string) => {
    setQuestion(text);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="font-display text-lg font-bold text-neutral-900">Study Mode</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Highlight key terms to explore. Ask NovaAI anything.</p>
      </div>

      {/* Study material card */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent-50/50 to-primary-50/40 border-b border-neutral-100/80">
          <Sparkles className="h-4 w-4 text-accent-500" />
          <h3 className="text-sm font-bold text-neutral-900">Study Material</h3>
          <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full ml-auto">
            Week 1
          </span>
        </div>
        <div className="p-5">
          <HighlightedText text={sampleText} highlights={sampleHighlights} />
          <p className="text-[10px] text-neutral-400 mt-4 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Key terms are highlighted. Click any to ask NovaAI to explain.
          </p>
        </div>
      </div>

      {/* Ask NovaAI section */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-100/80">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white">
            <Bot className="h-3 w-3" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">Ask NovaAI</h3>
        </div>
        <div className="p-5 space-y-3">
          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt.text}
                onClick={() => handlePrompt(prompt.text)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-all"
              >
                <prompt.icon className="h-3 w-3" />
                {prompt.text}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleAsk} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
              <input
                type="text"
                placeholder="Ask a question about this material…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!question.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Previous AI responses */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Previous Responses</h3>
            <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
              {history.length} questions
            </span>
          </div>
          <div className="space-y-3">
            {history.map((qa) => (
              <NovaAIResponse key={qa.id} question={qa.question} answer={qa.answer} timestamp={qa.timestamp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
