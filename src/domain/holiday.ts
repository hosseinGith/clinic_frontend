export interface BlockedDay {
  id: string;
  clinicId: string;
  doctorId?: string | null;
  date: string; // YYYY-MM-DD
  reason?: string | null;
  createdAt?: string;
}
