import api from "./api";

export const authApi = {
  register: (email: string, full_name: string, password: string) =>
    api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, full_name, password }),
    }),

  login: (email: string, password: string) =>
    api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  googleLogin: (code: string) =>
    api("/auth/google", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  refresh: (refreshToken: string) =>
    api("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  me: () => api("/users/me"),

  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
  }) =>
    api("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api("/users/me/avatar", { method: "POST", body: form });
  },

  removeAvatar: () => api("/users/me/avatar", { method: "DELETE" }),

  setPassword: (password: string) =>
    api("/users/me/password", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  changePassword: (current_password: string, new_password: string) =>
    api("/users/me/password", {
      method: "PUT",
      body: JSON.stringify({ current_password, new_password }),
    }),
};
