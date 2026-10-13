import type { AuthSession, QueueService, Ticket, PriorityLevel } from "../types/index.js";

export const STORAGE_KEYS = {
  SESSION: "rs_auth_session",
  SERVICES: "rs_queue_services",
  TICKETS: "rs_queue_tickets",
} as const;

const DEFAULT_SERVICES: QueueService[] = [
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
export function getSession(): AuthSession | null {
  try {
    const rawStr =
      localStorage.getItem(STORAGE_KEYS.SESSION) ??
      localStorage.getItem("rs_queue_session");
    if (!rawStr) return null;

    const raw: unknown = JSON.parse(rawStr);
    if (
      typeof raw === "object" &&
      raw !== null &&
      "token" in raw &&
      "role" in raw &&
      "firstName" in raw &&
      "username" in raw &&
      typeof (raw as { token: unknown }).token === "string" &&
      typeof (raw as { role: unknown }).role === "string" &&
      typeof (raw as { firstName: unknown }).firstName === "string" &&
      typeof (raw as { username: unknown }).username === "string"
    ) {
      const roleVal = (raw as { role: string }).role;
      const validRole =
        roleVal === "admin" || roleVal === "moderator" || roleVal === "user"
          ? roleVal
          : "user";
      return {
        token: (raw as { token: string }).token,
        role: validRole,
        firstName: (raw as { firstName: string }).firstName,
        username: (raw as { username: string }).username,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem("rs_queue_session");
}

// --- Master Service Management ---
export function getServices(): QueueService[] {
  const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
  if (!data) {
    saveServices(DEFAULT_SERVICES);
    return DEFAULT_SERVICES;
  }
  try {
    const raw: unknown = JSON.parse(data);
    if (Array.isArray(raw)) {
      const validated: QueueService[] = [];
      for (const item of raw) {
        if (
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          "code" in item &&
          "name" in item &&
          "isActive" in item &&
          "createdAt" in item &&
          typeof (item as { id: unknown }).id === "string" &&
          typeof (item as { code: unknown }).code === "string" &&
          typeof (item as { name: unknown }).name === "string" &&
          typeof (item as { isActive: unknown }).isActive === "boolean" &&
          typeof (item as { createdAt: unknown }).createdAt === "string"
        ) {
          validated.push({
            id: (item as { id: string }).id,
            code: (item as { code: string }).code.toUpperCase(),
            name: (item as { name: string }).name,
            isActive: (item as { isActive: boolean }).isActive,
            createdAt: (item as { createdAt: string }).createdAt,
          });
        }
      }
      return validated;
    }
  } catch {
    return [];
  }
  return [];
}

export function saveServices(services: QueueService[]): void {
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  window.dispatchEvent(new Event("storage_services_updated"));
}

export function addService(
  code: string,
  name: string
): { success: boolean; message?: string; service?: QueueService } {
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

  const newService: QueueService = {
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

export function toggleServiceStatus(id: string): boolean {
  const services = getServices();
  const target = services.find((s) => s.id === id);
  if (!target) return false;

  target.isActive = !target.isActive;
  saveServices(services);
  return true;
}

export function deleteService(id: string): boolean {
  const services = getServices();
  const target = services.find((s) => s.id === id);
  if (!target) return false;

  const filtered = services.filter((s) => s.id !== id);
  saveServices(filtered);

  // Bersihkan tiket terkait layanan yang dihapus agar tidak menyisakan orphan data
  const tickets = getTickets().filter((t) => t.serviceCode !== target.code);
  saveTickets(tickets);

  return true;
}

// --- Ticket Management ---
export function getTickets(): Ticket[] {
  const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
  if (!data) return [];
  try {
    const raw: unknown = JSON.parse(data);
    if (Array.isArray(raw)) {
      const validated: Ticket[] = [];
      for (const item of raw) {
        if (
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          "ticketNumber" in item &&
          "serviceCode" in item &&
          "priority" in item &&
          "status" in item &&
          typeof (item as { id: unknown }).id === "string" &&
          typeof (item as { ticketNumber: unknown }).ticketNumber === "string" &&
          typeof (item as { serviceCode: unknown }).serviceCode === "string"
        ) {
          validated.push(item as Ticket);
        }
      }
      return validated;
    }
  } catch {
    return [];
  }
  return [];
}

export function saveTickets(tickets: Ticket[]): void {
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  window.dispatchEvent(new Event("storage_tickets_updated"));
}

export function createTicket(
  serviceCode: string,
  priority: PriorityLevel = "Normal"
): Ticket | null {
  const services = getServices();
  const service = services.find(
    (s) => s.code.toUpperCase() === serviceCode.toUpperCase() && s.isActive
  );
  if (!service) return null;

  const tickets = getTickets();
  const serviceTickets = tickets.filter((t) => t.serviceCode === service.code);
  const nextNum = serviceTickets.length + 1;
  const formattedNum = String(nextNum).padStart(3, "0");

  const newTicket: Ticket = {
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

export function resetAllTickets(): void {
  saveTickets([]);
}