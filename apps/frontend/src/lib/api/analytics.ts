import api from "./api";

import type { UserAnalytics } from "@/types";

export const analyticsApi = {
  me: () => api<UserAnalytics>("/analytics/me"),
};
