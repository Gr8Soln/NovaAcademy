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
