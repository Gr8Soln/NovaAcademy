import { useMutation } from "@tanstack/react-query";
import {
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  Star,
  Trash2,
  AlertCircle,
  Clock,
} from "lucide-react";

import { documentsApi } from "@/lib/api/documents";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/document";

interface FileCardProps {
  doc: Document;
  view?: "list" | "grid";
  classCode: string;
  onDeleteSuccess?: () => void;
  className?: string;
}

const iconMap: Record<Document["file_type"], React.ElementType> = {
  pdf: FileText,
  docx: FileText,
  txt: FileText,
  md: FileText,
};

const colorMap: Record<
  Document["file_type"],
  { bg: string; text: string; gradient: string }
> = {
  pdf: {
    bg: "bg-red-50",
    text: "text-red-500",
    gradient: "from-red-500 to-rose-500",
  },
  docx: {
    bg: "bg-blue-50",
    text: "text-blue-500",
    gradient: "from-blue-500 to-indigo-500",
  },
  txt: {
    bg: "bg-emerald-50",
    text: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
  },
  md: {
    bg: "bg-amber-50",
    text: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
  },
};

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function FileCard({
  doc,
  view = "list",
  classCode,
  onDeleteSuccess,
  className,
}: FileCardProps) {
  const Icon = iconMap[doc.file_type] || FileText;
  const colors = colorMap[doc.file_type] || colorMap.txt;

  const { mutate: deleteDoc, isPending: isDeleting } = useMutation({
    mutationFn: () => documentsApi.delete(classCode, doc.id),
    onSuccess: () => onDeleteSuccess?.(),
  });

  const StatusOverlay = () => {
    if (doc.processing_status === "ready") return null;

    return (
      <div className="absolute inset-x-0 bottom-0 bg-white/80 backdrop-blur-[2px] py-1 px-2 border-t border-neutral-100 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1">
        {doc.processing_status === "pending" || doc.processing_status === "processing" ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-primary-600" />
            <span className="text-[10px] font-medium text-neutral-600">Processing...</span>
          </>
        ) : doc.processing_status === "failed" ? (
          <>
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span className="text-[10px] font-medium text-red-500">Failed</span>
          </>
        ) : null}
      </div>
    );
  };

  if (view === "grid") {
    return (
      <div
        className={cn(
          "group relative bg-white rounded-2xl border border-neutral-200/60 p-4 hover:shadow-lg hover:border-primary-200/50 hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden",
          className,
          isDeleting && "opacity-50 pointer-events-none"
        )}
      >
        {/* File icon area */}
        <div
          className={cn(
            "flex items-center justify-center h-24 rounded-xl mb-3 relative overflow-hidden",
            colors.bg,
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
              colors.gradient,
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <StatusOverlay />
        </div>

        <p className="text-xs font-semibold text-neutral-900 truncate mb-0.5">
          {doc.title}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-400">
            {formatSize(doc.file_size_bytes)} · {doc.file_type.toUpperCase()}
          </p>
          <div className="flex items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); deleteDoc(); }}
              className="p-1 rounded text-neutral-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <button className="p-1 rounded text-neutral-300 hover:text-amber-500 transition-colors">
              <Star className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-neutral-200/60 hover:shadow-md hover:border-primary-200/50 transition-all group cursor-pointer relative overflow-hidden",
        className,
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 bg-gradient-to-br text-white shadow-sm",
          colors.gradient,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
            {doc.title}
          </p>
          {doc.processing_status !== "ready" && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border",
              doc.processing_status === "failed"
                ? "bg-red-50 text-red-600 border-red-100"
                : "bg-primary-50 text-primary-600 border-primary-100"
            )}>
              {doc.processing_status === "failed" ? <AlertCircle className="h-2 w-2" /> : <Clock className="h-2 w-2 animate-pulse" />}
              {doc.processing_status}
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          {formatSize(doc.file_size_bytes)} · AI Tutor Ready · {new Date(doc.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
          title="Star"
        >
          <Star className="h-4 w-4" />
        </button>
        {doc.file_url && (
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
            title="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); deleteDoc(); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          title="More"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
