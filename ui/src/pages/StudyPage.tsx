import { useSSEStream } from "@/hooks/useSSEStream";
import { aiApi } from "@/lib/api";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";

type Tab = "ask" | "summary" | "quiz" | "flashcards";

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

  const tabs: { key: Tab; label: string }[] = [
    { key: "ask", label: "Ask a Question" },
    { key: "summary", label: "Summary" },
    { key: "quiz", label: "Quiz" },
    { key: "flashcards", label: "Flashcards" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Study Session</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              stream.reset();
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === t.key
                ? "bg-white text-primary-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ask Q&A */}
      {activeTab === "ask" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question about your document..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleAsk}
              disabled={stream.isStreaming || !question.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {stream.isStreaming ? "..." : "Ask"}
            </button>
          </div>
          {(stream.text || stream.isStreaming) && (
            <div className="bg-white rounded-xl p-6 shadow-sm border prose max-w-none">
              <ReactMarkdown>{stream.text || "Thinking..."}</ReactMarkdown>
              {stream.isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <button
            onClick={handleSummary}
            disabled={stream.isStreaming}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {stream.isStreaming ? "Generating..." : "Generate Summary"}
          </button>
          {(stream.text || stream.isStreaming) && (
            <div className="bg-white rounded-xl p-6 shadow-sm border prose max-w-none">
              <ReactMarkdown>
                {stream.text || "Generating summary..."}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Quiz placeholder */}
      {activeTab === "quiz" && (
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center text-gray-500">
          <p className="text-3xl mb-3">📝</p>
          <p>
            Quiz generation coming soon — click "Generate Quiz" in the AI menu.
          </p>
        </div>
      )}

      {/* Flashcards placeholder */}
      {activeTab === "flashcards" && (
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center text-gray-500">
          <p className="text-3xl mb-3">⚡</p>
          <p>Flashcard generation coming soon.</p>
        </div>
      )}

      {/* Error */}
      {stream.error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">
          {stream.error}
        </div>
      )}
    </div>
  );
}
