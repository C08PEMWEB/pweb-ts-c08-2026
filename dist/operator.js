import { getServices, getTickets, saveTickets, STORAGE_KEYS } from "./utils/storage.js";
import { requireAuth, setupNavbar } from "./utils/guard.js";
import { callNext, finishCurrent, getCurrentlyCalledTicket, getNextTicket, getWaitingCount, skipCurrent, } from "./utils/queue.js";
// Auth Guard: operator hanya boleh dibuka oleh yang sudah login
const session = requireAuth(["admin", "moderator", "user"]);
setupNavbar(session);
const operatorContainer = document.getElementById("operator-container");
/**
 * Render dasar antrian operator (starter skeleton)
 */
function renderOperator() {
    if (!operatorContainer)
        return;
    const services = getServices().filter((s) => s.isActive);
    const tickets = getTickets();
    let html = "";
    for (const s of services) {
        const called = getCurrentlyCalledTicket(s.code, tickets);
        const next = getNextTicket(s.code, tickets);
        html += `
      <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
    <h3>${escapeHtml(s.name)} (${escapeHtml(s.code)})</h3>
    <p>Sedang Dipanggil: <strong>${called ? escapeHtml(called.ticketNumber) : "-"}</strong></p>
    <p>Berikutnya (Prioritas): <strong>${next ? escapeHtml(next.ticketNumber + " (" + next.priority + ")") : "-"}</strong></p>
    <p>Jumlah Menunggu: <strong>${getWaitingCount(s.code, tickets)}</strong></p>
    <button data-action="call" data-code="${escapeHtml(s.code)}">Panggil Berikutnya</button>
    <button data-action="finish" data-code="${escapeHtml(s.code)}">Selesai</button>
    <button data-action="skip" data-code="${escapeHtml(s.code)}">Lewati</button>
      </div>
    `;
    }
    operatorContainer.innerHTML = html;
}
if (operatorContainer) {
    operatorContainer.addEventListener("click", (e) => {
        if (!(e.target instanceof HTMLButtonElement))
            return;
        const target = e.target;
        const action = target.dataset["action"];
        const serviceCode = target.dataset["code"];
        if (!serviceCode)
            return;
        const tickets = getTickets();
        const now = new Date().toISOString();
        let updatedTickets = tickets;
        if (action === "call")
            updatedTickets = callNext(serviceCode, tickets, now);
        else if (action === "finish")
            updatedTickets = finishCurrent(serviceCode, tickets, now);
        else if (action === "skip")
            updatedTickets = skipCurrent(serviceCode, tickets, now);
        else
            return;
        saveTickets(updatedTickets);
        renderOperator();
    });
}
window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEYS.TICKETS || event.key === STORAGE_KEYS.SERVICES) {
        renderOperator();
    }
});
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
// Inisialisasi awal
renderOperator();
