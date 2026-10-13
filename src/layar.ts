import { getServices, getTickets } from "./utils/storage.js";
import { getCurrentlyCalledTicket, getWaitingCount } from "./utils/queue.js";

const monitorList = document.getElementById("monitor-list");
const btnFullscreen = document.getElementById("btn-fullscreen");
const TICKETS_KEY = "rs_queue_tickets";
const SERVICES_KEY = "rs_queue_services";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Render daftar monitor antrian sederhana (starter skeleton)
 */
function renderMonitor(): void {
  if (!monitorList) return;

  const services = getServices().filter((s) => s.isActive);
  const tickets = getTickets();

  let html = "";
  for (const s of services) {
    const called = getCurrentlyCalledTicket(s.code, tickets);
    const waiting = getWaitingCount(s.code, tickets);
    const code = escapeHtml(s.code);
    const name = escapeHtml(s.name);
    const calledNumber = called ? escapeHtml(called.ticketNumber) : "Belum ada";

    html += `
      <article class="card layar-card">
        <header class="card-header">
          <h2 class="card-title">
            <span class="service-code-badge">${code}</span>
            ${name}
          </h2>
        </header>
        <div class="card-body">
          <div class="layar-called">
            <span class="layar-label">Nomor Dipanggil</span>
            <strong class="ticket-num layar-ticket">${calledNumber}</strong>
          </div>
          <div class="layar-waiting">
            <span>Sisa Menunggu</span>
            <span class="badge badge-secondary">${waiting} tiket</span>
          </div>
        </div>
      </article>
    `;
  }

  monitorList.innerHTML = html || '<p class="layar-empty">Belum ada layanan aktif.</p>';
}

if (btnFullscreen) {
  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((error: unknown) => {
        console.error("Tidak dapat membuka layar penuh:", error);
      });
    } else {
      document.exitFullscreen().catch((error: unknown) => {
        console.error("Tidak dapat keluar dari layar penuh:", error);
      });
    }
  });
}

document.addEventListener("fullscreenchange", () => {
  if (btnFullscreen) {
    btnFullscreen.textContent = document.fullscreenElement
      ? "Keluar Layar Penuh"
      : "Layar Penuh";
  }
});

// Inisialisasi awal
renderMonitor();

// Polling sederhana
setInterval(renderMonitor, 2500);

window.addEventListener("storage", (event) => {
  if (event.key === TICKETS_KEY || event.key === SERVICES_KEY) {
    renderMonitor();
  }
});
