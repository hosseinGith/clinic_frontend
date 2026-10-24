export type ClientStatus = 'active' | 'at_risk' | 'churned' | 'new';

export interface Client {
  id: string;
  clinicId: string;
  name: string;
  phone: string;
  email?: string;
  status: ClientStatus;
  totalVisits: number;
  totalSpent: number; // in Tomans
  lastVisitDate?: string;
  recoveryValue?: number; // Estimated value if recovered from churn risk
  notes?: string;
  parentClientId?: string; // Links family members sharing the same contact mobile
  createdAt: string;
}
