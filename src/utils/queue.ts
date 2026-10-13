import type { Ticket, PriorityLevel } from "../types/index.js";

export const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  VIP: 4,
  Disabilitas: 3,
  Lansia: 2,
  Normal: 1,
};

export function getPriorityWeight(priority: PriorityLevel): number {
  return PRIORITY_WEIGHTS[priority] ?? 1;
}

/**
 * Mengurutkan tiket dalam antrian menunggu:
 * 1. Berdasarkan bobot prioritas tertinggi (VIP > Disabilitas > Lansia > Normal)
 * 2. Jika prioritas sama, berdasarkan waktu pembuatan tiket (FIFO)
 */
export function sortTicketsByPriority(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const weightDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (weightDiff !== 0) {
      return weightDiff;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * Mengambil tiket yang sedang berstatus 'dipanggil' untuk kode layanan tertentu
 */
export function getCurrentlyCalledTicket(serviceCode: string, tickets: Ticket[]): Ticket | undefined {
  return tickets.find(
    (t) => t.serviceCode === serviceCode && t.status === "dipanggil"
  );
}

/**
 * Mengambil tiket berikutnya dalam antrian untuk dipanggil berdasarkan urutan prioritas
 */
export function getNextTicket(serviceCode: string, tickets: Ticket[]): Ticket | undefined {
  const waiting = tickets.filter(
    (t) => t.serviceCode === serviceCode && t.status === "menunggu"
  );
  const first = sortTicketsByPriority(waiting)[0];
  if (first) return first;

  return tickets
    .filter((t) => t.serviceCode === serviceCode && t.status === "dilewati")
    .sort((a, b) => (a.calledAt ?? "").localeCompare(b.calledAt ?? ""))[0];
}

/**
 * Menghitung sisa tiket yang masih menunggu untuk suatu layanan
 */
export function getWaitingCount(serviceCode: string, tickets: Ticket[]): number {
  return tickets.filter(
    (t) => t.serviceCode === serviceCode && t.status === "menunggu"
  ).length;
}

/** Menyelesaikan tiket yang sedang dipanggil, lalu memanggil tiket berikutnya. */
export function callNext(serviceCode: string, tickets: Ticket[], now: string): Ticket[] {
  const currentTicket = getCurrentlyCalledTicket(serviceCode, tickets);
  const nextTicket = getNextTicket(serviceCode, tickets);
  if (!currentTicket && !nextTicket) return tickets;

  return tickets.map((ticket) => {
    if (currentTicket && ticket.id === currentTicket.id) {
      return { ...ticket, status: "selesai", completedAt: now };
    }
    if (nextTicket && ticket.id === nextTicket.id) {
      return { ...ticket, status: "dipanggil", calledAt: now };
    }
    return ticket;
  });
}

/** Menyelesaikan tiket yang sedang dipanggil tanpa memanggil tiket lain. */
export function finishCurrent(serviceCode: string, tickets: Ticket[], now: string): Ticket[] {
  const currentTicket = getCurrentlyCalledTicket(serviceCode, tickets);
  if (!currentTicket) return tickets;

  return tickets.map((ticket) => ticket.id === currentTicket.id
    ? { ...ticket, status: "selesai", completedAt: now }
    : ticket);
}

/** Menandai tiket yang sedang dipanggil sebagai dilewati. */
export function skipCurrent(serviceCode: string, tickets: Ticket[], now: string): Ticket[] {
  const currentTicket = getCurrentlyCalledTicket(serviceCode, tickets);
  if (!currentTicket) return tickets;

  return tickets.map((ticket) => ticket.id === currentTicket.id
    ? { ...ticket, status: "dilewati" }
    : ticket);
}

