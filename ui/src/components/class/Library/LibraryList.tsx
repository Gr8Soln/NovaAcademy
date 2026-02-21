import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Grid3X3,
  List,
  Search,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import FileCard, { type FileData } from "./FileCard";
import UploadFile from "./UploadFile";

/* ── Mock data ───────────────────────────────────────────── */
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
type ViewMode = "list" | "grid";

export default function LibraryList() {
  const [files] = useState<FileData[]>(mockFiles);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<FileData["type"] | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-bold text-neutral-900">
          Library
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          {files.length} files shared in this class
        </p>
      </div>

      {/* Upload zone */}
      <UploadFile />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as FileData["type"] | "all")
              }
              className="text-sm border border-neutral-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
            >
              <option value="all">All types</option>
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="spreadsheet">Spreadsheet</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 transition-colors"
          >
            {sortDir === "asc" ? (
              <ArrowDownAZ className="h-4 w-4 text-neutral-500" />
            ) : (
              <ArrowUpAZ className="h-4 w-4 text-neutral-500" />
            )}
          </button>

          {/* View toggle */}
          <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-primary-50 text-primary-600"
                  : "text-neutral-400 hover:text-neutral-600",
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-primary-50 text-primary-600"
                  : "text-neutral-400 hover:text-neutral-600",
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* File list / grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200/60">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm font-medium text-neutral-500">
            No files match your search
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Try adjusting your filters
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((file) => (
            <FileCard key={file.id} file={file} view="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((file) => (
            <FileCard key={file.id} file={file} view="list" />
          ))}
        </div>
      )}
    </div>
  );
}
