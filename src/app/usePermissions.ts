import { useAuth } from './contexts';
import {
  can as domainCan,
  canAny as domainCanAny,
  canAll as domainCanAll,
} from '../domain/permissions';
import type { Permission } from '../domain/permissions';

export const usePermissions = () => {
  const { role } = useAuth();

  return {
    role,
    can: (permission: Permission) => (role ? domainCan(role, permission) : false),
    canAny: (permissions: Permission[]) => (role ? domainCanAny(role, permissions) : false),
    canAll: (permissions: Permission[]) => (role ? domainCanAll(role, permissions) : false),
  };
};
