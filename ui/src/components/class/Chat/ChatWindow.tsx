import { Bot } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ChatInput from "./ChatInput";
import Message, { type MessageData } from "./Message";

// ── Mock data ───────────────────────────────────────────────
const initialMessages: MessageData[] = [
  {
    id: "m1",
    content:
      "Welcome to the class chat! I'm NovaAI, your study assistant. Ask me anything about this class.",
    sender: "ai",
    timestamp: "9:00 AM",
  },
  {
    id: "m2",
    content:
      "Can you explain the difference between supervised and unsupervised learning?",
    sender: "user",
    timestamp: "9:05 AM",
  },
  {
    id: "m3",
    content:
      "Great question! Supervised learning uses labeled data to train models — the algorithm learns from input-output pairs. Unsupervised learning, on the other hand, works with unlabeled data and tries to find hidden patterns or groupings on its own.\n\nExamples:\n• Supervised: Email spam detection, image classification\n• Unsupervised: Customer segmentation, anomaly detection",
    sender: "ai",
    timestamp: "9:05 AM",
  },
  {
    id: "m4",
    content: "Thanks! What about semi-supervised learning?",
    sender: "user",
    timestamp: "9:08 AM",
  },
  {
    id: "m5",
    content:
      "Semi-supervised learning is a middle ground. It uses a small amount of labeled data combined with a large amount of unlabeled data for training. This is useful when labeling data is expensive or time-consuming. For example, medical imaging often uses this approach.",
    sender: "ai",
    timestamp: "9:08 AM",
  },
];

export default function ChatWindow() {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const userMsg: MessageData = {
      id: `u-${Date.now()}`,
      content,
      sender: "user",
      timestamp: time,
    };

    // Mock AI response
    const aiMsg: MessageData = {
      id: `ai-${Date.now()}`,
      content:
        "That's an interesting question! Let me look into that for you. (This is a placeholder response — backend integration coming soon.)",
      sender: "ai",
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
          <Bot className="h-4 w-4 text-primary-700" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Class Chat</h3>
          <p className="text-xs text-neutral-500">NovaAI is here to help</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto divide-y divide-neutral-100"
      >
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />

      {/* Floating NovaAI icon */}
      <div className="fixed bottom-24 right-6 sm:hidden">
        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg hover:bg-primary-600 transition-colors">
          <Bot className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
