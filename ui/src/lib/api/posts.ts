import api from "./api";

export const postsApi = {
  create: (content: string) =>
    api("/posts/", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  delete: (postId: string) => api(`/posts/${postId}`, { method: "DELETE" }),

  feed: (offset = 0, limit = 20) =>
    api(`/posts/feed?offset=${offset}&limit=${limit}`),

  explore: (offset = 0, limit = 20) =>
    api(`/posts/explore?offset=${offset}&limit=${limit}`),

  like: (postId: string) => api(`/posts/${postId}/like`, { method: "POST" }),

  unlike: (postId: string) =>
    api(`/posts/${postId}/like`, { method: "DELETE" }),
};
