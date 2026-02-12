import api from "./api";

export const dashboardApi = {
  get: () => api("/dashboard/"),
};
