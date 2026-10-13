export const STORAGE_KEYS = {
    SESSION: "rs_auth_session",
    SERVICES: "rs_queue_services",
    TICKETS: "rs_queue_tickets",
};
const DEFAULT_SERVICES = [
    {
        id: "srv-default-a",
        code: "A",
        name: "Umum-1",
        isActive: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: "srv-default-b",
        code: "B",
        name: "Umum-2",
        isActive: true,
        createdAt: new Date().toISOString(),
    },
];
// --- Session Management ---
export function getSession() {
    try {
        const rawStr = localStorage.getItem(STORAGE_KEYS.SESSION) ??
            localStorage.getItem("rs_queue_session");
        if (!rawStr)
            return null;
        const raw = JSON.parse(rawStr);
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
            const roleVal = raw.role;
            const validRole = roleVal === "admin" || roleVal === "moderator" || roleVal === "user"
                ? roleVal
                : "user";
            return {
                token: raw.token,
                role: validRole,
                firstName: raw.firstName,
                username: raw.username,
            };
        }
    }
    catch {
        return null;
    }
    return null;
}
export function saveSession(session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}
export function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem("rs_queue_session");
}
// --- Master Service Management ---
export function getServices() {
    const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!data) {
        saveServices(DEFAULT_SERVICES);
        return DEFAULT_SERVICES;
    }
    try {
        const raw = JSON.parse(data);
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
            return validated;
        }
    }
    catch {
        return [];
    }
    return [];
}
export function saveServices(services) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    window.dispatchEvent(new Event("storage_services_updated"));
}
export function addService(code, name) {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (!/^[A-Z]$/.test(cleanCode)) {
        return {
            success: false,
            message: "Kode harus berupa 1 huruf kapital alfabet (A-Z)!",
        };
    }
    if (cleanName.length < 2) {
        return {
            success: false,
            message: "Nama layanan minimal 2 karakter!",
        };
    }
    const services = getServices();
    if (services.some((s) => s.code.toUpperCase() === cleanCode)) {
        return {
            success: false,
            message: `Kode '${cleanCode}' sudah digunakan! Gunakan huruf lain.`,
        };
    }
    if (services.some((s) => s.name.trim().toLowerCase() === cleanName.toLowerCase())) {
        return {
            success: false,
            message: `Nama layanan '${cleanName}' sudah digunakan!`,
        };
    }
    const newService = {
        id: `srv-${Date.now()}-${cleanCode.toLowerCase()}`,
        code: cleanCode,
        name: cleanName,
        isActive: true,
        createdAt: new Date().toISOString(),
    };
    services.push(newService);
    saveServices(services);
    return { success: true, service: newService };
}
export function toggleServiceStatus(id) {
    const services = getServices();
    const target = services.find((s) => s.id === id);
    if (!target)
        return false;
    target.isActive = !target.isActive;
    saveServices(services);
    return true;
}
export function deleteService(id) {
    const services = getServices();
    const target = services.find((s) => s.id === id);
    if (!target)
        return false;
    const filtered = services.filter((s) => s.id !== id);
    saveServices(filtered);
    // Bersihkan tiket terkait layanan yang dihapus agar tidak menyisakan orphan data
    const tickets = getTickets().filter((t) => t.serviceCode !== target.code);
    saveTickets(tickets);
    return true;
}
// --- Ticket Management ---
export function getTickets() {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!data)
        return [];
    try {
        const raw = JSON.parse(data);
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
        return [];
    }
    return [];
}
export function saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new Event("storage_tickets_updated"));
}
export function createTicket(serviceCode, priority = "Normal") {
    const services = getServices();
    const service = services.find((s) => s.code.toUpperCase() === serviceCode.toUpperCase() && s.isActive);
    if (!service)
        return null;
    const tickets = getTickets();
    const serviceTickets = tickets.filter((t) => t.serviceCode === service.code);
    const nextNum = serviceTickets.length + 1;
    const formattedNum = String(nextNum).padStart(3, "0");
    const newTicket = {
        id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sequenceNumber: nextNum,
        serviceCode: service.code,
        serviceName: service.name,
        ticketNumber: `${service.code}-${formattedNum}`,
        priority,
        status: "menunggu",
        createdAt: new Date().toISOString(),
    };
    tickets.push(newTicket);
    saveTickets(tickets);
    return newTicket;
}
export function resetAllTickets() {
    saveTickets([]);
}
