import type { Client } from '../../domain/client';

export interface IClientRepository {
  getClients(clinicId: string, search?: string): Promise<Client[]>;
  getAtRiskClients(clinicId: string): Promise<Client[]>;
  getClientById(clinicId: string, id: string): Promise<Client | null>;
}
