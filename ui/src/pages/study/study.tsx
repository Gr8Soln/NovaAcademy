import useSSEStream from "@/hooks/use-sse-stream";
import { aiApi, documentsApi } from "@/lib/api";
import { Document } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  FileText,
  HelpCircle,
  Lightbulb,
  MoreVertical,
  PieChart,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/buttons";
import { Card, CardContent, CardHeader, CardTitle as UiCardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/inputs";
import { SectionLoader } from "@/components/ui/loaders";

export default function StudyPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [question, setQuestion] = useState("");
  const stream = useSSEStream();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch document details
  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ["document", documentId],
    queryFn: () => documentsApi.get(documentId!) as Promise<Document>,
    enabled: !!documentId,
  });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.text, stream.isStreaming]);

  if (isLoading) return <SectionLoader />;
  if (!document) return <div className="p-8 text-center">Document not found</div>;

  const handleAsk = () => {
    if (!question.trim()) return;
    stream.start(() => aiApi.askStream(documentId!, question));
    setQuestion("");
  };

  const handleSummary = () => {
    stream.start(() => aiApi.summaryStream(documentId!));
  };

  return (
    <div className="h-[calc(100vh-6rem)] -my-4 flex flex-col lg:flex-row gap-6 overflow-hidden">

      {/* COLUMN 1: Document Viewer (Main - 50%) */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden min-h-[400px]">
        {/* Header */}
        <div className="h-14 border-b border-neutral-200 flex items-center justify-between px-4 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <Link to="/documents" className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary-50 flex items-center justify-center text-primary-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-neutral-900 truncate max-w-[200px]">{document.title}</h1>
                <p className="text-[10px] text-neutral-500">PDF • 12 Pages</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4 text-neutral-400" />
            </Button>
          </div>
        </div>

        {/* Content Placeholder */}
        <div className="flex-1 bg-neutral-100 flex items-center justify-center relative group">
          <div className="text-center p-8">
            <FileText className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">Document Preview</p>
            <p className="text-sm text-neutral-400 mt-1">PDF viewer integration would go here.</p>
          </div>
          {/* Overlay for "Deep Focus" feel */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Footer / Pagination */}
        <div className="h-12 border-t border-neutral-200 flex items-center justify-between px-4 bg-white text-xs text-neutral-500">
          <button className="hover:text-neutral-900">Previous</button>
          <span>Page 1 of 12</span>
          <button className="hover:text-neutral-900">Next</button>
        </div>
      </div>

      {/* COLUMN 2: AI Tutor (Chat - 30%) */}
      <div className="lg:w-[30%] flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="h-14 border-b border-neutral-200 flex items-center px-4 bg-neutral-50/50">
          <BrainCircuit className="h-5 w-5 text-accent-600 mr-2" />
          <h2 className="font-semibold text-neutral-900 text-sm">AI Tutor</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/30">
          {/* Welcome Message */}
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-accent-600" />
            </div>
            <div className="bg-white border boundary-neutral-200 p-3 rounded-2xl rounded-tl-none text-sm text-neutral-700 shadow-sm">
              Hi! I'm your AI study companion. Ask me anything about this document!
            </div>
          </div>

          {/* Streamed Response */}
          {(stream.text || stream.isStreaming) && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-accent-600" />
              </div>
              <div className="bg-white border border-neutral-200 p-3 rounded-2xl rounded-tl-none text-sm text-neutral-700 shadow-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:text-neutral-800">
                <ReactMarkdown>{stream.text}</ReactMarkdown>
                {stream.isStreaming && <span className="inline-block w-1.5 h-3 bg-accent-500 animate-pulse ml-1" />}
              </div>
            </div>
          )}

          {/* Error Message */}
          {stream.error && (
            <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg border border-danger-100">
              {stream.error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-neutral-200 bg-white">
          {/* Quick Actions */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={handleSummary}
              disabled={stream.isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full text-xs font-medium text-neutral-600 whitespace-nowrap transition-colors"
            >
              <Lightbulb className="h-3 w-3" />
              Summarize
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full text-xs font-medium text-neutral-600 whitespace-nowrap transition-colors">
              <HelpCircle className="h-3 w-3" />
              Key Concepts
            </button>
          </div>

          <div className="relative">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question..."
              className="pr-10"
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || stream.isStreaming}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary-600 hover:bg-primary-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 3: Mastery & Tools (20%) */}
      <div className="lg:w-[20%] flex flex-col gap-4">
        {/* Mastery Card */}
        <Card>
          <CardHeader className="pb-2">
            <UiCardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <PieChart className="h-4 w-4" /> Mastery
            </UiCardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-3xl font-bold text-primary-900">42%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary-500 w-[42%] rounded-full" />
            </div>
            <p className="text-xs text-neutral-400 mt-2">Keep reading to improve mastery.</p>
          </CardContent>
        </Card>

        {/* Tools */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <UiCardTitle className="text-sm font-medium text-neutral-500">Tools</UiCardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-accent-50 text-accent-600 flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700">Flashcards</div>
                  <div className="text-[10px] text-neutral-400">20 cards available</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-primary-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-success-50 text-success-600 flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700">Quiz Me</div>
                  <div className="text-[10px] text-neutral-400">Test your knowledge</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-primary-400" />
            </button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
