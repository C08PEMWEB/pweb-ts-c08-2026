import type { AuthSession } from "./types/index.js";
import { getServices, getTickets, saveTickets } from "./utils/storage.js";
import { requireAuth, setupNavbar } from "./utils/guard.js";
import {
  callNext,
  finishCurrent,
  getCurrentlyCalledTicket,
  getNextTicket,
  getWaitingCount,
  skipCurrent,
} from "./utils/queue.js";

// Nilai key harus sama dengan konstanta KEYS di storage.ts.
const TICKETS_KEY = "rs_queue_tickets";
const SERVICES_KEY = "rs_queue_services";

// Auth Guard: operator hanya boleh dibuka oleh yang sudah login
const session: AuthSession = requireAuth(["admin", "moderator", "user"]);
setupNavbar(session);

const operatorContainer = document.getElementById("operator-container");

/**
 * Render dasar antrian operator (starter skeleton)
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderOperator(): void {
  if (!operatorContainer) return;

  const services = getServices().filter((s) => s.isActive);
  const tickets = getTickets();

  let html = "";
  for (const s of services) {
    const called = getCurrentlyCalledTicket(s.code, tickets);
    const next = getNextTicket(s.code, tickets);
    const code = escapeHtml(s.code);

    html += `
      <div class="card operator-card">
        <div class="card-header">
          <span class="card-title">
            <span class="service-code-badge">${code}</span>
            ${escapeHtml(s.name)}
          </span>
        </div>
        <div class="card-body">
          <div class="operator-now ${called ? "is-active" : ""}">
            <span class="operator-label">Sedang Dipanggil</span>
            <span class="operator-ticket">${called ? escapeHtml(called.ticketNumber) : "-"}</span>
          </div>
          <div class="operator-next">
            <span class="operator-label">Berikutnya</span>
            ${
              next
                ? `<strong class="ticket-num">${escapeHtml(next.ticketNumber)}</strong>
                   <span class="badge badge-${next.priority.toLowerCase()}">${escapeHtml(next.priority)}</span>`
                : `<span class="text-muted">-</span>`
            }
          </div>
          <div class="operator-stats">
            <span>Menunggu: <strong>${getWaitingCount(s.code, tickets)}</strong></span>
          </div>
          <div class="operator-actions">
            <button class="btn btn-primary" data-action="call" data-code="${code}">Panggil Berikutnya</button>
            <button class="btn" data-action="finish" data-code="${code}">Selesai</button>
            <button class="btn btn-danger-outline" data-action="skip" data-code="${code}">Lewati</button>
          </div>
        </div>
      </div>
    `;
  }

  operatorContainer.innerHTML = html;
}

if (operatorContainer) {
  operatorContainer.addEventListener("click", (e) => {
    if (!(e.target instanceof HTMLButtonElement)) return;
    const target = e.target;

    const action = target.dataset["action"];
    const serviceCode = target.dataset["code"];
    if (!serviceCode) return;

    const tickets = getTickets();
    const now = new Date().toISOString();
    let updatedTickets = tickets;

    if (action === "call") updatedTickets = callNext(serviceCode, tickets, now);
    else if (action === "finish") updatedTickets = finishCurrent(serviceCode, tickets, now);
    else if (action === "skip") updatedTickets = skipCurrent(serviceCode, tickets, now);
    else return;

    saveTickets(updatedTickets);

    renderOperator();
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === TICKETS_KEY || event.key === SERVICES_KEY) {
    renderOperator();
  }
});

// Inisialisasi awal
renderOperator();
