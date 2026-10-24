import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/contexts';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-[#0f766e] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">در حال بارگذاری اطلاعات دسترسی...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'super_admin') {
    return <Navigate to="/platform" replace />;
  }

  return <>{children}</>;
};
