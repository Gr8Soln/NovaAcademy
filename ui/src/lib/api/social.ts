import api from "./api";

export const socialApi = {
  follow: (userId: string) =>
    api(`/social/follow/${userId}`, { method: "POST" }),

  unfollow: (userId: string) =>
    api(`/social/unfollow/${userId}`, { method: "DELETE" }),

  followers: (userId: string, offset = 0, limit = 20) =>
    api(`/social/followers/${userId}?offset=${offset}&limit=${limit}`),

  following: (userId: string, offset = 0, limit = 20) =>
    api(`/social/following/${userId}?offset=${offset}&limit=${limit}`),

  followStats: (userId: string) => api(`/social/follow-stats/${userId}`),
};
