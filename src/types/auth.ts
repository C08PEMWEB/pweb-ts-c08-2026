export type UserRole = "admin" | "moderator" | "user";

export interface AuthSession {
  token: string;
  role: UserRole;
  firstName: string;
  username: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface DummyJsonLoginResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  accessToken?: string;
  token?: string;
  role?: string;
}

