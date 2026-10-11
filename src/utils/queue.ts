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
  const waitingTickets = tickets.filter(
    (t) => t.serviceCode === serviceCode && t.status === "menunggu"
  );
  const sorted = sortTicketsByPriority(waitingTickets);
  return sorted[0];
}

/**
 * Menghitung sisa tiket yang masih menunggu untuk suatu layanan
 */
export function getWaitingCount(serviceCode: string, tickets: Ticket[]): number {
  return tickets.filter(
    (t) => t.serviceCode === serviceCode && t.status === "menunggu"
  ).length;
}

