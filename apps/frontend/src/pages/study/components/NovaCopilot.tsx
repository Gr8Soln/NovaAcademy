import { Bot, ChevronRight, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { cn } from "@/lib/utils";
import { aiApi } from "@/lib/api";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface NovaCopilotProps {
    documentId?: string;
    classId?: string;
    onCollapse?: () => void;
}

export default function NovaCopilot({ documentId, onCollapse }: NovaCopilotProps) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: trimmed,
            timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await aiApi.askStream(documentId || "", trimmed);

            if (!response.ok) throw new Error("AI response failed");

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "",
                timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                let accumulatedContent = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedContent += chunk;

                    setMessages((prev) => {
                        const last = prev[prev.length - 1];
                        if (last.role === "assistant" && last.id === assistantMessage.id) {
                            return [
                                ...prev.slice(0, -1),
                                { ...last, content: accumulatedContent },
                            ];
                        }
                        return prev;
                    });
                }
            }
        } catch (error) {
            console.error("AI Copilot error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                    timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-neutral-200/60 shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-gradient-to-br from-primary-50/30 to-accent-50/20">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-sm ring-2 ring-primary-500/10">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-neutral-900 leading-tight">NovaAI Copilot</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Document Aware</span>
                        </div>
                    </div>
                </div>

                {onCollapse && (
                    <button
                        onClick={onCollapse}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                        title="Collapse Copilot"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-neutral-200"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4 opacity-60">
                        <div className="p-4 rounded-3xl bg-primary-50 text-primary-400">
                            <Bot className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-neutral-900">How can I help you learn?</p>
                            <p className="text-xs text-neutral-400 mt-1">Ask questions about your study materials, request summaries, or ask for examples.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col gap-2 max-w-[85%]",
                                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            <div className={cn(
                                "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all",
                                msg.role === "user"
                                    ? "bg-primary-600 text-white rounded-tr-none"
                                    : "bg-neutral-100 text-neutral-800 rounded-tl-none border border-neutral-200/50"
                            )}>
                                {msg.content || (isLoading && msg.id === messages[messages.length - 1].id ? (
                                    <div className="flex gap-1 py-1">
                                        <span className="h-1 w-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="h-1 w-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="h-1 w-1 bg-current rounded-full animate-bounce" />
                                    </div>
                                ) : null)}
                            </div>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                                {msg.role === "user" ? "You" : "NovaAI"} • {msg.timestamp}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-100 bg-white">
                <form
                    onSubmit={handleSend}
                    className="relative flex items-center group"
                >
                    <input
                        type="text"
                        placeholder="Ask NovaAI…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="w-full bg-neutral-100/80 border border-neutral-200/60 rounded-2xl px-5 py-3.5 pr-14 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2.5 p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-primary-500/10"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
                <p className="text-[10px] text-neutral-400 text-center mt-3 flex items-center justify-center gap-1.5 font-medium">
                    <Sparkles className="h-3 w-3 opacity-50" />
                    Powered by Nova Core AI
                </p>
            </div>
        </div>
    );
}
