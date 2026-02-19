import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatSidebar from "./ChatSidebar";
import ChatMessage, { type MessageData } from "./Message";

/* ── Mock data ─────────────────────────────────────────── */
const currentUserId = "me";

const groupInfo = {
  name: "ML-101 General",
  avatar: undefined as string | undefined,
  description:
    "General discussion channel for Introduction to Machine Learning. Share resources, ask questions, and collaborate with classmates.",
  memberCount: 34,
  onlineCount: 12,
};

const mockMembers = [
  { id: "u1", name: "Prof. Chen" },
  { id: "u2", name: "Sarah Kim" },
  { id: "u3", name: "Alex Johnson" },
  { id: "u4", name: "Priya Sharma" },
  { id: "u5", name: "Marcus Lee" },
  { id: "u6", name: "Emma Davis" },
  { id: "nova", name: "NovaAI" },
];

const initialMessages: MessageData[] = [
  {
    id: "sep-today",
    type: "date_separator",
    dateLabel: "Today",
    content: "",
    sender: { id: "system", name: "System" },
    timestamp: "",
  },
  {
    id: "m1",
    content:
      "Welcome to ML-101 General! 🎉 I'm @NovaAI, your AI study assistant. Tag me anytime you need help with course material, explanations, or practice questions.",
    sender: { id: "nova", name: "NovaAI", role: "ai", isOnline: true },
    timestamp: "9:00 AM",
    reactions: [
      { emoji: "🎉", count: 8, reacted: false },
      { emoji: "👍", count: 5, reacted: true },
    ],
  },
  {
    id: "m2",
    content:
      "Hey everyone! Just went through the first chapter. Can someone explain the difference between supervised and unsupervised learning in simple terms?",
    sender: { id: "u2", name: "Sarah Kim", role: "member", isOnline: true },
    timestamp: "9:05 AM",
  },
  {
    id: "m3",
    content:
      "Great question @Sarah! Think of it this way:\n\n**Supervised learning** = learning with a teacher. You have labeled examples (like flashcards with answers on the back).\n\n**Unsupervised learning** = figuring things out on your own. The data has no labels, so the algorithm finds hidden patterns.\n\nExamples:\n• Supervised: Spam detection, image classification\n• Unsupervised: Customer segmentation, anomaly detection",
    sender: { id: "nova", name: "NovaAI", role: "ai", isOnline: true },
    timestamp: "9:05 AM",
    replyTo: {
      id: "m2",
      senderName: "Sarah Kim",
      content:
        "Can someone explain the difference between supervised and unsupervised learning?",
    },
    reactions: [
      { emoji: "🔥", count: 6, reacted: false },
      { emoji: "🧠", count: 3, reacted: true },
    ],
  },
  {
    id: "m4",
    content:
      "Sharing the lecture notes from today's class. Prof. Chen covered gradient descent really well!",
    sender: { id: "u3", name: "Alex Johnson", role: "member", isOnline: true },
    timestamp: "10:15 AM",
    attachments: [
      {
        id: "a1",
        type: "file",
        url: "",
        name: "ML_Lecture_3_Gradient_Descent.pdf",
        size: "2.4 MB",
        mimeType: "application/pdf",
      },
    ],
    reactions: [{ emoji: "🙏", count: 12, reacted: false }],
  },
  {
    id: "m5",
    content:
      "Found this diagram really helpful for understanding neural network layers",
    sender: { id: "u4", name: "Priya Sharma", role: "member", isOnline: true },
    timestamp: "10:30 AM",
    attachments: [
      {
        id: "a2",
        type: "image",
        url: "",
        name: "neural_network_layers.png",
      },
    ],
  },
  {
    id: "m6",
    content: "",
    sender: { id: "u5", name: "Marcus Lee", role: "member", isOnline: false },
    timestamp: "11:00 AM",
    attachments: [
      {
        id: "a3",
        type: "voice",
        url: "",
        duration: 47,
      },
    ],
  },
  {
    id: "m7",
    content:
      "Check out this tutorial on backpropagation — it has some great animations",
    sender: { id: "u6", name: "Emma Davis", role: "member", isOnline: false },
    timestamp: "11:20 AM",
    linkPreview: {
      url: "https://example.com/backprop-tutorial",
      title: "Visual Guide to Backpropagation",
      description:
        "An interactive visual guide explaining how backpropagation works in neural networks, with step-by-step animations.",
      siteName: "ML Visuals",
      image: "placeholder",
    },
  },
  {
    id: "m8",
    content:
      "Just recorded a quick walkthrough of the assignment 1 approach. Hope it helps! 💪",
    sender: { id: "u3", name: "Alex Johnson", role: "member", isOnline: true },
    timestamp: "2:00 PM",
    attachments: [
      {
        id: "a4",
        type: "video",
        url: "",
        name: "Assignment_1_Walkthrough.mp4",
        size: "45 MB",
        duration: 324,
        thumbnailUrl: "",
      },
    ],
  },
  {
    id: "m9",
    content:
      "Thanks Alex! @NovaAI can you give me a practice quiz on gradient descent? I want to test my understanding.",
    sender: { id: currentUserId, name: "You", role: "member", isOnline: true },
    timestamp: "2:15 PM",
    status: "read" as const,
  },
  {
    id: "m10",
    content:
      "Absolutely! Here's a quick 3-question check:\n\n**1.** What does the learning rate control?\n**2.** What happens when the learning rate is too large?\n**3.** What's the difference between batch and stochastic gradient descent?\n\nTake your time and reply when ready! I'll provide feedback on your answers 📝",
    sender: { id: "nova", name: "NovaAI", role: "ai", isOnline: true },
    timestamp: "2:15 PM",
    replyTo: {
      id: "m9",
      senderName: "You",
      content: "can you give me a practice quiz on gradient descent?",
    },
  },
  {
    id: "m11",
    content:
      "📢 **Reminder:** Midterm exam is on March 5th. Study guide is available in the Library section. Good luck everyone!",
    sender: { id: "u1", name: "Prof. Chen", role: "admin", isOnline: true },
    timestamp: "3:00 PM",
    reactions: [
      { emoji: "👀", count: 15, reacted: true },
      { emoji: "😤", count: 4, reacted: false },
      { emoji: "💪", count: 8, reacted: false },
    ],
  },
];

/* ── Component ─────────────────────────────────────────── */
export default function ChatWindow() {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    senderName: string;
    content: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string, _attachments?: File[]) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const userMsg: MessageData = {
      id: `u-${Date.now()}`,
      content,
      sender: {
        id: currentUserId,
        name: "You",
        role: "member",
        isOnline: true,
      },
      timestamp: time,
      status: "sent",
      replyTo: replyTo || undefined,
    };

    const aiMsg: MessageData = {
      id: `ai-${Date.now()}`,
      content:
        "That's a great point! Let me think about that... (Backend integration coming soon — this is a placeholder response from NovaAI.) 🤖",
      sender: { id: "nova", name: "NovaAI", role: "ai", isOnline: true },
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setReplyTo(null);
  };

  const handleReply = (msg: MessageData) => {
    setReplyTo({
      id: msg.id,
      senderName: msg.sender.name,
      content: msg.content || "(attachment)",
    });
  };

  return (
    <div className="flex h-full min-h-0 bg-white overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header */}
        <ChatHeader
          groupName={groupInfo.name}
          groupAvatar={groupInfo.avatar}
          memberCount={groupInfo.memberCount}
          onlineCount={groupInfo.onlineCount}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.sender.id === currentUserId}
              onReply={handleReply}
            />
          ))}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          members={mockMembers}
        />
      </div>

      {/* Right sidebar */}
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        groupName={groupInfo.name}
        groupAvatar={groupInfo.avatar}
        groupDescription={groupInfo.description}
        memberCount={groupInfo.memberCount}
        isAdmin={false}
      />
    </div>
  );
}
