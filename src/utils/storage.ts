import type { AuthSession, QueueService, Ticket, PriorityLevel, TicketStatus } from "../types/index.js";

export const STORAGE_KEYS = {
  SESSION: "rs_auth_session",
  SERVICES: "rs_queue_services",
  TICKETS: "rs_queue_tickets",
} as const;

// Seed data awal jika localStorage masih kosong
const DEFAULT_SERVICES: QueueService[] = [
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
export function getSession(): AuthSession | null {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) ?? "null");
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
      const roleStr = (raw as { role: string }).role.toLowerCase();
      const role = (roleStr === "admin" || roleStr === "moderator" ? roleStr : "user") as AuthSession["role"];
      return {
        token: (raw as { token: string }).token,
        role,
        firstName: (raw as { firstName: string }).firstName,
        username: (raw as { username: string }).username,
      };
    }
  } catch {
    // Abaikan parse error, kembalikan null
  }
  return null;
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Validasi runtime aman untuk daftar master jenis antrian
 */
export function getServices(): QueueService[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) ?? "null");
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
      if (validated.length > 0) return validated;
    }
  } catch {
    // Abaikan jika rusak, fallback ke default
  }

  // Jika belum ada di localStorage, simpan default services
  saveServices(DEFAULT_SERVICES);
  return DEFAULT_SERVICES;
}

export function saveServices(services: QueueService[]): void {
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  window.dispatchEvent(new Event("storage_services_updated"));
}

/**
 * Menambah Jenis Antrian baru dengan validasi 1 huruf kapital & nama unik (case-insensitive)
 */
export function addService(code: string, name: string): { success: boolean; message?: string; service?: QueueService } {
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
  const isCodeDuplicate = currentServices.some(
    (s) => s.code.toUpperCase() === cleanCode
  );
  if (isCodeDuplicate) {
    return { success: false, message: `Kode '${cleanCode}' sudah digunakan! Gunakan huruf lain.` };
  }

  // Cek duplikasi nama (case-insensitive)
  const isNameDuplicate = currentServices.some(
    (s) => s.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (isNameDuplicate) {
    return { success: false, message: `Nama layanan '${cleanName}' sudah ada!` };
  }

  const newService: QueueService = {
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
export function toggleServiceStatus(id: string): boolean {
  const services = getServices();
  const target = services.find((s) => s.id === id);
  if (!target) return false;

  target.isActive = !target.isActive;
  saveServices(services);
  return true;
}

/**
 * Menghapus suatu jenis antrian
 */
export function deleteService(id: string): boolean {
  const services = getServices();
  const target = services.find((s) => s.id === id);
  if (!target) return false;

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
export function getTickets(): Ticket[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS) ?? "null");
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
    // Abaikan
  }
  return [];
}

export function saveTickets(tickets: Ticket[]): void {
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  window.dispatchEvent(new Event("storage_tickets_updated"));
}

/**
 * Membuat nomor tiket baru format Kode-Nomor 3 Digit (contoh: A-001, B-012)
 */
export function createTicket(serviceCode: string, priority: PriorityLevel): Ticket | null {
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

  const newTicket: Ticket = {
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
export function resetAllTickets(): void {
  saveTickets([]);
}

