import { useAuthStore } from "@/stores/authStore";

const BASE = "/api/v1";

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
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, full_name: string, password: string) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, full_name, password }),
    }),

  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  googleLogin: (code: string) =>
    request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  refresh: (refreshToken: string) =>
    request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  me: () => request("/users/me"),
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
