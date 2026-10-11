import { getServices, getTickets, saveTickets } from "./utils/storage.js";
import { requireAuth, setupNavbar } from "./utils/guard.js";
import { getCurrentlyCalledTicket, getNextTicket } from "./utils/queue.js";
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
        <h3>${s.name} (${s.code})</h3>
        <p>Sedang Dipanggil: <strong>${called ? called.ticketNumber : "-"}</strong></p>
        <p>Berikutnya (Prioritas): <strong>${next ? next.ticketNumber + " (" + next.priority + ")" : "-"}</strong></p>
        <button data-action="call" data-code="${s.code}">Panggil Berikutnya</button>
      </div>
    `;
    }
    operatorContainer.innerHTML = html;
}
if (operatorContainer) {
    operatorContainer.addEventListener("click", (e) => {
        const target = e.target;
        if (target.tagName !== "BUTTON")
            return;
        const action = target.dataset["action"];
        const serviceCode = target.dataset["code"];
        if (action !== "call" || !serviceCode)
            return;
        const tickets = getTickets();
        const called = getCurrentlyCalledTicket(serviceCode, tickets);
        if (called) {
            called.status = "selesai";
        }
        const next = getNextTicket(serviceCode, tickets);
        if (next) {
            next.status = "dipanggil";
            next.calledAt = new Date().toISOString();
            saveTickets(tickets);
        }
        renderOperator();
    });
}
// Inisialisasi awal
renderOperator();
