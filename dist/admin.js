import { getServices, addService, toggleServiceStatus, deleteService, getTickets, saveTickets, createTicket, resetAllTickets } from "./utils/storage.js";
import { requireAuth, setupNavbar } from "./utils/guard.js";
import { sortTicketsByPriority, getWaitingCount } from "./utils/queue.js";
// 1. Eksekusi Auth Guard & Role Guard untuk halaman Admin
let currentSession;
try {
    currentSession = requireAuth(["admin", "moderator"]);
}
catch {
    // Pengalihan sudah ditangani di requireAuth
    throw new Error("Akses tidak diizinkan.");
}
// Inisialisasi DOM Elements
const alertContainer = document.getElementById("alert-container");
const serviceListContainer = document.getElementById("service-list-container");
const selectTicketService = document.getElementById("select-ticket-service");
const formAddService = document.getElementById("form-add-service");
const formCreateTicket = document.getElementById("form-create-ticket");
const queueOverviewContainer = document.getElementById("queue-overview-container");
const btnResetAntrian = document.getElementById("btn-reset-antrian");
const totalTicketsInfo = document.getElementById("total-tickets-info");
/**
 * Menampilkan pesan alert visual
 */
function showAlert(message, type = "success") {
    if (!alertContainer)
        return;
    alertContainer.innerHTML = `
    <div class="alert alert-${type}">
      <span>${message}</span>
      <button class="btn btn-sm btn-link" style="color: inherit; text-decoration: none;" onclick="this.parentElement.remove()">✕</button>
    </div>
  `;
    setTimeout(() => {
        if (alertContainer.firstElementChild) {
            alertContainer.firstElementChild.remove();
        }
    }, 4000);
}
/**
 * Render daftar master jenis antrian di panel kiri
 */
function renderServices() {
    if (!serviceListContainer)
        return;
    const services = getServices();
    const tickets = getTickets();
    if (services.length === 0) {
        serviceListContainer.innerHTML = `
      <p class="text-sm text-center" style="padding: 1.5rem 0;">Belum ada jenis antrian. Tambahkan layanan baru di atas.</p>
    `;
        updateTicketServiceSelect(services);
        return;
    }
    let html = "";
    for (const s of services) {
        const waitingCount = getWaitingCount(s.code, tickets);
        const inactiveClass = !s.isActive ? "service-inactive" : "";
        const statusText = s.isActive ? "Nonaktifkan" : "Aktifkan";
        html += `
      <div class="service-item ${inactiveClass}">
        <div class="service-item-info">
          <div class="service-item-title-row">
            <span class="service-code-badge">${s.code}</span>
            <span class="service-item-title">${s.name}</span>
          </div>
          <span class="service-item-subtitle">${waitingCount} menunggu • ${s.isActive ? "Aktif" : "Nonaktif"}</span>
        </div>
        <div class="service-item-actions">
          <button 
            type="button" 
            class="btn btn-sm" 
            data-action="toggle" 
            data-id="${s.id}"
          >
            ${statusText}
          </button>
          <button 
            type="button" 
            class="btn btn-danger-outline btn-sm" 
            data-action="delete" 
            data-id="${s.id}"
            data-name="${s.name}"
          >
            Hapus
          </button>
        </div>
      </div>
    `;
    }
    serviceListContainer.innerHTML = html;
    updateTicketServiceSelect(services);
}
/**
 * Update pilihan jenis antrian pada form penerbitan manual
 */
function updateTicketServiceSelect(services) {
    if (!selectTicketService)
        return;
    const activeServices = services.filter((s) => s.isActive);
    const currentVal = selectTicketService.value;
    let optionsHtml = '<option value="" disabled selected>Pilih jenis antrian</option>';
    for (const s of activeServices) {
        const selected = currentVal === s.code ? "selected" : "";
        optionsHtml += `<option value="${s.code}" ${selected}>${s.name} (${s.code})</option>`;
    }
    selectTicketService.innerHTML = optionsHtml;
}
/**
 * Render overview antrian di panel kanan (dikelompokkan per jenis antrian)
 */
function renderQueueOverview() {
    if (!queueOverviewContainer)
        return;
    const services = getServices();
    const tickets = getTickets();
    if (totalTicketsInfo) {
        totalTicketsInfo.textContent = `${tickets.length} Tiket Terdaftar`;
    }
    if (services.length === 0) {
        queueOverviewContainer.innerHTML = '<p class="text-sm text-center">Belum ada data layanan.</p>';
        return;
    }
    let html = "";
    for (const s of services) {
        const serviceTickets = tickets.filter((t) => t.serviceCode === s.code);
        const waitingTickets = sortTicketsByPriority(serviceTickets.filter((t) => t.status === "menunggu"));
        const calledTicket = serviceTickets.find((t) => t.status === "dipanggil");
        // Gabungkan tiket aktif (dipanggil) dan tiket menunggu untuk ditampilkan
        const activeList = [];
        if (calledTicket)
            activeList.push(calledTicket);
        activeList.push(...waitingTickets);
        html += `
      <div class="queue-group">
        <div class="queue-group-title">
          <span>${s.name} (${s.code})</span>
          <span class="text-xs text-muted" style="font-weight: 500;">
            ${activeList.length > 0 ? activeList.length + " antrian" : "Kosong"}
          </span>
        </div>
    `;
        if (activeList.length === 0) {
            html += `
        <div class="queue-empty-state">
          Tidak ada antrian aktif saat ini.
        </div>
      `;
        }
        else {
            for (const t of activeList) {
                const isCalling = t.status === "dipanggil";
                const badgePriorityClass = `badge-${t.priority.toLowerCase()}`;
                const statusLabel = isCalling ? "Dipanggil" : "Menunggu";
                html += `
          <div class="ticket-item ${isCalling ? "status-dipanggil" : ""}">
            <div class="ticket-item-left">
              ${isCalling
                    ? `<svg height="14" width="14" viewBox="0 0 16 16" fill="var(--gh-success-fg)" title="Sedang Dipanggil"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>`
                    : `<svg height="14" width="14" viewBox="0 0 16 16" fill="var(--gh-fg-muted)" title="Menunggu"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25a.75.75 0 0 0-1.5 0v3.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 0-1.5H8.5V4.75Z"></path></svg>`}
              <span class="ticket-num">#${t.ticketNumber}</span>
              <span class="badge ${badgePriorityClass}">${t.priority}</span>
              <span class="badge ${isCalling ? "badge-success" : "badge-secondary"}">${statusLabel}</span>
            </div>
            <div class="ticket-item-actions">
              ${isCalling
                    ? `<button class="btn btn-sm" data-action="ticket-finish" data-ticket-id="${t.id}">Selesai</button>`
                    : `<button class="btn btn-sm" data-action="ticket-call" data-ticket-id="${t.id}">Panggil</button>
                     <button class="btn btn-sm" data-action="ticket-skip" data-ticket-id="${t.id}">Lewati</button>`}
            </div>
          </div>
        `;
            }
        }
        html += `</div>`;
    }
    queueOverviewContainer.innerHTML = html;
}
/**
 * Handle form penambahan jenis antrian baru
 */
if (formAddService) {
    formAddService.addEventListener("submit", (e) => {
        e.preventDefault();
        const codeInput = document.getElementById("input-service-code");
        const nameInput = document.getElementById("input-service-name");
        if (!codeInput || !nameInput)
            return;
        const code = codeInput.value.trim().toUpperCase();
        const name = nameInput.value.trim();
        const result = addService(code, name);
        if (!result.success) {
            showAlert(result.message ?? "Gagal menambahkan layanan.", "danger");
            return;
        }
        showAlert(`Layanan <strong>${name} (${code})</strong> berhasil ditambahkan!`, "success");
        codeInput.value = "";
        nameInput.value = "";
        codeInput.focus();
        renderServices();
        renderQueueOverview();
    });
}
/**
 * Handle event delegasi pada daftar layanan (Toggle Aktif & Hapus)
 */
if (serviceListContainer) {
    serviceListContainer.addEventListener("click", (e) => {
        const target = e.target;
        const btn = target.closest("button");
        if (!btn)
            return;
        const action = btn.dataset["action"];
        const id = btn.dataset["id"];
        if (!id || !action)
            return;
        if (action === "toggle") {
            toggleServiceStatus(id);
            renderServices();
            renderQueueOverview();
        }
        else if (action === "delete") {
            const name = btn.dataset["name"] ?? "layanan ini";
            if (confirm(`Apakah Anda yakin ingin menghapus layanan "${name}"? Seluruh antrian terkait akan tetap dipertahankan.`)) {
                deleteService(id);
                showAlert(`Layanan "${name}" berhasil dihapus.`, "success");
                renderServices();
                renderQueueOverview();
            }
        }
    });
}
/**
 * Handle form penerbitan tiket manual dari dashboard admin
 */
if (formCreateTicket) {
    formCreateTicket.addEventListener("submit", (e) => {
        e.preventDefault();
        const serviceSelect = document.getElementById("select-ticket-service");
        const prioritySelect = document.getElementById("select-ticket-priority");
        if (!serviceSelect || !prioritySelect)
            return;
        const serviceCode = serviceSelect.value;
        const priority = prioritySelect.value;
        if (!serviceCode) {
            showAlert("Pilih jenis antrian terlebih dahulu!", "danger");
            return;
        }
        const newTicket = createTicket(serviceCode, priority);
        if (!newTicket) {
            showAlert("Gagal menerbitkan tiket. Layanan mungkin nonaktif.", "danger");
            return;
        }
        showAlert(`Tiket <strong>${newTicket.ticketNumber}</strong> (${newTicket.priority}) berhasil diterbitkan!`, "success");
        renderServices();
        renderQueueOverview();
    });
}
/**
 * Handle aksi kontrol cepat tiket dari overview admin (Panggil, Lewati, Selesai)
 */
if (queueOverviewContainer) {
    queueOverviewContainer.addEventListener("click", (e) => {
        const target = e.target;
        const btn = target.closest("button");
        if (!btn)
            return;
        const action = btn.dataset["action"];
        const ticketId = btn.dataset["ticketId"];
        if (!action || !ticketId)
            return;
        const tickets = getTickets();
        const ticket = tickets.find((t) => t.id === ticketId);
        if (!ticket)
            return;
        if (action === "ticket-call") {
            // Selesaikan tiket yang sedang dipanggil sebelumnya pada layanan yang sama jika ada
            tickets.forEach((t) => {
                if (t.serviceCode === ticket.serviceCode && t.status === "dipanggil") {
                    t.status = "selesai";
                    t.completedAt = new Date().toISOString();
                }
            });
            ticket.status = "dipanggil";
            ticket.calledAt = new Date().toISOString();
            saveTickets(tickets);
            showAlert(`Nomor ${ticket.ticketNumber} sedang dipanggil.`, "success");
        }
        else if (action === "ticket-finish") {
            ticket.status = "selesai";
            ticket.completedAt = new Date().toISOString();
            saveTickets(tickets);
            showAlert(`Nomor ${ticket.ticketNumber} selesai dilayani.`, "success");
        }
        else if (action === "ticket-skip") {
            ticket.status = "dilewati";
            saveTickets(tickets);
            showAlert(`Nomor ${ticket.ticketNumber} ditandai dilewati.`, "warning");
        }
        renderServices();
        renderQueueOverview();
    });
}
/**
 * Handle tombol Reset Antrian
 */
if (btnResetAntrian) {
    btnResetAntrian.addEventListener("click", () => {
        const confirmation = confirm("PERINGATAN: Apakah Anda yakin ingin mereset seluruh antrian?\nSemua antrian aktif akan dikosongkan dan nomor urut tiket akan kembali ke awal (001).");
        if (confirmation) {
            resetAllTickets();
            showAlert("Seluruh antrian berhasil di-reset ke awal!", "success");
            renderServices();
            renderQueueOverview();
        }
    });
}
// Inisialisasi awal UI
setupNavbar(currentSession);
renderServices();
renderQueueOverview();
// Dropdown menu profil pengguna di navigator kiri
const btnProfileToggle = document.getElementById("btn-profile-toggle");
const profileDropdownMenu = document.getElementById("profile-dropdown-menu");
if (btnProfileToggle && profileDropdownMenu) {
    btnProfileToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        profileDropdownMenu.classList.toggle("show");
    });
    // Tutup dropdown saat klik di luar area
    document.addEventListener("click", (e) => {
        const target = e.target;
        if (!profileDropdownMenu.contains(target) && !btnProfileToggle.contains(target)) {
            profileDropdownMenu.classList.remove("show");
        }
    });
}
// Real-time synchronization saat ada perubahan di tab/jendela browser lain
window.addEventListener("storage", () => {
    renderServices();
    renderQueueOverview();
});
window.addEventListener("storage_services_updated", () => {
    renderServices();
});
window.addEventListener("storage_tickets_updated", () => {
    renderServices();
    renderQueueOverview();
});
