export type UserRole = "admin" | "moderator" | "user";

export interface AuthSession {
  token: string;
  role: UserRole;
  firstName: string;
  username: string;
}

// Halaman aplikasi yang tampil di navigasi utama (dipakai oleh setupNavbar)
export type AppPage = "dashboard" | "kiosk" | "operator" | "layar";

export interface NavItem {
  page: AppPage;
  href: string;
  label: string;
  icon: string;          // isi <path> SVG ikon tab (viewBox 0 0 16 16)
  roles: UserRole[];     // role yang boleh melihat & membuka halaman ini
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

