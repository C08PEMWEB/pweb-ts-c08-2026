export const STORAGE_KEYS = {
    SESSION: "rs_auth_session",
    SERVICES: "rs_queue_services",
    TICKETS: "rs_queue_tickets",
};
// Seed data awal jika localStorage masih kosong
const DEFAULT_SERVICES = [
    { id: "srv-a", code: "A", name: "Umum-1", isActive: true, createdAt: "2026-10-11T08:00:00.000Z" },
    { id: "srv-b", code: "B", name: "Umum-2", isActive: true, createdAt: "2026-10-11T08:00:00.000Z" },
    { id: "srv-c", code: "C", name: "Umum-3", isActive: true, createdAt: "2026-10-11T08:00:00.000Z" },
    { id: "srv-g", code: "G", name: "Gigi", isActive: true, createdAt: "2026-10-11T08:00:00.000Z" },
    { id: "srv-f", code: "F", name: "Farmasi", isActive: true, createdAt: "2026-10-11T08:00:00.000Z" },
    { id: "srv-p", code: "P", name: "Psikolog", isActive: true, createdAt: "2026-10-11T08:00:00.000Z" },
];
/**
 * Validasi runtime aman untuk objek AuthSession dari localStorage (unknown -> AuthSession | null)
 */
export function getSession() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) ?? "null");
        if (typeof raw === "object" &&
            raw !== null &&
            "token" in raw &&
            "role" in raw &&
            "firstName" in raw &&
            "username" in raw &&
            typeof raw.token === "string" &&
            typeof raw.role === "string" &&
            typeof raw.firstName === "string" &&
            typeof raw.username === "string") {
            const roleStr = raw.role.toLowerCase();
            const role = (roleStr === "admin" || roleStr === "moderator" ? roleStr : "user");
            return {
                token: raw.token,
                role,
                firstName: raw.firstName,
                username: raw.username,
            };
        }
    }
    catch {
        // Abaikan parse error, kembalikan null
    }
    return null;
}
export function saveSession(session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}
export function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
}
/**
 * Validasi runtime aman untuk daftar master jenis antrian
 */
export function getServices() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) ?? "null");
        if (Array.isArray(raw)) {
            const validated = [];
            for (const item of raw) {
                if (typeof item === "object" &&
                    item !== null &&
                    "id" in item &&
                    "code" in item &&
                    "name" in item &&
                    "isActive" in item &&
                    "createdAt" in item &&
                    typeof item.id === "string" &&
                    typeof item.code === "string" &&
                    typeof item.name === "string" &&
                    typeof item.isActive === "boolean" &&
                    typeof item.createdAt === "string") {
                    validated.push({
                        id: item.id,
                        code: item.code.toUpperCase(),
                        name: item.name,
                        isActive: item.isActive,
                        createdAt: item.createdAt,
                    });
                }
            }
            if (validated.length > 0)
                return validated;
        }
    }
    catch {
        // Abaikan jika rusak, fallback ke default
    }
    // Jika belum ada di localStorage, simpan default services
    saveServices(DEFAULT_SERVICES);
    return DEFAULT_SERVICES;
}
export function saveServices(services) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    window.dispatchEvent(new Event("storage_services_updated"));
}
/**
 * Menambah Jenis Antrian baru dengan validasi 1 huruf kapital & nama unik (case-insensitive)
 */
export function addService(code, name) {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    // Validasi format kode: tepat 1 huruf alfabet kapital
    if (!/^[A-Z]$/.test(cleanCode)) {
        return { success: false, message: "Kode harus berupa 1 huruf kapital alfabet (A-Z)!" };
    }
    if (cleanName.length < 2) {
        return { success: false, message: "Nama layanan minimal 2 karakter!" };
    }
    const currentServices = getServices();
    // Cek duplikasi kode (case-insensitive)
    const isCodeDuplicate = currentServices.some((s) => s.code.toUpperCase() === cleanCode);
    if (isCodeDuplicate) {
        return { success: false, message: `Kode '${cleanCode}' sudah digunakan! Gunakan huruf lain.` };
    }
    // Cek duplikasi nama (case-insensitive)
    const isNameDuplicate = currentServices.some((s) => s.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (isNameDuplicate) {
        return { success: false, message: `Nama layanan '${cleanName}' sudah ada!` };
    }
    const newService = {
        id: `srv-${Date.now()}-${cleanCode.toLowerCase()}`,
        code: cleanCode,
        name: cleanName,
        isActive: true,
        createdAt: new Date().toISOString(),
    };
    currentServices.push(newService);
    saveServices(currentServices);
    return { success: true, service: newService };
}
/**
 * Mengubah status aktif / nonaktif suatu jenis antrian
 */
export function toggleServiceStatus(id) {
    const services = getServices();
    const target = services.find((s) => s.id === id);
    if (!target)
        return false;
    target.isActive = !target.isActive;
    saveServices(services);
    return true;
}
/**
 * Menghapus suatu jenis antrian
 */
export function deleteService(id) {
    const services = getServices();
    const target = services.find((s) => s.id === id);
    if (!target)
        return false;
    const filtered = services.filter((s) => s.id !== id);
    saveServices(filtered);
    // Bersihkan juga tiket terkait layanan ini agar tidak terjadi orphan data
    const tickets = getTickets().filter((t) => t.serviceCode !== target.code);
    saveTickets(tickets);
    return true;
}
/**
 * Validasi runtime aman untuk tiket antrian
 */
export function getTickets() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS) ?? "null");
        if (Array.isArray(raw)) {
            const validated = [];
            for (const item of raw) {
                if (typeof item === "object" &&
                    item !== null &&
                    "id" in item &&
                    "ticketNumber" in item &&
                    "serviceCode" in item &&
                    "priority" in item &&
                    "status" in item &&
                    typeof item.id === "string" &&
                    typeof item.ticketNumber === "string" &&
                    typeof item.serviceCode === "string") {
                    validated.push(item);
                }
            }
            return validated;
        }
    }
    catch {
        // Abaikan
    }
    return [];
}
export function saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new Event("storage_tickets_updated"));
}
/**
 * Membuat nomor tiket baru format Kode-Nomor 3 Digit (contoh: A-001, B-012)
 */
export function createTicket(serviceCode, priority) {
    const services = getServices();
    const service = services.find((s) => s.code.toUpperCase() === serviceCode.toUpperCase() && s.isActive);
    if (!service) {
        return null;
    }
    const allTickets = getTickets();
    // Hitung jumlah tiket untuk layanan ini untuk menentukan sequenceNumber
    const ticketsForService = allTickets.filter((t) => t.serviceCode === service.code);
    const nextSeq = ticketsForService.length + 1;
    const seqStr = String(nextSeq).padStart(3, "0");
    const ticketNumber = `${service.code}-${seqStr}`;
    const newTicket = {
        id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ticketNumber,
        sequenceNumber: nextSeq,
        serviceCode: service.code,
        serviceName: service.name,
        priority,
        status: "menunggu",
        createdAt: new Date().toISOString(),
    };
    allTickets.push(newTicket);
    saveTickets(allTickets);
    return newTicket;
}
/**
 * Reset Antrian: Mengosongkan seluruh antrian aktif dan mengembalikan urutan tiket ke awal
 */
export function resetAllTickets() {
    saveTickets([]);
}
