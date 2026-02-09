// ── Shared types ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  auth_provider: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

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

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  order: number;
}

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  total_questions: number;
  created_at: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface ProgressRecord {
  id: string;
  user_id: string;
  document_id: string;
  topic_mastery: Record<string, number>;
  quizzes_taken: number;
  questions_answered: number;
  correct_answers: number;
  accuracy: number;
  total_study_time_seconds: number;
  last_study_at: string | null;
}

export interface DashboardData {
  total_documents: number;
  total_quizzes_taken: number;
  overall_accuracy: number;
  total_study_time_seconds: number;
  recent_documents: {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[];
  progress_records: ProgressRecord[];
}
