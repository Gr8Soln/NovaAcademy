import { ArrowDownAZ, ArrowUpAZ, Filter, Search } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import FileCard, { type FileData } from "./FileCard";
import UploadFile from "./UploadFile";

// ── Mock data ───────────────────────────────────────────────
const mockFiles: FileData[] = [
  {
    id: "f1",
    name: "ML Lecture Notes — Week 1.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadedAt: "Jan 12, 2026",
    uploadedBy: "Prof. Chen",
  },
  {
    id: "f2",
    name: "Neural Network Diagram.png",
    type: "image",
    size: "890 KB",
    uploadedAt: "Jan 15, 2026",
    uploadedBy: "Sarah K.",
  },
  {
    id: "f3",
    name: "Dataset — Iris Classification.csv",
    type: "spreadsheet",
    size: "12 KB",
    uploadedAt: "Jan 18, 2026",
    uploadedBy: "Prof. Chen",
  },
  {
    id: "f4",
    name: "Backpropagation Tutorial.mp4",
    type: "video",
    size: "156 MB",
    uploadedAt: "Jan 20, 2026",
    uploadedBy: "NovaAI",
  },
  {
    id: "f5",
    name: "Assignment 1 — Linear Regression.pdf",
    type: "pdf",
    size: "1.1 MB",
    uploadedAt: "Jan 22, 2026",
    uploadedBy: "Prof. Chen",
  },
  {
    id: "f6",
    name: "Study Guide — Midterm Review.pdf",
    type: "document",
    size: "3.7 MB",
    uploadedAt: "Feb 01, 2026",
    uploadedBy: "NovaAI",
  },
];

type SortDir = "asc" | "desc";

export default function LibraryList() {
  const [files] = useState<FileData[]>(mockFiles);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<FileData["type"] | "all">("all");

  const filtered = files
    .filter((f) => {
      if (filterType !== "all" && f.type !== filterType) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <UploadFile />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as FileData["type"] | "all")
            }
            className="text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="all">All types</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="spreadsheet">Spreadsheet</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
          </select>

          {/* Sort */}
          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className={cn(
              "flex items-center gap-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors",
            )}
          >
            {sortDir === "asc" ? (
              <ArrowDownAZ className="h-4 w-4 text-neutral-500" />
            ) : (
              <ArrowUpAZ className="h-4 w-4 text-neutral-500" />
            )}
          </button>
        </div>
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-neutral-500">
            No files match your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filtered.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
