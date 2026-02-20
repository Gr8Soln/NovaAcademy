import type { AuthResponse, TokenPair, User } from "@/types";
import api from "./api";

export const authApi = {
  // ── Auth ───────────────────────────────────────────────────────

  register: (
    email: string,
    first_name: string,
    last_name: string,
    password: string,
  ) =>
    api<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, first_name, last_name, password }),
    }),

  login: (email: string, password: string) =>
    api<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  googleAuth: (code: string, is_access_token = true) =>
    api<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ code, is_access_token }),
    }),

  refresh: (refresh_token: string) =>
    api<TokenPair>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  forgotPassword: (email: string) =>
    api<null>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    api<null>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),

  confirmEmail: (token: string) =>
    api<User>("/auth/confirm-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  resendConfirmEmail: (email: string) =>
    api<null>("/auth/resend-confirm-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // ── User / Profile ─────────────────────────────────────────────

  me: () => api<User>("/users/me"),

  updateProfile: (data: { first_name?: string; last_name?: string }) =>
    api<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api<User>("/users/me/avatar", { method: "POST", body: form });
  },

  removeAvatar: () => api<User>("/users/me/avatar", { method: "DELETE" }),

  setPassword: (password: string) =>
    api<User>("/users/me/password", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  changePassword: (current_password: string, new_password: string) =>
    api<User>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify({ current_password, new_password }),
    }),

  updateUsername: (username: string) =>
    api<User>("/users/me/username", {
      method: "PATCH",
      body: JSON.stringify({ username }),
    }),

  deactivateAccount: () => api<null>("/users/me", { method: "DELETE" }),
};
