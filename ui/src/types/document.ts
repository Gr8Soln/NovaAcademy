export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";
export type DocumentFileType = "pdf" | "txt" | "docx" | "md";

export interface Document {
  id: string;
  user_id: string;
  class_id: string;                       // class this document belongs to
  title: string;
  file_type: DocumentFileType;
  file_size_bytes: number;
  processing_status: ProcessingStatus;    // changes asynchronously – poll for "ready"
  page_count: number | null;              // null for non-PDF formats
  chunk_count: number;                    // 0 until processing finishes
  file_url: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentPagination {
  current_page: number;
  page_size: number;
  total_data: number;
  total_data_fetched: number;
  total_pages: number;
  previous_page: number | null;
  next_page: number | null;
}

export interface DocumentListResponse {
  status: string;
  message: string;
  data: Document[];
  metadata: DocumentPagination | null;
}
