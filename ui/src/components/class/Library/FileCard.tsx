import {
  Download,
  FileSpreadsheet,
  FileText,
  Film,
  Image,
  MoreHorizontal,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface FileData {
  id: string;
  name: string;
  type: "pdf" | "image" | "spreadsheet" | "video" | "document";
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  starred?: boolean;
}

interface FileCardProps {
  file: FileData;
  view?: "list" | "grid";
  className?: string;
}

const iconMap: Record<FileData["type"], React.ElementType> = {
  pdf: FileText,
  image: Image,
  spreadsheet: FileSpreadsheet,
  video: Film,
  document: FileText,
};

const colorMap: Record<
  FileData["type"],
  { bg: string; text: string; gradient: string }
> = {
  pdf: {
    bg: "bg-red-50",
    text: "text-red-500",
    gradient: "from-red-500 to-rose-500",
  },
  image: {
    bg: "bg-violet-50",
    text: "text-violet-500",
    gradient: "from-violet-500 to-purple-500",
  },
  spreadsheet: {
    bg: "bg-emerald-50",
    text: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
  },
  video: {
    bg: "bg-blue-50",
    text: "text-blue-500",
    gradient: "from-blue-500 to-indigo-500",
  },
  document: {
    bg: "bg-amber-50",
    text: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
  },
};

const typeLabel: Record<FileData["type"], string> = {
  pdf: "PDF",
  image: "Image",
  spreadsheet: "Spreadsheet",
  video: "Video",
  document: "Document",
};

export default function FileCard({
  file,
  view = "list",
  className,
}: FileCardProps) {
  const Icon = iconMap[file.type];
  const colors = colorMap[file.type];

  if (view === "grid") {
    return (
      <div
        className={cn(
          "group bg-white rounded-2xl border border-neutral-200/60 p-4 hover:shadow-lg hover:border-primary-200/50 hover:-translate-y-0.5 transition-all cursor-pointer",
          className,
        )}
      >
        {/* File icon area */}
        <div
          className={cn(
            "flex items-center justify-center h-24 rounded-xl mb-3",
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
        </div>

        <p className="text-xs font-semibold text-neutral-900 truncate mb-0.5">
          {file.name}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-400">
            {file.size} · {typeLabel[file.type]}
          </p>
          <button className="p-1 rounded text-neutral-300 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100">
            <Star className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-neutral-200/60 hover:shadow-md hover:border-primary-200/50 transition-all group cursor-pointer",
        className,
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
        <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
          {file.name}
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          {file.size} · {file.uploadedBy} · {file.uploadedAt}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
          title="Star"
        >
          <Star className="h-4 w-4" />
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
          title="Download"
        >
          <Download className="h-4 w-4" />
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
