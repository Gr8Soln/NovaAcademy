import api from "./api";

export const leaderboardApi = {
  get: (boardType: string, period: string, limit = 100) =>
    api(`/leaderboard/${boardType}/${period}?limit=${limit}`),

  myRank: (boardType: string, period: string) =>
    api(`/leaderboard/${boardType}/${period}/me`),

  aroundUser: (boardType: string, period: string, userId: string, count = 5) =>
    api(`/leaderboard/${boardType}/${period}/around/${userId}?count=${count}`),
};
