// ── Competition & performance types ──────────────────────────────

export interface StudySession {
  id: string;
  user_id: string;
  document_id: string;
  started_at: string;
  last_heartbeat_at: string;
  ended_at: string | null;
  duration_seconds: number;
  is_active: boolean;
}

export interface StudyStats {
  total_seconds: number;
  total_minutes: number;
  total_hours: number;
}

export interface UserAnalytics {
  total_points: number;
  total_study_seconds: number;
  total_quizzes: number;
  accuracy: number;
  class_stats: Record<string, number>;
}
