import { Bot, User } from "lucide-react";

import { cn } from "@/lib/utils";

export interface MessageData {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
}

interface MessageProps {
  message: MessageData;
}

export default function Message({ message }: MessageProps) {
  const isAI = message.sender === "ai";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isAI ? "bg-neutral-50" : "bg-white",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          isAI
            ? "bg-primary-100 text-primary-700"
            : "bg-accent-100 text-accent-600",
        )}
      >
        {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-neutral-900">
            {isAI ? "NovaAI" : "You"}
          </span>
          <span className="text-xs text-neutral-400">{message.timestamp}</span>
        </div>
        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
}
