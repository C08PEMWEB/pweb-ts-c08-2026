import type { AppPage, AuthSession, NavItem, UserRole } from "../types/index.js";
import { getSession, clearSession, STORAGE_KEYS } from "./storage.js";

/**
 * Daftar halaman pada navigasi utama, diurutkan mengikuti alur antrian:
 * kelola layanan -> ambil tiket -> panggil tiket -> tampil di layar.
 * Tab hanya ditampilkan untuk role yang berhak membuka halamannya.
 */
const NAV_ITEMS: readonly NavItem[] = [
  {
    page: "dashboard",
    href: "index.html",
    label: "Dashboard Admin",
    roles: ["admin", "moderator"],
    icon: '<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>',
  },
  {
    page: "kiosk",
    href: "ambil-antrian.html",
    label: "Ambil Antrian",
    roles: ["admin", "moderator", "user"],
    icon: '<path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25Z"></path>',
  },
  {
    page: "operator",
    href: "operator.html",
    label: "Panel Operator",
    roles: ["admin", "moderator", "user"],
    icon: '<path d="M8 1.5a6.5 6.5 0 0 0-6.5 6.5v4.25c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V8.5a.75.75 0 0 0-.75-.75H2.26A5.002 5.002 0 0 1 8 3a5.002 5.002 0 0 1 5.74 4.75h-1.49a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V8A6.5 6.5 0 0 0 8 1.5Zm-4.25 8.5v2.25H2.5V10h1.25Zm9.5 0v2.25h-1.25V10h1.25Z"></path>',
  },
  {
    page: "layar",
    href: "layar.html",
    label: "Layar Antrian",
    roles: ["admin", "moderator", "user"],
    icon: '<path d="M1.75 2.5h12.5a.25.25 0 0 1 .25.25v7.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25v-7.5a.25.25 0 0 1 .25-.25ZM0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 14.25 12H9v1.25h1.75a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5H7V12H1.75A1.75 1.75 0 0 1 0 10.25v-7.5Z"></path>',
  },
];

const BRAND_ICON = `
  <svg height="22" width="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--gh-success-fg);">
    <path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><path d="M10 9h4"/><path d="M12 7v4"/>
  </svg>`;

const ICON_USER = '<svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor"><path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path></svg>';
const ICON_CARET = '<svg height="12" width="12" viewBox="0 0 16 16" fill="currentColor" style="color: var(--gh-fg-muted);"><path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path></svg>';
const ICON_RESET = '<svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7 7 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7 7 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path></svg>';
const ICON_LOGOUT = '<svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm10.44 3.97a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l1.72-1.72H6.75a.75.75 0 0 1 0-1.5h7.44l-1.72-1.72a.75.75 0 0 1 0-1.06Z"></path></svg>';

/**
 * Memeriksa apakah role pengguna memiliki izin yang diminta.
 * Sesuai ketentuan soal: Role 'moderator' diperlakukan sama dengan role 'admin'.
 */
export function hasRequiredRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  const normalizedUserRole = userRole.toLowerCase();

  return allowedRoles.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase();
    if (normalizedAllowed === normalizedUserRole) return true;
    // Moderator diperlakukan sama dengan admin
    if (normalizedAllowed === "admin" && normalizedUserRole === "moderator") return true;
    if (normalizedAllowed === "moderator" && normalizedUserRole === "admin") return true;
    return false;
  });
}

/**
 * Halaman awal sesuai role: Admin/Moderator -> Dashboard, User -> Kiosk Ambil Antrian
 */
export function getHomePage(role: UserRole): string {
  return hasRequiredRole(role, ["admin"]) ? "index.html" : "ambil-antrian.html";
}

/**
 * Tujuan setelah login: parameter ?redirect= hanya dipakai jika halaman tersebut
 * dikenal dan boleh dibuka oleh role pengguna. Selain itu ke halaman awal role.
 */
export function getPostLoginUrl(session: AuthSession): string {
  const redirectUrl = new URLSearchParams(window.location.search).get("redirect");
  const target = NAV_ITEMS.find((item) => item.href === redirectUrl);
  if (target && hasRequiredRole(session.role, target.roles)) {
    return target.href;
  }
  return getHomePage(session.role);
}

/**
 * Auth Guard & Role Guard untuk halaman yang terproteksi (index.html, operator.html)
 * Melakukan redirect paksa ke login.html jika belum login atau role tidak memenuhi syarat.
 */
export function requireAuth(allowedRoles?: UserRole[]): AuthSession {
  const session = getSession();

  if (!session || !session.token) {
    const currentPath = window.location.pathname.split("/").pop() || "";
    const redirectParam =
      currentPath && currentPath !== "login.html"
        ? `?redirect=${encodeURIComponent(currentPath)}`
        : "";
    window.location.href = `login.html${redirectParam}`;
    throw new Error("Sesi tidak valid, mengalihkan ke halaman login...");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRequiredRole(session.role, allowedRoles)) {
      alert("Akses ditolak: Anda tidak memiliki izin untuk mengakses halaman ini!");
      window.location.href = "login.html";
      throw new Error("Izin tidak mencukupi, mengalihkan ke halaman login...");
    }
  }

  return session;
}

/**
 * Redirect otomatis pada halaman login.html jika pengguna sudah memiliki sesi aktif
 */
export function redirectIfLoggedIn(): void {
  const session = getSession();
  if (session && session.token) {
    window.location.href = getPostLoginUrl(session);
  }
}

function renderProfileMenu(showReset: boolean): string {
  const resetItem = showReset
    ? `
      <button id="btn-reset-antrian" class="gh-dropdown-item gh-dropdown-item-danger" type="button" role="menuitem">
        ${ICON_RESET} Reset Seluruh Antrian
      </button>
      <div class="gh-dropdown-divider"></div>`
    : "";

  return `
    <div class="gh-dropdown-wrapper">
      <button id="btn-profile-toggle" class="gh-profile-btn" type="button" title="Menu Pengguna" aria-haspopup="menu" aria-expanded="false">
        <span class="gh-avatar-icon">${ICON_USER}</span>
        <span id="navbar-user-name" class="gh-profile-name"></span>
        <span id="navbar-user-role" class="badge"></span>
        ${ICON_CARET}
      </button>
      <div id="profile-dropdown-menu" class="gh-dropdown-menu" role="menu">
        <div class="gh-dropdown-header">
          <div>Masuk sebagai</div>
          <div id="navbar-user-handle" class="gh-dropdown-user"></div>
        </div>
        <div class="gh-dropdown-divider"></div>
        ${resetItem}
        <button id="btn-logout" class="gh-dropdown-item" type="button" role="menuitem">
          ${ICON_LOGOUT} Keluar
        </button>
      </div>
    </div>`;
}

function bindProfileMenu(): void {
  const toggleBtn = document.getElementById("btn-profile-toggle");
  const menu = document.getElementById("profile-dropdown-menu");
  if (!toggleBtn || !menu) return;

  const setOpen = (open: boolean): void => {
    menu.classList.toggle("show", open);
    toggleBtn.setAttribute("aria-expanded", String(open));
  };

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!menu.classList.contains("show"));
  });

  // Tutup dropdown saat klik di luar area, saat item dipilih, atau saat tekan Escape
  document.addEventListener("click", (e) => {
    if (e.target instanceof Node && !menu.contains(e.target)) setOpen(false);
  });
  menu.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.closest(".gh-dropdown-item")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

/**
 * Inisialisasi navigasi utama (header + tab) yang sama untuk semua halaman.
 * - Tab hanya menampilkan halaman yang boleh dibuka oleh role pengguna.
 * - Tanpa sesi (pengunjung di layar.html): hanya brand + tombol "Masuk Petugas".
 * - Tombol Reset Antrian hanya muncul di Dashboard Admin (handler ada di admin.ts).
 *
 * Halaman wajib menyediakan <header id="app-header"> dan <nav id="app-subnav">.
 */
export function setupNavbar(session: AuthSession | null, activePage: AppPage): void {
  const header = document.getElementById("app-header");
  const subnav = document.getElementById("app-subnav");
  const homePage = session ? getHomePage(session.role) : "layar.html";

  if (header) {
    header.innerHTML = `
      <div class="gh-header-left">
        <div class="gh-header-brand">
          ${BRAND_ICON}
          <div class="gh-repo-breadcrumb">
            <a href="${homePage}">rs-santosa</a>
            <span>/</span>
            <a href="${homePage}" style="font-weight: 700;">antrian-engine</a>
          </div>
        </div>
      </div>
      <div class="gh-header-right">
        ${
          session
            ? renderProfileMenu(activePage === "dashboard" && hasRequiredRole(session.role, ["admin"]))
            : `<a class="btn btn-sm btn-primary" href="login.html?redirect=layar.html">Masuk Petugas</a>`
        }
      </div>`;
  }

  if (subnav) {
    const items = session ? NAV_ITEMS.filter((item) => hasRequiredRole(session.role, item.roles)) : [];
    subnav.hidden = items.length === 0;
    subnav.innerHTML = items
      .map((item) => {
        const isActive = item.page === activePage;
        return `
          <a href="${item.href}" class="gh-tab ${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">${item.icon}</svg>
            ${item.label}
          </a>`;
      })
      .join("");
  }

  if (session) {
    const isAdmin = hasRequiredRole(session.role, ["admin"]);
    const userNameEl = document.getElementById("navbar-user-name");
    const userRoleEl = document.getElementById("navbar-user-role");
    const userHandleEl = document.getElementById("navbar-user-handle");
    const logoutBtn = document.getElementById("btn-logout");

    if (userNameEl) userNameEl.textContent = session.firstName || session.username;
    if (userHandleEl) userHandleEl.textContent = `@${session.username}`;
    if (userRoleEl) {
      userRoleEl.textContent = session.role.toUpperCase();
      userRoleEl.className = `badge ${isAdmin ? "badge-primary" : "badge-secondary"}`;
    }

    logoutBtn?.addEventListener("click", () => {
      if (confirm("Apakah Anda yakin ingin keluar?")) {
        clearSession();
        window.location.href = "login.html";
      }
    });

    bindProfileMenu();
  }

  // Login/logout di tab lain: muat ulang agar guard & navigasi mengikuti sesi terbaru
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEYS.SESSION || event.key === null) {
      window.location.reload();
    }
  });
}
