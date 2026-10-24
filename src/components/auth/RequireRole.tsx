import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../app/contexts';
import type { Role } from '../../domain/session';

export interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
