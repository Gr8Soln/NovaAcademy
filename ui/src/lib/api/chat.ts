import type { Group } from "@/types";
import api from "./api";

export interface CreateGroupPayload {
  name: string;
  description?: string;
  avatar_url?: string;
  is_private?: boolean;
  initial_member_usernames?: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  avatar_url?: string;
  is_private?: boolean;
}

export const chatApi = {
  // ── Groups ─────────────────────────────────────────────────────

  createGroup: (payload: CreateGroupPayload) =>
    api<Group>("/chat/groups", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyGroups: () => api<Group[]>("/chat/groups"),

  getGroup: (groupId: string) => api<Group>(`/chat/groups/${groupId}`),

  updateGroup: (groupId: string, payload: UpdateGroupPayload) =>
    api<Group>(`/chat/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteGroup: (groupId: string) =>
    api<null>(`/chat/groups/${groupId}`, { method: "DELETE" }),

  // ── Members ────────────────────────────────────────────────────

  addMember: (groupId: string, username: string) =>
    api<Group>(`/chat/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ username }),
    }),

  removeMember: (groupId: string, targetUserId: string) =>
    api<null>(`/chat/groups/${groupId}/members/${targetUserId}`, {
      method: "DELETE",
    }),

  changeMemberRole: (
    groupId: string,
    targetUserId: string,
    role: "admin" | "member",
  ) =>
    api<Group>(`/chat/groups/${groupId}/members/${targetUserId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
};
