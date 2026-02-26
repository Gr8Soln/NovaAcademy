import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, GraduationCap, Sparkles } from "lucide-react";

import { documentsApi } from "@/lib/api/documents";
import { cn } from "@/lib/utils";
import MaterialViewer from "./MaterialViewer";
import NovaCopilot from "./NovaCopilot";
import StudyTimer from "./StudyTimer";
import StudySidebar from "./StudySidebar";
import StudyQuizModal from "./StudyQuizModal";

interface StudyRoomProps {
    mode: "personal" | "class";
    classId?: string;
    initialDocId?: string;
}

export default function StudyRoom({
    mode,
    classId: propClassId,
    initialDocId,
}: StudyRoomProps) {
    const { classId: urlClassId } = useParams<{ classId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const classId = propClassId || urlClassId;
    const classCode = mode === "personal" ? "personal" : classId || "personal";

    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [quizOpen, setQuizOpen] = useState(false);

    const [selectedDoc, setSelectedDoc] = useState<{
        id: string;
        title: string;
        file_type: string;
        url?: string;
    } | null>(null);

    const docIdParam = searchParams.get("docId") || initialDocId;

    // Fetch document details if docId is in URL
    const { data: docDetails } = useQuery({
        queryKey: ["document", docIdParam, classCode],
        queryFn: () => documentsApi.get(classCode, docIdParam!),
        enabled: !!docIdParam,
    });

    useEffect(() => {
        if (docDetails) {
            const doc = (docDetails as any)?.data || docDetails;
            setSelectedDoc({
                id: doc.id,
                title: doc.title,
                file_type: doc.file_type,
                url: doc.file_url,
            });
        }
    }, [docDetails]);

    const handleSelectDoc = (doc: any) => {
        setSelectedDoc({
            id: doc.id,
            title: doc.title,
            file_type: doc.file_type,
            url: doc.file_url,
        });
        setSearchParams({ docId: doc.id });
    };

    return (
        <div className={cn(
            "flex bg-neutral-50 overflow-hidden relative",
            mode === "personal" ? "h-[calc(100vh-64px)]" : "h-full"
        )}>
            {/* ── Left Panel (Personal Mode Only) ── */}
            {mode === "personal" && (
                <>
                    <div
                        className={cn(
                            "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                            leftOpen ? "w-72" : "w-0"
                        )}
                    >
                        <StudySidebar
                            currentDocId={selectedDoc?.id}
                            onSelectDoc={handleSelectDoc}
                            className="h-full"
                        />
                    </div>

                    {/* Left toggle button */}
                    <button
                        onClick={() => setLeftOpen(!leftOpen)}
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center",
                            "h-8 w-5 bg-white border border-neutral-200 shadow-sm",
                            "text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all",
                            leftOpen ? "left-[284px] rounded-r-lg border-l-0" : "left-0 rounded-r-lg"
                        )}
                        title={leftOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {leftOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                </>
            )}

            {/* ── Main Viewer Area ── */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-100/20 relative">
                {/* Floating Toolbar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
                    {selectedDoc && (
                        <StudyTimer
                            documentId={selectedDoc.id}
                            classId={classId}
                        />
                    )}

                    {/* Quiz Button */}
                    <button
                        onClick={() => setQuizOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-neutral-200/60 rounded-2xl shadow-sm text-sm font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all"
                    >
                        <GraduationCap className="h-4 w-4" />
                        <span className="hidden sm:inline">Generate Quiz</span>
                    </button>
                </div>

                <div className="flex-1 p-4 lg:p-6 overflow-hidden">
                    <MaterialViewer
                        url={selectedDoc?.url || null}
                        type={selectedDoc?.file_type}
                        title={selectedDoc?.title}
                        className="h-full"
                    />
                </div>
            </div>

            {/* ── Right Panel (NovaAI Copilot) ── */}
            <div
                className={cn(
                    "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                    rightOpen ? "w-[380px]" : "w-0"
                )}
            >
                <NovaCopilot
                    documentId={selectedDoc?.id}
                    classId={classId}
                />
            </div>

            {/* Right toggle button */}
            <button
                onClick={() => setRightOpen(!rightOpen)}
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center",
                    "h-8 w-5 bg-white border border-neutral-200 shadow-sm",
                    "text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all",
                    rightOpen ? "right-[380px] rounded-l-lg border-r-0" : "right-0 rounded-l-lg"
                )}
                title={rightOpen ? "Collapse copilot" : "Expand copilot"}
            >
                {rightOpen ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary-500" />
                    </div>
                )}
            </button>

            {/* Quiz Modal */}
            {quizOpen && (
                <StudyQuizModal
                    classCode={classCode}
                    currentDocId={selectedDoc?.id}
                    onClose={() => setQuizOpen(false)}
                />
            )}
        </div>
    );
}
