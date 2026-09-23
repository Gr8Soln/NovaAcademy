export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string | null;
  username_changed_at: string | null;
  auth_provider: string;
  avatar_url: string | null;
  is_active: boolean;
  has_password: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export type ClassRole = "owner" | "admin" | "member";

export interface ClassMember {
  user_id: string;
  username: string;
  role: ClassRole;
  joined_at: string;
}

export interface ClassRoom {
  id: string;
  code: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_private: boolean;
  created_by: string;
  member_count: number;
  members: ClassMember[];
  created_at: string;
}

export type JoinRequestStatus = "pending" | "accepted" | "rejected";

export interface JoinRequest {
  id: string;
  class_id: string;
  user_id: string;
  username: string;
  status: JoinRequestStatus;
  created_at: string;
}

export interface JoinClassResult {
  joined: boolean;
  join_request?: JoinRequest;
}

export interface UserSearchResult {
  id: string;
  username: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  email: string;
}
