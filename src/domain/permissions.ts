import type { Role } from './session';

export type Permission =
  | 'appointments:read'
  | 'appointments:read_own'
  | 'appointments:create'
  | 'appointments:update_status'
  | 'clients:read'
  | 'clients:read_own'
  | 'leads:read'
  | 'leads:manage'
  | 'messages:read'
  | 'messages:send'
  | 'marketing:manage'
  | 'reports:read'
  | 'reports:financial'
  | 'settings:manage'
  | 'users:manage'
  | 'medical_notes:read'
  | 'medical_notes:write'
  | 'audit:read';

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: [
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
  ],
  admin: [
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
    'settings:manage',
    'users:manage',
  ],
  reception: [
    'appointments:read',
    'appointments:create',
    'appointments:update_status',
    'clients:read',
    'leads:read',
    'leads:manage',
    'messages:read',
    'messages:send',
  ],
  doctor: [
    'appointments:read_own',
    'appointments:update_status',
    'clients:read_own',
    'medical_notes:read',
    'medical_notes:write',
  ],
  patient: [
    'appointments:read_own',
    'appointments:update_status',
    'clients:read_own',
  ],
  super_admin: [],
};

/**
 * Checks if a given role has a specific permission.
 */
export function can(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Checks if a role has at least one of the specified permissions.
 */
export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((perm) => can(role, perm));
}

/**
 * Checks if a role has all of the specified permissions.
 */
export function canAll(role: Role, permissions: Permission[]): boolean {
  return permissions.every((perm) => can(role, perm));
}
