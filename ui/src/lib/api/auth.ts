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
};
