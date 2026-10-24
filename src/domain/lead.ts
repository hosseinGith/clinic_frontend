export type LeadStatus = 'new' | 'hot' | 'contacted' | 'converted' | 'dropped';

export interface Lead {
  id: string;
  clinicId: string;
  name: string;
  phone: string;
  interestedService: string;
  status: LeadStatus;
  isDecisionReady: boolean; // e.g. "3 نفر آماده تصمیمگیری"
  score: number;
  source: string;
  estimatedValue: number;
  lastContactAt?: string;
  createdAt: string;
}
