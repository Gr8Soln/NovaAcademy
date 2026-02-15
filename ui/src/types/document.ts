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
  status: string;
  message: string;
  data: Document[];
  metadata: {
    current_page: number;
    page_size: number;
    total_data: number;
    total_data_fetched: number;
    total_pages: number;
    previous_page: number | null;
    next_page: number | null;
  } | null;
}
