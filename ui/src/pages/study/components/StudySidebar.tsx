import { FilePlus, Library, Search, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { documentsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Document {
    id: string;
    title: string;
    file_type: string;
    processing_status: string;
}

interface StudySidebarProps {
    currentDocId?: string;
    onSelectDoc: (doc: Document) => void;
    className?: string;
}

export default function StudySidebar({
    currentDocId,
    onSelectDoc,
    className,
}: StudySidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: documents, isLoading } = useQuery<Document[]>({
        queryKey: ["personal-documents"],
        queryFn: () => documentsApi.list(0, 50) as Promise<Document[]>,
    });

    const filteredDocs = documents?.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className={cn("flex flex-col h-full bg-neutral-50 border-r border-neutral-200/60 w-72", className)}>
            {/* Header */}
            <div className="p-5 pb-4">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/20">
                        <Library className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-neutral-900 leading-tight">My Library</h2>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Standalone Study</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search materials…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
                    />
                </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-200">
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Recent Materials
                </p>

                {isLoading ? (
                    <div className="px-3 py-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-neutral-200/50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="px-3 py-8 text-center text-neutral-400">
                        <p className="text-xs">No documents found</p>
                    </div>
                ) : (
                    filteredDocs.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => onSelectDoc(doc)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group",
                                currentDocId === doc.id
                                    ? "bg-white text-primary-700 shadow-sm border border-neutral-200/50"
                                    : "text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-700"
                            )}
                        >
                            <div className={cn(
                                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all",
                                currentDocId === doc.id
                                    ? "bg-primary-50 text-primary-600"
                                    : "bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200 group-hover:text-neutral-500"
                            )}>
                                <Upload className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold truncate">
                                    {doc.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={cn(
                                        "h-1 w-1 rounded-full",
                                        doc.processing_status === "ready" ? "bg-emerald-500" : "bg-amber-500"
                                    )} />
                                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-tighter">
                                        {doc.file_type} • {doc.processing_status}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Footer / Upload Button */}
            <div className="p-4 bg-white border-t border-neutral-100">
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-50 text-primary-700 text-xs font-bold hover:bg-primary-100 transition-all border border-primary-100/50">
                    <FilePlus className="h-3.5 w-3.5" />
                    Upload New Material
                </button>
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">NovaAI Tip</span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-snug">
                        You can study your personal files even without joining a class!
                    </p>
                </div>
            </div>
        </div>
    );
}
