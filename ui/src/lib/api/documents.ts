import api from "./api";
import type { Document, DocumentListResponse } from "@/types/document";

export type { Document, DocumentListResponse };

export const documentsApi = {
  /** List documents (paginated). If classCode is 'personal', lists all/personal docs. */
  list: (
    classCode: string,
    offset = 0,
    limit = 20,
  ): Promise<DocumentListResponse> => {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    const url = classCode === "personal"
      ? `/documents/?${params.toString()}`
      : `/class/${classCode}/documents/?${params.toString()}`;
    return api(url);
  },

  /** Get a single document by ID */
  get: (classCode: string, id: string): Promise<{ status: string; message: string; data: Document }> => {
    const url = classCode === "personal"
      ? `/documents/${id}`
      : `/class/${classCode}/documents/${id}`;
    return api(url);
  },

  /**
   * Upload a document.
   */
  upload: (
    classCode: string,
    file: File,
    title?: string,
  ): Promise<{ status: string; message: string; data: { document: Document } }> => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    const url = classCode === "personal"
      ? `/documents/`
      : `/class/${classCode}/documents/`;
    return api(url, { method: "POST", body: form });
  },

  /** Permanently delete a document */
  delete: (classCode: string, id: string): Promise<{ status: string; message: string }> => {
    const url = classCode === "personal"
      ? `/documents/${id}`
      : `/class/${classCode}/documents/${id}`;
    return api(url, { method: "DELETE" });
  },

  /** Perform semantic search across documents */
  search: (
    classCode: string,
    query: string,
    limit = 5,
  ): Promise<{ status: string; message: string; data: any[] }> => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const url = classCode === "personal"
      ? `/documents/search?${params.toString()}`
      : `/class/${classCode}/documents/search?${params.toString()}`;
    return api(url);
  },
};
