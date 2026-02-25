import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { documentsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import MaterialViewer from "./MaterialViewer";
import NovaCopilot from "./NovaCopilot";
import StudyTimer from "./StudyTimer";
import StudySidebar from "./StudySidebar";

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

    const [selectedDoc, setSelectedDoc] = useState<{
        id: string;
        title: string;
        file_type: string;
        url?: string;
    } | null>(null);

    const docIdParam = searchParams.get("docId") || initialDocId;

    // Fetch document details if docId is in URL
    const { data: docDetails } = useQuery({
        queryKey: ["document", docIdParam],
        queryFn: () => documentsApi.get(docIdParam!) as any,
        enabled: !!docIdParam,
    });

    useEffect(() => {
        if (docDetails) {
            setSelectedDoc({
                id: docDetails.id,
                title: docDetails.title,
                file_type: docDetails.file_type,
                url: docDetails.file_url,
            });
        }
    }, [docDetails]);

    const handleSelectDoc = (doc: any) => {
        setSelectedDoc(doc);
        setSearchParams({ docId: doc.id });
    };

    return (
        <div className={cn(
            "flex h-full bg-neutral-50 overflow-hidden",
            mode === "personal" ? "h-[calc(100vh-64px)]" : "h-full"
        )}>
            {/* 1. Sidebar (Only for Personal mode) */}
            {mode === "personal" && (
                <StudySidebar
                    currentDocId={selectedDoc?.id}
                    onSelectDoc={handleSelectDoc}
                    className="flex-shrink-0"
                />
            )}

            {/* 2. Main Viewer Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-100/20 relative">
                {/* Floating Timer */}
                {selectedDoc && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                        <StudyTimer
                            documentId={selectedDoc.id}
                            classId={classId}
                        />
                    </div>
                )}

                <div className="flex-1 p-4 lg:p-6 overflow-hidden">
                    <MaterialViewer
                        url={selectedDoc?.url || null}
                        type={selectedDoc?.file_type}
                        title={selectedDoc?.title}
                        className="h-full"
                    />
                </div>
            </div>

            {/* 3. Nova AI Copilot Sidebar */}
            <div className="w-[380px] flex-shrink-0 hidden xl:block">
                <NovaCopilot
                    documentId={selectedDoc?.id}
                    classId={classId}
                />
            </div>
        </div>
    );
}
