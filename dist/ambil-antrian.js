import { getServices, createTicket, clearSession } from "./utils/storage.js";
import { requireAuth } from "./utils/guard.js";
// 1. Auth Guard: Seluruh pengguna wajib login untuk ambil antrian (Revisi Modul 3)
const session = requireAuth();
// 2. Ambil hanya layanan yang berstatus aktif dari storage
function getActiveServices() {
    const allServices = getServices();
    return allServices.filter((s) => s.isActive);
}
// 3. Render opsi ke dalam elemen <select id="select-service">
function renderServiceOptions() {
    const selectEl = document.getElementById("select-service");
    if (!selectEl)
        return;
    const services = getActiveServices();
    if (services.length === 0) {
        selectEl.innerHTML = `<option value="" disabled selected>-- Belum ada layanan aktif dari Admin --</option>`;
        return;
    }
    const optionsHtml = services
        .map((s) => `<option value="${s.code}">Poli ${s.code} - ${s.name}</option>`)
        .join("");
    selectEl.innerHTML = `<option value="" disabled selected>-- Pilih Layanan --</option>` + optionsHtml;
}
// 4. Event listener utama saat dokumen siap
document.addEventListener("DOMContentLoaded", () => {
    // Tampilkan data pengguna yang sedang login
    const kioskUserName = document.getElementById("kiosk-user-name");
    const kioskUserRole = document.getElementById("kiosk-user-role");
    if (kioskUserName) {
        kioskUserName.textContent = session.firstName || session.username;
    }
    if (kioskUserRole) {
        kioskUserRole.textContent = session.role.toUpperCase();
        kioskUserRole.className = `badge ${session.role === "admin" || session.role === "moderator"
            ? "badge-primary"
            : "badge-secondary"}`;
    }
    // Tombol Keluar (Logout)
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            if (confirm("Apakah Anda yakin ingin keluar?")) {
                clearSession();
                window.location.href = "login.html";
            }
        });
    }
    // Tautan navigasi sesuai role pengguna
    const navDashboardLink = document.getElementById("nav-dashboard-link");
    if (navDashboardLink) {
        if (session.role === "admin" || session.role === "moderator") {
            navDashboardLink.href = "index.html";
            navDashboardLink.textContent = "Dashboard Admin";
        }
        else {
            navDashboardLink.href = "operator.html";
            navDashboardLink.textContent = "Panel Operator";
        }
    }
    renderServiceOptions();
    const formKiosk = document.getElementById("form-kiosk");
    formKiosk?.addEventListener("submit", (e) => {
        e.preventDefault();
        const selectService = document.getElementById("select-service");
        const selectPriority = document.getElementById("select-priority");
        if (!selectService || !selectService.value) {
            alert("Silakan pilih layanan terlebih dahulu!");
            return;
        }
        const serviceCode = selectService.value;
        const priority = (selectPriority?.value || "Normal");
        try {
            const ticket = createTicket(serviceCode, priority);
            // Pengecekan null agar aman dari error TS18047
            if (!ticket) {
                alert("Gagal membuat tiket antrian. Silakan coba lagi.");
                return;
            }
            const resService = document.getElementById("result-service");
            const resNumber = document.getElementById("result-number");
            const resPriority = document.getElementById("result-priority");
            const resultBox = document.getElementById("kiosk-result");
            if (resService)
                resService.textContent = `${ticket.serviceName} (${ticket.serviceCode})`;
            if (resNumber)
                resNumber.textContent = ticket.ticketNumber;
            if (resPriority)
                resPriority.textContent = ticket.priority;
            if (resultBox)
                resultBox.style.display = "block";
            // Reset form pilihan ke posisi semula
            selectService.selectedIndex = 0;
            if (selectPriority)
                selectPriority.value = "Normal";
        }
        catch (err) {
            if (err instanceof Error) {
                alert(err.message);
            }
            else {
                alert("Gagal mengambil tiket antrian.");
            }
        }
    });
});
// Real-time update jika Admin mengubah/menambah layanan dari tab sebelah
window.addEventListener("storage", renderServiceOptions);
window.addEventListener("storage_services_updated", renderServiceOptions);
