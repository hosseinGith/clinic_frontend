export interface Service {
  id: string;
  clinicId: string;
  name: string;
  duration: number; // in minutes
  price: number; // in Tomans
  category: string;
  description?: string;
  isActive: boolean;
}
