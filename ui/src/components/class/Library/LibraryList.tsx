import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Grid3X3,
  List,
  Loader2,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { documentsApi } from "@/lib/api/documents";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/document";

import FileCard from "./FileCard";
import UploadFile from "./UploadFile";

type SortDir = "asc" | "desc";
type ViewMode = "list" | "grid";

export default function LibraryList() {
  const { classId } = useParams<{ classId: string }>(); // This is the class_code
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<Document["file_type"] | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["documents", classId, page],
    queryFn: () => documentsApi.list(classId!, (page - 1) * limit, limit),
    enabled: !!classId,
  });

  const documents = data?.data || [];
  const total = data?.metadata?.total_data || 0;

  // Local filtering for search (or we could use the search API)
  const filtered = documents
    .filter((f) => {
      if (filterType !== "all" && f.file_type !== filterType) return false;
      if (search && !f.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      const cmp = a.title.localeCompare(b.title);
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
          {isLoading ? "Loading..." : `${total} files shared in this class`}
        </p>
      </div>

      {/* Upload zone */}
      <UploadFile classCode={classId!} onUploadSuccess={() => refetch()} />

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
                setFilterType(e.target.value as Document["file_type"] | "all")
              }
              className="text-sm border border-neutral-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
            >
              <option value="all">All types</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
              <option value="md">Markdown</option>
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
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-neutral-200/60 transition-all">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-3" />
          <p className="text-sm text-neutral-500 font-medium">Fetching class library...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200/60">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm font-medium text-neutral-500">
            {search ? "No files match your search" : "No files in the library yet"}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {search ? "Try adjusting your filters" : "Upload your first study material to get started!"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((doc) => (
            <FileCard key={doc.id} doc={doc} view="grid" classCode={classId!} onDeleteSuccess={() => refetch()} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <FileCard key={doc.id} doc={doc} view="list" classCode={classId!} onDeleteSuccess={() => refetch()} />
          ))}
        </div>
      )}

      {/* Pagination (Simplified) */}
      {total > limit && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-xl bg-white disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-xl bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
