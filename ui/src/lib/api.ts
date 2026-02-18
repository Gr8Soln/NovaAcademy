import { useAuthStore } from "@/stores";
import type { AuthResponse, TokenPair, User } from "@/types";

const BASE = import.meta.env.VITE_BASE_API_URL;

// ── Envelope types ───────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number;
  page_size: number;
  total_data: number;
  total_data_fetched: number;
  total_pages: number;
  previous_page: number | null;
  next_page: number | null;
}

export interface PagedResult<T> {
  data: T[];
  metadata: PaginationMeta;
}

// ── Core request helpers ─────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.message || "Request failed");
  }

  const body = await res.json();
  return body.data as T;
}

/**
 * Like `request`, but returns both the data array and pagination metadata.
 * Use for paginated list endpoints.
 */
export async function requestPaged<T>(
  path: string,
  options: RequestInit = {},
): Promise<PagedResult<T>> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.message || "Request failed");
  }

  const body = await res.json();
  return { data: body.data as T[], metadata: body.metadata as PaginationMeta };
}

// ── Auth ─────────────────────────────────────────────────────────

export const authApi = {
  register: (
    email: string,
    first_name: string,
    last_name: string,
    password: string,
  ) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, first_name, last_name, password }),
    }),

  google: (accessToken: string, isAccessToken: boolean = false) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({
        code: accessToken,
        is_access_token: isAccessToken,
      }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  googleLogin: (code: string) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  refresh: (refreshToken: string) =>
    request<TokenPair>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  forgotPassword: (email: string) =>
    request<null>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<null>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    }),

  me: () => request<User>("/users/me"),
};

// ── Documents ────────────────────────────────────────────────────

export const documentsApi = {
  list: (offset = 0, limit = 20) =>
    request(`/documents/?offset=${offset}&limit=${limit}`),

  get: (id: string) => request(`/documents/${id}`),

  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request("/documents/", { method: "POST", body: form });
  },

  process: (id: string) =>
    request(`/documents/${id}/process`, { method: "POST" }),

  delete: (id: string) => request(`/documents/${id}`, { method: "DELETE" }),
};

// ── AI ───────────────────────────────────────────────────────────

export const aiApi = {
  askStream: (documentId: string, question: string, topK = 5) => {
    const token = useAuthStore.getState().accessToken;
    return fetch(`${BASE}/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        document_id: documentId,
        question,
        top_k: topK,
      }),
    });
  },

  summaryStream: (documentId: string) => {
    const token = useAuthStore.getState().accessToken;
    return fetch(`${BASE}/ai/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ document_id: documentId }),
    });
  },

  generateQuiz: (documentId: string, numQuestions = 10) =>
    request("/ai/quiz", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentId,
        num_questions: numQuestions,
      }),
    }),

  generateFlashcards: (documentId: string, numCards = 20) =>
    request("/ai/flashcards", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentId,
        num_cards: numCards,
      }),
    }),
};

// ── Quizzes ──────────────────────────────────────────────────────

export const quizzesApi = {
  list: () => request("/quizzes/"),
  get: (id: string) => request(`/quizzes/${id}`),
  submit: (quizId: string, answers: Record<string, string>) =>
    request(`/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};

// ── Dashboard ────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => request("/dashboard/"),
};

// ── Challenges ───────────────────────────────────────────────────

export const challengesApi = {
  create: (
    opponentId: string,
    documentId: string,
    questionCount = 5,
    wagerAmount = 5,
  ) =>
    request("/challenges/", {
      method: "POST",
      body: JSON.stringify({
        opponent_id: opponentId,
        document_id: documentId,
        question_count: questionCount,
        wager_amount: wagerAmount,
      }),
    }),

  list: (status?: string, offset = 0, limit = 20) => {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    return request(`/challenges/?${params}`);
  },

  accept: (id: string) =>
    request(`/challenges/${id}/accept`, { method: "POST" }),

  decline: (id: string) =>
    request(`/challenges/${id}/decline`, { method: "POST" }),

  cancel: (id: string) =>
    request(`/challenges/${id}/cancel`, { method: "POST" }),

  submitScore: (id: string, score: number) =>
    request(`/challenges/${id}/submit-score`, {
      method: "POST",
      body: JSON.stringify({ score }),
    }),

  resolve: (id: string) =>
    request(`/challenges/${id}/resolve`, { method: "POST" }),
};

// ── Points ───────────────────────────────────────────────────────

export const pointsApi = {
  balance: () => request("/points/balance"),
  history: (offset = 0, limit = 20) =>
    request(`/points/history?offset=${offset}&limit=${limit}`),
};

// ── Leaderboard ──────────────────────────────────────────────────

export const leaderboardApi = {
  get: (boardType: string, period: string, limit = 100) =>
    request(`/leaderboard/${boardType}/${period}?limit=${limit}`),

  myRank: (boardType: string, period: string) =>
    request(`/leaderboard/${boardType}/${period}/me`),

  aroundUser: (boardType: string, period: string, userId: string, count = 5) =>
    request(
      `/leaderboard/${boardType}/${period}/around/${userId}?count=${count}`,
    ),

  /** Public preview — no auth required */
  publicTop: (limit = 5) => request(`/leaderboard/public/top?limit=${limit}`),
};

// ── Study Sessions ───────────────────────────────────────────────

export const studySessionsApi = {
  start: (documentId: string) =>
    request("/study-sessions/", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId }),
    }),

  heartbeat: (sessionId: string) =>
    request(`/study-sessions/${sessionId}/heartbeat`, { method: "POST" }),

  end: (sessionId: string) =>
    request(`/study-sessions/${sessionId}/end`, { method: "POST" }),

  stats: () => request("/study-sessions/stats"),
};

// ── Analytics ────────────────────────────────────────────────────

export const analyticsApi = {
  me: () => request("/analytics/me"),
};

// ── Users ────────────────────────────────────────────────────────

export const usersApi = {
  me: () => request<User>("/users/me"),

  updateProfile: (fullName: string, avatarUrl?: string | null) =>
    request<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl }),
    }),

  search: (query = "", offset = 0, limit = 20) =>
    request<User[]>(
      `/users/search?q=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`,
    ),

  getById: (userId: string) => request<User>(`/users/${userId}`),
};
