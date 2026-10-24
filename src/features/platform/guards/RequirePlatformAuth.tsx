import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { AuthContext } from '../../../app/contexts';

export const RequirePlatformAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: platformUser, isAuthenticated, isLoading: platformLoading } = usePlatformAuth();
  const clinicAuth = useContext(AuthContext);
  const clinicRole = clinicAuth?.role;
  const location = useLocation();

  if (platformLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400">در حال ارزیابی نشست دسترسی پلتفرم...</p>
      </div>
    );
  }

  // If user is a tenant clinic actor (owner, admin, etc.) trying to access /platform/* -> 403 Forbidden
  if (clinicRole && clinicRole !== 'super_admin' && !isAuthenticated) {
    return <Navigate to="/403" replace />;
  }

  // If not authenticated as super_admin -> redirect to /platform/login
  if (!isAuthenticated || !platformUser || platformUser.role !== 'super_admin') {
    return <Navigate to="/platform/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
