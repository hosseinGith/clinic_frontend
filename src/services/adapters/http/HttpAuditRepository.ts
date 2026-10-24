import type { IAuditRepository } from '../../repositories/IAuditRepository';
import type { AuditLogEntry, AuditAction } from '../../../domain/audit';
import type { Role } from '../../../domain/session';
import { httpClient } from '../../api/httpClient';
import { toAuditLogDto } from './mappers';

export class HttpAuditRepository implements IAuditRepository {
  async getLogs(clinicId: string): Promise<AuditLogEntry[]> {
    return httpClient.get<AuditLogEntry[]>(`/clinics/${clinicId}/audit-logs`);
  }

  async recordLog(params: {
    clinicId: string;
    userId: string;
    userName: string;
    role: Role;
    action: AuditAction;
    details?: string;
  }): Promise<void> {
    const payload = toAuditLogDto(params);
    await httpClient.post(`/clinics/${params.clinicId}/audit-logs`, payload);
  }
}
