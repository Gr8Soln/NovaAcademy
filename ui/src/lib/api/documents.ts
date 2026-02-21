import api from "./api";
import type { Document, DocumentListResponse } from "@/types/document";

export type { Document, DocumentListResponse };

export const documentsApi = {
  /** List documents for a specific class (paginated) */
  list: (
    classCode: string,
    offset = 0,
    limit = 20,
  ): Promise<DocumentListResponse> => {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    return api(`/class/${classCode}/documents/?${params.toString()}`);
  },

  /** Get a single document by ID within a class context */
  get: (classCode: string, id: string): Promise<{ status: string; message: string; data: Document }> =>
    api(`/class/${classCode}/documents/${id}`),

  /**
   * Upload a document to a specific class.
   *
   * The server responds immediately with `processing_status = "pending"`.
   * Chunking + embedding run in the background – poll `get(id)` to track progress.
   */
  upload: (
    classCode: string,
    file: File,
    title?: string,
  ): Promise<{ status: string; message: string; data: { document: Document } }> => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    return api(`/class/${classCode}/documents/`, { method: "POST", body: form });
  },

  /** Permanently delete a document and all its data */
  delete: (classCode: string, id: string): Promise<{ status: string; message: string }> =>
    api(`/class/${classCode}/documents/${id}`, { method: "DELETE" }),

  /** Perform semantic search across documents within a class */
  search: (
    classCode: string,
    query: string,
    limit = 5,
  ): Promise<{ status: string; message: string; data: any[] }> => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    return api(`/class/${classCode}/documents/search?${params.toString()}`);
  },
};
