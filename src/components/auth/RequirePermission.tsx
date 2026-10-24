import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../app/usePermissions';
import { useAuth } from '../../app/contexts';
import type { Permission } from '../../domain/permissions';

export interface RequirePermissionProps {
  permission: Permission;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
}) => {
  const { isLoading } = useAuth();
  const { can } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!can(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
