import type { ICatalogRepository } from '../../repositories/ICatalogRepository';
import type { Service } from '../../../domain/service';
import type { Doctor } from '../../../domain/doctor';
import type { ClinicWorkspace } from '../../../domain/session';
import { SEED_CLINIC } from '../../../mocks/seed';
import { mockStorage, simulateDelay } from './mockStorage';

export class MockCatalogRepository implements ICatalogRepository {
  async getServices(clinicId: string): Promise<Service[]> {
    await simulateDelay(50);
    return mockStorage.getServices().filter((s) => s.clinicId === clinicId && s.isActive);
  }

  async getDoctors(clinicId: string): Promise<Doctor[]> {
    await simulateDelay(50);
    return mockStorage.getDoctors().filter((d) => d.clinicId === clinicId && d.isActive);
  }

  async getServiceById(clinicId: string, id: string): Promise<Service | null> {
    await simulateDelay(30);
    const item = mockStorage
      .getServices()
      .find((s) => s.clinicId === clinicId && s.id === id);
    return item || null;
  }

  async getDoctorById(clinicId: string, id: string): Promise<Doctor | null> {
    await simulateDelay(30);
    const item = mockStorage
      .getDoctors()
      .find((d) => d.clinicId === clinicId && d.id === id);
    return item || null;
  }

  async getClinicBySlug(slug: string): Promise<ClinicWorkspace | null> {
    await simulateDelay(30);
    if (slug === SEED_CLINIC.slug || slug === 'ariana') {
      return SEED_CLINIC;
    }
    return null;
  }
}
