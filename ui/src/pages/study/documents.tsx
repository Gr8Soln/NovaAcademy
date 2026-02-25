import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Grid3X3,
  Library,
  List,
  Loader2,
  Search,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { documentsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/document";
import FileCard from "@/components/class/Library/FileCard";

type SortDir = "asc" | "desc";
type ViewMode = "list" | "grid";

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<Document["file_type"] | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const limit = 24;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["personal-documents-page", page],
    queryFn: () => documentsApi.list((page - 1) * limit, limit) as Promise<any>,
  });

  const documents = (data as any)?.data || [];
  const total = (data as any)?.metadata?.total_data || 0;

  const filtered = documents
    .filter((f: Document) => {
      if (filterType !== "all" && f.file_type !== filterType) return false;
      if (search && !f.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    })
    .sort((a: Document, b: Document) => {
      const cmp = a.title.localeCompare(b.title);
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Library className="h-5 w-5" />
            </div>
            My Library
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage and study your personal materials.
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20">
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/60 transition-all">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search your library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-transparent text-sm focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">All Files</option>
              <option value="pdf">PDF Docs</option>
              <option value="docx">Word Docs</option>
              <option value="txt">Text Files</option>
            </select>
          </div>

          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 transition-colors"
          >
            {sortDir === "asc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
            Sort
          </button>

          <div className="h-8 w-px bg-neutral-200 mx-1" />

          <div className="flex items-center bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "list" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "grid" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
          <p className="text-neutral-500 font-medium">Opening your library...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-neutral-200/60 border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-50 mx-auto mb-4 text-3xl">
            📂
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            {search ? "No matches found" : "Your library is empty"}
          </h3>
          <p className="text-sm text-neutral-500 max-w-xs mx-auto mt-2">
            {search ? "Try adjusting your search or filters to find what you're looking for." : "Upload documents to start your immersive study journey."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map((doc: any) => (
            <FileCard
              key={doc.id}
              doc={doc}
              view="grid"
              classCode="personal"
              onDeleteSuccess={() => refetch()}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc: any) => (
            <FileCard
              key={doc.id}
              doc={doc}
              view="list"
              classCode="personal"
              onDeleteSuccess={() => refetch()}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-6 py-2 rounded-xl border border-neutral-200 text-sm font-bold bg-white hover:bg-neutral-50 disabled:opacity-50 transition-all font-display"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 rounded-xl border border-neutral-200 text-sm font-bold bg-white hover:bg-neutral-50 disabled:opacity-50 transition-all font-display"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
