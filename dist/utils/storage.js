const KEYS = {
    SESSION: "rs_queue_session",
    SERVICES: "rs_queue_services",
    TICKETS: "rs_queue_tickets",
};
// --- Session Management ---
export function getSession() {
    const data = localStorage.getItem(KEYS.SESSION);
    if (!data)
        return null;
    try {
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
export function saveSession(session) {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
}
export function clearSession() {
    localStorage.removeItem(KEYS.SESSION);
}
// --- Master Service Management ---
export function getServices() {
    const data = localStorage.getItem(KEYS.SERVICES);
    if (!data) {
        const defaultServices = [
            { id: "1", code: "A", name: "UMUM-1", isActive: true, createdAt: new Date().toISOString() },
            { id: "2", code: "B", name: "UMUM-2", isActive: true, createdAt: new Date().toISOString() },
        ];
        saveServices(defaultServices);
        return defaultServices;
    }
    try {
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
export function saveServices(services) {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
    window.dispatchEvent(new Event("storage_services_updated"));
}
export function addService(code, name) {
    const services = getServices();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (services.some((s) => s.code.toUpperCase() === cleanCode)) {
        return { success: false, message: "Kode layanan sudah digunakan!" };
    }
    if (services.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
        return { success: false, message: "Nama layanan sudah digunakan!" };
    }
    const newService = {
        id: Date.now().toString(),
        code: cleanCode,
        name: cleanName,
        isActive: true,
        createdAt: new Date().toISOString(),
    };
    services.push(newService);
    saveServices(services);
    return { success: true };
}
export function toggleServiceStatus(id) {
    const services = getServices();
    const index = services.findIndex((s) => s.id === id);
    if (index !== -1 && services[index]) {
        services[index].isActive = !services[index].isActive;
        saveServices(services);
    }
}
export function deleteService(id) {
    const services = getServices().filter((s) => s.id !== id);
    saveServices(services);
}
// --- Ticket Management ---
export function getTickets() {
    const data = localStorage.getItem(KEYS.TICKETS);
    if (!data)
        return [];
    try {
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
export function saveTickets(tickets) {
    localStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new Event("storage_tickets_updated"));
}
export function createTicket(serviceCode, priority = "Normal") {
    const services = getServices();
    const service = services.find((s) => s.code === serviceCode && s.isActive);
    if (!service)
        return null;
    const tickets = getTickets();
    const serviceTickets = tickets.filter((t) => t.serviceCode === serviceCode);
    const nextNum = serviceTickets.length + 1;
    const formattedNum = String(nextNum).padStart(3, "0");
    const newTicket = {
        id: Date.now().toString(),
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
    localStorage.removeItem(KEYS.TICKETS);
    window.dispatchEvent(new Event("storage_tickets_updated"));
}
