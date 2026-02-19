import { Download, FileSpreadsheet, FileText, Film, Image } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FileData {
  id: string;
  name: string;
  type: "pdf" | "image" | "spreadsheet" | "video" | "document";
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface FileCardProps {
  file: FileData;
  className?: string;
}

const iconMap: Record<FileData["type"], React.ElementType> = {
  pdf: FileText,
  image: Image,
  spreadsheet: FileSpreadsheet,
  video: Film,
  document: FileText,
};

const colorMap: Record<FileData["type"], string> = {
  pdf: "bg-danger-50 text-danger-500",
  image: "bg-accent-50 text-accent-600",
  spreadsheet: "bg-success-50 text-success-600",
  video: "bg-secondary-50 text-secondary-600",
  document: "bg-primary-50 text-primary-700",
};

export default function FileCard({ file, className }: FileCardProps) {
  const Icon = iconMap[file.type];
  const colors = colorMap[file.type];

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-200 hover:shadow-sm hover:border-primary-200 transition-all group",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
          colors,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">
          {file.name}
        </p>
        <p className="text-xs text-neutral-400">
          {file.size} · {file.uploadedBy} · {file.uploadedAt}
        </p>
      </div>

      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-primary-700 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100"
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
