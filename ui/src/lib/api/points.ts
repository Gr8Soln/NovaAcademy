import api from "./api";

export const pointsApi = {
  balance: () => api<{ balance: number }>("/points/balance"),
  history: (offset = 0, limit = 20) =>
    api(`/points/history?offset=${offset}&limit=${limit}`),
};
