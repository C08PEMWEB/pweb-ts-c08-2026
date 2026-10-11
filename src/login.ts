import type { AuthSession, DummyJsonLoginResponse } from "./types/index.js";
import { saveSession } from "./utils/storage.js";
import { redirectIfLoggedIn } from "./utils/guard.js";

// Pengalihan jika sudah login
redirectIfLoggedIn();

// Form elements dasar sebagai jembatan sistem
const formLogin = document.getElementById("form-login") as HTMLFormElement | null;
const inputUsername = document.getElementById("input-username") as HTMLInputElement | null;
const inputPassword = document.getElementById("input-password") as HTMLInputElement | null;
const alertBox = document.getElementById("login-alert");

if (formLogin) {
  formLogin.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    if (!inputUsername || !inputPassword) return;

    const username = inputUsername.value.trim();
    const password = inputPassword.value;

    try {
      // Panggilan API POST dummyjson
      const response = await fetch("https://dummyjson.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, expiresInMins: 60 }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Login gagal: Username atau password tidak sesuai.");
      }

      const loginData = data as DummyJsonLoginResponse;
      const token = loginData.accessToken ?? loginData.token ?? "token-dummy";

      // Role check (admin/moderator -> index.html, user -> operator.html)
      let role: AuthSession["role"] = "user";
      if (loginData.role === "admin" || loginData.role === "moderator") {
        role = loginData.role;
      } else if (username === "emilys" || username === "michaelw") {
        role = "admin";
      }

      const session: AuthSession = {
        token,
        role,
        firstName: loginData.firstName || loginData.username,
        username: loginData.username,
      };

      saveSession(session);

      // Redirect otomatis sesuai peran
      if (session.role === "admin" || session.role === "moderator") {
        window.location.href = "index.html";
      } else {
        window.location.href = "operator.html";
      }
    } catch (err) {
      if (alertBox) {
        alertBox.textContent = err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
        alertBox.style.color = "red";
      }
    }
  });
}
