import { getSession, clearSession } from "./storage.js";
/**
 * Memeriksa apakah role pengguna memiliki izin yang diminta.
 * Sesuai ketentuan soal: Role 'moderator' diperlakukan sama dengan role 'admin'.
 */
export function hasRequiredRole(userRole, allowedRoles) {
    const normalizedUserRole = userRole.toLowerCase();
    return allowedRoles.some((allowed) => {
        const normalizedAllowed = allowed.toLowerCase();
        if (normalizedAllowed === normalizedUserRole)
            return true;
        // Moderator diperlakukan sama dengan admin
        if (normalizedAllowed === "admin" && normalizedUserRole === "moderator")
            return true;
        if (normalizedAllowed === "moderator" && normalizedUserRole === "admin")
            return true;
        return false;
    });
}
/**
 * Auth Guard & Role Guard untuk halaman yang terproteksi (index.html, operator.html)
 * Melakukan redirect paksa ke login.html jika belum login atau role tidak memenuhi syarat.
 */
export function requireAuth(allowedRoles) {
    const session = getSession();
    if (!session || !session.token) {
        const currentPath = window.location.pathname.split("/").pop() || "";
        const redirectParam = currentPath && currentPath !== "login.html"
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
export function redirectIfLoggedIn() {
    const session = getSession();
    if (session && session.token) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get("redirect");
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
        else if (session.role === "admin" || session.role === "moderator") {
            window.location.href = "index.html";
        }
        else {
            window.location.href = "ambil-antrian.html";
        }
    }
}
/**
 * Inisialisasi komponen navbar (Nama pengguna, badge role, tombol logout)
 */
export function setupNavbar(session) {
    const userNameEl = document.getElementById("navbar-user-name");
    const userRoleEl = document.getElementById("navbar-user-role");
    const logoutBtn = document.getElementById("btn-logout");
    if (userNameEl) {
        userNameEl.textContent = session.firstName || session.username;
    }
    if (userRoleEl) {
        userRoleEl.textContent = session.role.toUpperCase();
        userRoleEl.className = `badge badge-${session.role === "admin" || session.role === "moderator" ? "primary" : "secondary"}`;
    }
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Apakah Anda yakin ingin keluar?")) {
                clearSession();
                window.location.href = "login.html";
            }
        });
    }
}
