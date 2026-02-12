import api from "./api";

export const quizzesApi = {
  list: () => api("/quizzes/"),
  get: (id: string) => api(`/quizzes/${id}`),
  submit: (quizId: string, answers: Record<string, string>) =>
    api(`/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};
