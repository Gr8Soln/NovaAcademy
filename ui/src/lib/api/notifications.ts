import api, { BASE_URL } from "./api";

export const notificationsApi = {
  list: (unreadOnly = false, offset = 0, limit = 20) =>
    api(
      `/notifications/?unread_only=${unreadOnly}&offset=${offset}&limit=${limit}`,
    ),

  unreadCount: () => api<{ count: number }>("/notifications/unread-count"),

  markRead: (id: string) => api(`/notifications/${id}/read`, { method: "PUT" }),

  markAllRead: () => api("/notifications/read-all", { method: "PUT" }),

  /** Returns an EventSource for realtime SSE notifications. */
  stream: () => {
    return new EventSource(`${BASE_URL}/notifications/stream`);
  },
};
