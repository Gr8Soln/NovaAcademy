import type { ClassRoom, JoinClassResult, JoinRequest } from "@/types";
import api from "./api";

export interface CreateClassPayload {
  name: string;
  description?: string;
  is_private?: boolean;
  initial_member_usernames?: string[];
  image?: File;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
  is_private?: boolean;
  image?: File;
}

function buildClassFormData(
  payload: CreateClassPayload | UpdateClassPayload,
): FormData {
  const fd = new FormData();
  if (payload.name !== undefined) fd.append("name", payload.name);
  if (payload.description !== undefined)
    fd.append("description", payload.description);
  if (payload.is_private !== undefined)
    fd.append("is_private", String(payload.is_private));
  if (
    "initial_member_usernames" in payload &&
    payload.initial_member_usernames?.length
  ) {
    fd.append(
      "initial_member_usernames",
      payload.initial_member_usernames.join(","),
    );
  }
  if (payload.image) fd.append("image", payload.image);
  return fd;
}

export const classApi = {
  // ── Class CRUD ─────────────────────────────────────────────────

  createClass: (payload: CreateClassPayload) =>
    api<ClassRoom>("/class", {
      method: "POST",
      body: buildClassFormData(payload),
    }),

  getMyClasses: () => api<ClassRoom[]>("/class"),

  searchClasses: (query: string, limit = 20) =>
    api<ClassRoom[]>(
      `/class/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    ),

  getClass: (classCode: string) => api<ClassRoom>(`/class/${classCode}`),

  updateClass: (classCode: string, payload: UpdateClassPayload) =>
    api<ClassRoom>(`/class/${classCode}`, {
      method: "PUT",
      body: buildClassFormData(payload),
    }),

  deleteClass: (classCode: string) =>
    api<null>(`/class/${classCode}`, { method: "DELETE" }),

  // ── Join ───────────────────────────────────────────────────────

  joinClass: (classCode: string) =>
    api<JoinClassResult>(`/class/${classCode}/join`, { method: "POST" }),

  // ── Join Requests ──────────────────────────────────────────────

  getJoinRequests: (classCode: string) =>
    api<JoinRequest[]>(`/class/${classCode}/join-requests`),

  handleJoinRequest: (
    classCode: string,
    requestId: string,
    action: "accept" | "reject",
  ) =>
    api<JoinRequest>(`/class/${classCode}/join-requests/${requestId}`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    }),

  // ── Participants ───────────────────────────────────────────────

  addMember: (classCode: string, username: string) =>
    api<ClassRoom>(`/class/${classCode}/participants`, {
      method: "POST",
      body: JSON.stringify({ username }),
    }),

  removeMember: (classCode: string, targetUserId: string) =>
    api<null>(`/class/${classCode}/participants/${targetUserId}`, {
      method: "DELETE",
    }),

  changeMemberRole: (
    classCode: string,
    targetUserId: string,
    role: "admin" | "member",
  ) =>
    api<ClassRoom>(`/class/${classCode}/participants/${targetUserId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
};
