import { Bot, Copy, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

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
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden hover:shadow-md transition-all group">
      {/* Question header */}
      <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-accent-50/50 to-primary-50/30 border-b border-neutral-100/80">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-100 text-accent-600 flex-shrink-0 mt-0.5">
          <Sparkles className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-neutral-900">
            {question}
          </p>
          {timestamp && (
            <span className="text-[10px] text-neutral-400">{timestamp}</span>
          )}
        </div>
      </div>

      {/* AI Answer */}
      <div className="px-4 py-4">
        <div className="flex gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white flex-shrink-0 mt-0.5 shadow-sm">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {answer}
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <Copy className="h-3 w-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={() => setFeedback(feedback === "up" ? null : "up")}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              feedback === "up"
                ? "text-success-500 bg-success-50"
                : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100",
            )}
          >
            <ThumbsUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => setFeedback(feedback === "down" ? null : "down")}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              feedback === "down"
                ? "text-danger-500 bg-danger-50"
                : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100",
            )}
          >
            <ThumbsDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
