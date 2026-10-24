import type { ILeadRepository } from '../../repositories/ILeadRepository';
import type { Lead } from '../../../domain/lead';
import { mockStorage, simulateDelay } from './mockStorage';

export class MockLeadRepository implements ILeadRepository {
  async getLeads(clinicId: string): Promise<Lead[]> {
    await simulateDelay();
    return mockStorage.getLeads().filter((l) => l.clinicId === clinicId);
  }

  async getHotLeads(clinicId: string): Promise<Lead[]> {
    await simulateDelay();
    return mockStorage
      .getLeads()
      .filter((l) => l.clinicId === clinicId && l.status === 'hot');
  }
}
