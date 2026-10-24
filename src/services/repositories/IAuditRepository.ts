import type { AuditLogEntry, AuditAction } from '../../domain/audit';
import type { Role } from '../../domain/session';

export interface IAuditRepository {
  getLogs(clinicId: string): Promise<AuditLogEntry[]>;
  recordLog(params: {
    clinicId: string;
    userId: string;
    userName: string;
    role: Role;
    action: AuditAction;
    details?: string;
  }): Promise<void>;
}
