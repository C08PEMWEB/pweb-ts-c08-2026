export interface QueueService {
  id: string;
  code: string;       // 1 huruf kapital, misal 'A', 'B', 'C'
  name: string;       // Nama Layanan, misal 'Umum-1', 'Gigi', 'Farmasi'
  isActive: boolean;  // Status aktif / nonaktif
  createdAt: string;  // ISO timestamp
}

export type NewQueueService = Omit<QueueService, "id" | "createdAt">;

