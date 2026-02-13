import api from "./api";

export const studySessionsApi = {
  start: (documentId: string) =>
    api("/study-sessions/", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId }),
    }),

  heartbeat: (sessionId: string) =>
    api(`/study-sessions/${sessionId}/heartbeat`, { method: "POST" }),

  end: (sessionId: string) =>
    api(`/study-sessions/${sessionId}/end`, { method: "POST" }),

  stats: () => api("/study-sessions/stats"),
};
