export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  auth_provider: string;
  avatar_url: string | null;
  is_active: boolean;
  has_password?: boolean;
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
