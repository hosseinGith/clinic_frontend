import type { Service } from '../../domain/service';
import type { Doctor } from '../../domain/doctor';
import type { ClinicWorkspace } from '../../domain/session';

export interface ICatalogRepository {
  getServices(clinicId: string): Promise<Service[]>;
  getDoctors(clinicId: string): Promise<Doctor[]>;
  getServiceById(clinicId: string, id: string): Promise<Service | null>;
  getDoctorById(clinicId: string, id: string): Promise<Doctor | null>;
  getClinicBySlug(slug: string): Promise<ClinicWorkspace | null>;
}
