import type { AuthSession, QueueService, PriorityLevel } from "./types/index.js";
import { getServices, createTicket } from "./utils/storage.js";
import { requireAuth, setupNavbar } from "./utils/guard.js";

// 1. Auth Guard: Seluruh pengguna wajib login untuk ambil antrian (Revisi Modul 3)
const session: AuthSession = requireAuth();
setupNavbar(session, "kiosk");

// 2. Ambil hanya layanan yang berstatus aktif dari storage
function getActiveServices(): QueueService[] {
  const allServices: QueueService[] = getServices();
  return allServices.filter((s: QueueService) => s.isActive);
}

// 3. Render opsi ke dalam elemen <select id="select-service">
function renderServiceOptions(): void {
  const selectEl = document.getElementById("select-service") as HTMLSelectElement | null;
  if (!selectEl) return;

  const services: QueueService[] = getActiveServices();
  const submitBtn = document.getElementById("btn-submit-kiosk") as HTMLButtonElement | null;
  if (submitBtn) submitBtn.disabled = services.length === 0;

  if (services.length === 0) {
    selectEl.innerHTML = `<option value="" disabled selected>-- Belum ada layanan aktif dari Admin --</option>`;
    return;
  }

  const optionsHtml = services
    .map((s: QueueService) => `<option value="${s.code}">Poli ${s.code} - ${s.name}</option>`)
    .join("");

  selectEl.innerHTML = `<option value="" disabled selected>-- Pilih Layanan --</option>` + optionsHtml;
}

// 4. Event listener utama saat dokumen siap
document.addEventListener("DOMContentLoaded", () => {
  renderServiceOptions();

  const formKiosk = document.getElementById("form-kiosk") as HTMLFormElement | null;
  formKiosk?.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();

    const selectService = document.getElementById("select-service") as HTMLSelectElement | null;
    const selectPriority = document.getElementById("select-priority") as HTMLSelectElement | null;

    if (!selectService || !selectService.value) {
      alert("Silakan pilih layanan terlebih dahulu!");
      return;
    }

    const serviceCode: string = selectService.value;
    const priority: PriorityLevel = ((selectPriority?.value as PriorityLevel) || "Normal");

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

      if (resService) resService.textContent = `${ticket.serviceName} (${ticket.serviceCode})`;
      if (resNumber) resNumber.textContent = ticket.ticketNumber;
      if (resPriority) resPriority.textContent = ticket.priority;
      if (resultBox) {
        resultBox.hidden = false;
        resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      // Reset form pilihan ke posisi semula
      selectService.selectedIndex = 0;
      if (selectPriority) selectPriority.value = "Normal";
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Gagal mengambil tiket antrian.");
      }
    }
  });
});

// Real-time update jika Admin mengubah/menambah layanan dari tab sebelah
window.addEventListener("storage", renderServiceOptions);
window.addEventListener("storage_services_updated", renderServiceOptions);