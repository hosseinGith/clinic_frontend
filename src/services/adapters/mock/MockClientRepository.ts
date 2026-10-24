import type { IClientRepository } from '../../repositories/IClientRepository';
import type { Client } from '../../../domain/client';
import { mockStorage, simulateDelay } from './mockStorage';
import { toEnglishDigits } from '../../../lib/format';

export class MockClientRepository implements IClientRepository {
  async getClients(clinicId: string, search?: string): Promise<Client[]> {
    await simulateDelay();
    let clients = mockStorage.getClients().filter((c) => c.clinicId === clinicId);

    if (search) {
      const qOriginal = search.trim().toLowerCase();
      const qNorm = toEnglishDigits(search).trim().toLowerCase();
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(qOriginal) ||
          c.phone.includes(qNorm) ||
          toEnglishDigits(c.phone).includes(qNorm)
      );
    }
    return clients;
  }

  async getAtRiskClients(clinicId: string): Promise<Client[]> {
    await simulateDelay();
    return mockStorage
      .getClients()
      .filter((c) => c.clinicId === clinicId && c.status === 'at_risk');
  }

  async getClientById(clinicId: string, id: string): Promise<Client | null> {
    await simulateDelay();
    const item = mockStorage
      .getClients()
      .find((c) => c.clinicId === clinicId && c.id === id);
    return item || null;
  }
}
