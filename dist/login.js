import { saveSession } from "./utils/storage.js";
import { redirectIfLoggedIn } from "./utils/guard.js";
// Pengalihan jika sudah login
redirectIfLoggedIn();
// Form elements dasar sebagai jembatan sistem
const formLogin = document.getElementById("form-login");
const inputUsername = document.getElementById("input-username");
const inputPassword = document.getElementById("input-password");
const alertBox = document.getElementById("login-alert");
if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!inputUsername || !inputPassword)
            return;
        const username = inputUsername.value.trim();
        const password = inputPassword.value;
        try {
            // Panggilan API POST dummyjson
            const response = await fetch("https://dummyjson.com/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, expiresInMins: 60 }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error("Login gagal: Username atau password tidak sesuai.");
            }
            const loginData = data;
            const token = loginData.accessToken ?? loginData.token ?? "token-dummy";
            // Role check (admin/moderator -> index.html, user -> operator.html)
            let role = "user";
            if (loginData.role === "admin" || loginData.role === "moderator") {
                role = loginData.role;
            }
            else if (username === "emilys" || username === "michaelw") {
                role = "admin";
            }
            const session = {
                token,
                role,
                firstName: loginData.firstName || loginData.username,
                username: loginData.username,
            };
            saveSession(session);
            // Redirect otomatis sesuai peran
            if (session.role === "admin" || session.role === "moderator") {
                window.location.href = "index.html";
            }
            else {
                window.location.href = "operator.html";
            }
        }
        catch (err) {
            if (alertBox) {
                alertBox.textContent = err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
                alertBox.style.color = "red";
            }
        }
    });
}
