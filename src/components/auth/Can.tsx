import React from 'react';
import { usePermissions } from '../../app/usePermissions';
import type { Permission } from '../../domain/permissions';

export interface CanProps {
  permission?: Permission;
  anyPermissions?: Permission[];
  allPermissions?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
}) => {
  const { can, canAny, canAll } = usePermissions();

  let isAllowed = true;

  if (permission && !can(permission)) {
    isAllowed = false;
  }
  if (anyPermissions && !canAny(anyPermissions)) {
    isAllowed = false;
  }
  if (allPermissions && !canAll(allPermissions)) {
    isAllowed = false;
  }

  return isAllowed ? <>{children}</> : <>{fallback}</>;
};
