export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface JwtPayload {
  id: number;
  email: string;
}
