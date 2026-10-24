import { describe, it, expect } from 'vitest';
import { can, canAny, canAll } from '../domain/permissions';

describe('Permissions & RBAC Matrix', () => {
  it('verifies owner has full permissions including financial and audit', () => {
    expect(can('owner', 'reports:financial')).toBe(true);
    expect(can('owner', 'audit:read')).toBe(true);
    expect(can('owner', 'medical_notes:read')).toBe(true);
    expect(can('owner', 'users:manage')).toBe(true);
    expect(can('owner', 'settings:manage')).toBe(true);
  });

  it('verifies admin has user and settings management, but no sensitive financial reports or audit log', () => {
    expect(can('admin', 'users:manage')).toBe(true);
    expect(can('admin', 'settings:manage')).toBe(true);
    expect(can('admin', 'reports:read')).toBe(true);
    expect(can('admin', 'reports:financial')).toBe(false);
    expect(can('admin', 'audit:read')).toBe(false);
  });

  it('verifies reception has NO medical_notes:read, NO settings:manage, NO reports:read, NO users:manage', () => {
    expect(can('reception', 'medical_notes:read')).toBe(false);
    expect(can('reception', 'medical_notes:write')).toBe(false);
    expect(can('reception', 'settings:manage')).toBe(false);
    expect(can('reception', 'reports:read')).toBe(false);
    expect(can('reception', 'reports:financial')).toBe(false);
    expect(can('reception', 'users:manage')).toBe(false);

    // Reception HAS appointments, leads, clients, messages
    expect(can('reception', 'appointments:read')).toBe(true);
    expect(can('reception', 'appointments:create')).toBe(true);
    expect(can('reception', 'appointments:update_status')).toBe(true);
    expect(can('reception', 'clients:read')).toBe(true);
    expect(can('reception', 'leads:read')).toBe(true);
    expect(can('reception', 'messages:read')).toBe(true);
  });

  it('verifies doctor has NO leads:read, NO marketing:manage, NO settings:manage, NO reports:read', () => {
    expect(can('doctor', 'leads:read')).toBe(false);
    expect(can('doctor', 'leads:manage')).toBe(false);
    expect(can('doctor', 'marketing:manage')).toBe(false);
    expect(can('doctor', 'settings:manage')).toBe(false);
    expect(can('doctor', 'reports:read')).toBe(false);
    expect(can('doctor', 'reports:financial')).toBe(false);

    // Doctor HAS medical notes and own appointments
    expect(can('doctor', 'medical_notes:read')).toBe(true);
    expect(can('doctor', 'medical_notes:write')).toBe(true);
    expect(can('doctor', 'appointments:read_own')).toBe(true);
    expect(can('doctor', 'appointments:update_status')).toBe(true);
  });

  it('verifies patient only has access to own appointments and client profile', () => {
    expect(can('patient', 'appointments:read_own')).toBe(true);
    expect(can('patient', 'appointments:update_status')).toBe(true);
    expect(can('patient', 'appointments:read')).toBe(false);
    expect(can('patient', 'leads:read')).toBe(false);
    expect(can('patient', 'settings:manage')).toBe(false);
    expect(can('patient', 'medical_notes:read')).toBe(false);
  });

  it('verifies helper functions canAny and canAll', () => {
    expect(canAny('reception', ['settings:manage', 'leads:read'])).toBe(true);
    expect(canAny('patient', ['settings:manage', 'leads:read'])).toBe(false);

    expect(canAll('owner', ['appointments:read', 'medical_notes:read', 'reports:financial'])).toBe(true);
    expect(canAll('reception', ['appointments:read', 'medical_notes:read'])).toBe(false);
  });

  it('verifies super_admin role has strictly zero clinic permissions (complete isolation)', () => {
    const allClinicPermissions = [
      'appointments:read',
      'appointments:read_own',
      'appointments:create',
      'appointments:update_status',
      'clients:read',
      'clients:read_own',
      'leads:read',
      'leads:manage',
      'messages:read',
      'messages:send',
      'marketing:manage',
      'reports:read',
      'reports:financial',
      'settings:manage',
      'users:manage',
      'medical_notes:read',
      'medical_notes:write',
      'audit:read',
    ] as const;

    for (const perm of allClinicPermissions) {
      expect(can('super_admin', perm)).toBe(false);
    }
    expect(canAny('super_admin', [...allClinicPermissions])).toBe(false);
  });
});
