import { getServices, getTickets } from "./utils/storage.js";
import { getCurrentlyCalledTicket, getWaitingCount } from "./utils/queue.js";

const monitorList = document.getElementById("monitor-list");
const btnFullscreen = document.getElementById("btn-fullscreen");

/**
 * Render daftar monitor antrian sederhana (starter skeleton)
 */
function renderMonitor(): void {
  if (!monitorList) return;

  const services = getServices().filter((s) => s.isActive);
  const tickets = getTickets();

  let html = "<ul>";
  for (const s of services) {
    const called = getCurrentlyCalledTicket(s.code, tickets);
    const waiting = getWaitingCount(s.code, tickets);

    html += `
      <li>
        <strong>${s.name} (${s.code}):</strong> 
        Nomor Dipanggil: ${called ? called.ticketNumber : "(Belum ada)"} 
        | Sisa Menunggu: ${waiting}
      </li>
    `;
  }
  html += "</ul>";

  monitorList.innerHTML = html;
}

if (btnFullscreen) {
  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
}

// Inisialisasi awal
renderMonitor();

// Polling sederhana
setInterval(renderMonitor, 2500);
