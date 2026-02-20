export interface ApiResponse<T> {
  status: "success" | "failed";
  message: string;
  data: T | null;
  metadata?: IPagination;
}

export interface IPagination {
  current_page: number;
  page_size: number;
  total_data: number;
  total_data_fetched: number;
  total_pages: number | null;
  previous_page: number | null;
  next_page: number | null;
}

export * from "./dashboard";
export * from "./document";
export * from "./quizzes";
export * from "./social";
export * from "./user";
