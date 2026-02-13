import useSSEStream from "@/hooks/use-sse-stream";
import { aiApi } from "@/lib/api";
import {
  BookOpen,
  HelpCircle,
  Lightbulb,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/buttons";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/inputs";
import { cn } from "@/lib/utils";

type Tab = "ask" | "summary" | "quiz" | "flashcards";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "ask", label: "Ask AI", icon: HelpCircle },
  { key: "summary", label: "Summary", icon: Lightbulb },
  { key: "quiz", label: "Quiz", icon: BookOpen },
  { key: "flashcards", label: "Flashcards", icon: Zap },
];

export default function StudyPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("ask");
  const [question, setQuestion] = useState("");
  const stream = useSSEStream();

  if (!documentId) return <div>Document not found</div>;

  const handleAsk = () => {
    if (!question.trim()) return;
    stream.start(() => aiApi.askStream(documentId, question));
  };

  const handleSummary = () => {
    stream.start(() => aiApi.summaryStream(documentId));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-900">
          Study Session
        </h1>
        <p className="text-sm text-neutral-500">
          Use AI to explore your document.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              stream.reset();
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === key
                ? "bg-white text-primary-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Ask Q&A */}
      {activeTab === "ask" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question about your document..."
              className="flex-1"
              icon={<HelpCircle className="h-4 w-4" />}
            />
            <Button
              onClick={handleAsk}
              disabled={stream.isStreaming || !question.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {(stream.text || stream.isStreaming) && (
            <Card>
              <CardContent className="p-6 prose prose-sm max-w-none prose-headings:text-primary-900 prose-a:text-primary-600">
                <ReactMarkdown>{stream.text || "Thinking..."}</ReactMarkdown>
                {stream.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1 rounded-sm" />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <Button onClick={handleSummary} disabled={stream.isStreaming}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            {stream.isStreaming ? "Generating..." : "Generate Summary"}
          </Button>
          {(stream.text || stream.isStreaming) && (
            <Card>
              <CardContent className="p-6 prose prose-sm max-w-none prose-headings:text-primary-900 prose-a:text-primary-600">
                <ReactMarkdown>
                  {stream.text || "Generating summary..."}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quiz placeholder */}
      {activeTab === "quiz" && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <BookOpen className="h-6 w-6 text-primary-400" />
            </div>
            <p className="font-medium text-neutral-700">Coming soon</p>
            <p className="mt-1 text-sm text-neutral-500">
              Quiz generation will be available here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Flashcards placeholder */}
      {activeTab === "flashcards" && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
              <Zap className="h-6 w-6 text-accent-500" />
            </div>
            <p className="font-medium text-neutral-700">Coming soon</p>
            <p className="mt-1 text-sm text-neutral-500">
              Flashcard generation will be available here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {stream.error && (
        <Card className="border-danger-200 bg-danger-50">
          <CardContent className="p-4 text-sm text-danger-700">
            {stream.error}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
