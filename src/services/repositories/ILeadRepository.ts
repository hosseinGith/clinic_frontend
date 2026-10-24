import type { Lead } from '../../domain/lead';

export interface ILeadRepository {
  getLeads(clinicId: string): Promise<Lead[]>;
  getHotLeads(clinicId: string): Promise<Lead[]>;
}
