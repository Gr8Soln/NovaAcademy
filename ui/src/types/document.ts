export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_type: string;
  file_size_bytes: number;
  processing_status: string;
  page_count: number | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}
