import type { IAuditRepository } from '../../repositories/IAuditRepository';
import type { AuditLogEntry, AuditAction } from '../../../domain/audit';
import { AUDIT_ACTION_LABELS } from '../../../domain/audit';
import type { Role } from '../../../domain/session';
import { mockStorage, simulateDelay } from './mockStorage';

export class MockAuditRepository implements IAuditRepository {
  async getLogs(clinicId: string): Promise<AuditLogEntry[]> {
    await simulateDelay(60);
    const logs = mockStorage.getAuditLogs().filter((l) => l.clinicId === clinicId);
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async recordLog(params: {
    clinicId: string;
    userId: string;
    userName: string;
    role: Role;
    action: AuditAction;
    details?: string;
  }): Promise<void> {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clinicId: params.clinicId,
      userId: params.userId,
      userName: params.userName,
      role: params.role,
      action: params.action,
      actionLabel: AUDIT_ACTION_LABELS[params.action] || params.action,
      details: params.details,
      createdAt: new Date().toISOString(),
    };

    const current = mockStorage.getAuditLogs();
    mockStorage.saveAuditLogs([entry, ...current]);
  }
}
