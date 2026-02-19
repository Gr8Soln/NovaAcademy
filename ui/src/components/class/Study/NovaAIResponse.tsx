import { Bot, Sparkles } from "lucide-react";

interface NovaAIResponseProps {
  question: string;
  answer: string;
  timestamp?: string;
}

export default function NovaAIResponse({
  question,
  answer,
  timestamp,
}: NovaAIResponseProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Question */}
      <div className="flex items-start gap-3 px-4 py-3 bg-neutral-50 border-b border-neutral-100">
        <Sparkles className="h-4 w-4 text-accent-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-neutral-900">{question}</p>
          {timestamp && (
            <span className="text-xs text-neutral-400">{timestamp}</span>
          )}
        </div>
      </div>

      {/* AI Answer */}
      <div className="flex gap-3 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 flex-shrink-0 mt-0.5">
          <Bot className="h-3.5 w-3.5" />
        </div>
        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {answer}
        </p>
      </div>
    </div>
  );
}
