// ── Competition & performance types ──────────────────────────────

export interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  document_id: string;
  quiz_id: string | null;
  question_count: number;
  wager_amount: number;
  status: string;
  challenger_score: number | null;
  opponent_score: number | null;
  winner_id: string | null;
  expires_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  action: string;
  points: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  score: number;
  rank: number;
}

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
  total_challenges: number;
}
