export type PriorityLevel = "VIP" | "Disabilitas" | "Lansia" | "Normal";

export type TicketStatus = "menunggu" | "dipanggil" | "selesai" | "dilewati";

export interface Ticket {
  id: string;
  ticketNumber: string;       // Format: 'A-001', 'B-012'
  sequenceNumber: number;     // 1, 2, 3 ... untuk reset/counter
  serviceCode: string;        // 'A', 'B', dsb.
  serviceName: string;        // 'Umum-1', 'Gigi', dsb.
  priority: PriorityLevel;    // Urutan: VIP > Disabilitas > Lansia > Normal
  status: TicketStatus;
  createdAt: string;          // ISO timestamp
  calledAt?: string;
  completedAt?: string;
}

export interface NewTicketPayload {
  serviceCode: string;
  priority: PriorityLevel;
}

