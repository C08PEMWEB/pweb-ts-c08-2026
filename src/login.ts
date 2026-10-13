import type { AuthSession, DummyJsonLoginResponse } from "./types/index.js";
import { saveSession } from "./utils/storage.js";
import { redirectIfLoggedIn, getPostLoginUrl } from "./utils/guard.js";

// Pengalihan otomatis jika pengguna sudah login
redirectIfLoggedIn();

const formLogin = document.getElementById("form-login") as HTMLFormElement | null;
const inputUsername = document.getElementById("input-username") as HTMLInputElement | null;
const inputPassword = document.getElementById("input-password") as HTMLInputElement | null;
const btnSubmitLogin = document.getElementById("btn-submit-login") as HTMLButtonElement | null;
const alertBox = document.getElementById("login-alert");

if (formLogin) {
  formLogin.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    if (!inputUsername || !inputPassword) return;

    const username = inputUsername.value.trim();
    const password = inputPassword.value;

    if (!username || !password) {
      if (alertBox) {
        alertBox.textContent = "Username dan password wajib diisi!";
        alertBox.className = "alert alert-danger";
      }
      return;
    }

    if (alertBox) {
      alertBox.textContent = "";
      alertBox.className = "";
    }
    if (btnSubmitLogin) {
      btnSubmitLogin.disabled = true;
      btnSubmitLogin.textContent = "Memproses...";
    }

    try {
      const response = await fetch("https://dummyjson.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, expiresInMins: 60 }),
      });

      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Login gagal: Username atau password tidak sesuai.");
      }

      const loginData = data as DummyJsonLoginResponse;
      const token = loginData.accessToken ?? loginData.token ?? "token-dummy";

      let role: AuthSession["role"] = "user";
      if (loginData.role === "admin" || loginData.role === "moderator") {
        role = loginData.role;
      } else if (typeof loginData.id === "number") {
        // Ambil role asli pengguna dari endpoint /users/{id} DummyJSON
        try {
          const userRes = await fetch(
            `https://dummyjson.com/users/${loginData.id}?select=role`
          );
          if (userRes.ok) {
            const userData: unknown = await userRes.json();
            if (
              typeof userData === "object" &&
              userData !== null &&
              "role" in userData
            ) {
              const fetchedRole = (userData as { role: unknown }).role;
              if (fetchedRole === "admin" || fetchedRole === "moderator") {
                role = fetchedRole;
              }
            }
          }
        } catch {
          // Fallback jika gagal fetch detail role
          if (username === "emilys" || username === "michaelw") {
            role = "admin";
          }
        }
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

      window.location.href = getPostLoginUrl(session);
    } catch (err) {
      if (alertBox) {
        alertBox.textContent =
          err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
        alertBox.className = "alert alert-danger";
      }
    } finally {
      if (btnSubmitLogin) {
        btnSubmitLogin.disabled = false;
        btnSubmitLogin.textContent = "Masuk";
      }
    }
  });
}