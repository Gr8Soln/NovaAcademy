import api from "./api";
import type { Document, DocumentListResponse } from "@/types/document";

export type { Document, DocumentListResponse };

export const documentsApi = {
  /** List documents for the current user (paginated, optional class filter) */
  list: (
    offset = 0,
    limit = 20,
    class_id?: string,
  ): Promise<DocumentListResponse> => {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (class_id) params.append("class_id", class_id);
    return api(`/documents/?${params.toString()}`);
  },

  /** Get a single document by ID */
  get: (id: string): Promise<{ status: string; message: string; data: Document }> =>
    api(`/documents/${id}`),

  /**
   * Upload a document to a specific class.
   *
   * The server responds immediately with `processing_status = "pending"`.
   * Chunking + embedding run in the background – poll `get(id)` to track progress.
   */
  upload: (
    file: File,
    class_id: string,
    title?: string,
  ): Promise<{ status: string; message: string; data: { document: Document; message: string } }> => {
    const form = new FormData();
    form.append("file", file);
    form.append("class_id", class_id);
    if (title) form.append("title", title);
    return api("/documents/", { method: "POST", body: form });
  },

  /** Permanently delete a document and all its data */
  delete: (id: string): Promise<{ status: string; message: string }> =>
    api(`/documents/${id}`, { method: "DELETE" }),

  /** Perform semantic search across documents */
  search: (
    query: string,
    limit = 5,
    class_id?: string,
  ): Promise<{ status: string; message: string; data: any[] }> => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (class_id) params.append("class_id", class_id);
    return api(`/documents/search?${params.toString()}`);
  },
};

