import api from "./api";

export const challengesApi = {
  create: (
    opponentId: string,
    documentId: string,
    questionCount = 5,
    wagerAmount = 5,
  ) =>
    api("/challenges/", {
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
    return api(`/challenges/?${params}`);
  },

  accept: (id: string) => api(`/challenges/${id}/accept`, { method: "POST" }),

  decline: (id: string) => api(`/challenges/${id}/decline`, { method: "POST" }),

  cancel: (id: string) => api(`/challenges/${id}/cancel`, { method: "POST" }),

  submitScore: (id: string, score: number) =>
    api(`/challenges/${id}/submit-score`, {
      method: "POST",
      body: JSON.stringify({ score }),
    }),

  resolve: (id: string) => api(`/challenges/${id}/resolve`, { method: "POST" }),
};
