import { getServices, createTicket } from "./utils/storage.js";
// DOM Elements dasar
const selectService = document.getElementById("select-service");
const selectPriority = document.getElementById("select-priority");
const formKiosk = document.getElementById("form-kiosk");
const kioskResult = document.getElementById("kiosk-result");
const resultService = document.getElementById("result-service");
const resultNumber = document.getElementById("result-number");
const resultPriority = document.getElementById("result-priority");
/**
 * Muat daftar layanan aktif ke dropdown
 */
function loadServiceOptions() {
    if (!selectService)
        return;
    const services = getServices().filter((s) => s.isActive);
    let optionsHtml = '<option value="" disabled selected>-- Pilih Layanan --</option>';
    for (const s of services) {
        optionsHtml += `<option value="${s.code}">${s.name} (${s.code})</option>`;
    }
    selectService.innerHTML = optionsHtml;
}
if (formKiosk) {
    formKiosk.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!selectService || !selectPriority)
            return;
        const code = selectService.value;
        const priority = selectPriority.value;
        if (!code) {
            alert("Pilih layanan terlebih dahulu!");
            return;
        }
        const ticket = createTicket(code, priority);
        if (ticket && kioskResult && resultService && resultNumber && resultPriority) {
            resultService.textContent = ticket.serviceName;
            resultNumber.textContent = ticket.ticketNumber;
            resultPriority.textContent = ticket.priority;
            kioskResult.style.display = "block";
        }
    });
}
// Inisialisasi awal
loadServiceOptions();
