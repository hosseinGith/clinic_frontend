import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UserSession, ClinicWorkspace, Actor } from '../domain/session';
import { SEED_CLINIC } from '../mocks/seed';
import { services } from '../services';
import { setAuthHandlers } from '../services/api/httpClient';
import {
  AuthContext,
  ClinicContext,
  type AuthContextValue,
  type ClinicContextValue,
} from './contexts';
import { PlatformAuthProvider } from '../features/platform/context/PlatformAuthContext';

// Central QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clinic, setClinic] = useState<ClinicWorkspace>(SEED_CLINIC);

  // Connect HTTP interceptor handlers for 401 refresh / logout
  useEffect(() => {
    setAuthHandlers(
      async () => {
        try {
          const refreshed = await services.authRepo.refreshSession();
          if (refreshed?.token) {
            setSession(refreshed);
            return refreshed.token;
          }
        } catch {
          // refresh failed
        }
        return null;
      },
      () => {
        setSession(null);
        queryClient.clear();
      }
    );
  }, []);

  // Bootstrap session from repository on mount
  // Try refreshSession first so in http mode (with HttpOnly refresh cookie) the user stays logged in
  useEffect(() => {
    let isMounted = true;
    const bootAuth = async () => {
      try {
        let currSession: UserSession | null = null;
        try {
          currSession = await services.authRepo.refreshSession();
        } catch {
          // ignore error and try getCurrentUser
        }

        if (!currSession) {
          currSession = await services.authRepo.getCurrentUser();
        }

        if (!isMounted) return;
        if (currSession) {
          setSession(currSession);
          if (currSession.activeClinic) {
            setClinic(currSession.activeClinic);
          }
        }
      } catch {
        // no active session
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void bootAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    return services.authRepo.requestOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const result = await services.authRepo.verifyOtp(phone, code);
    if (result.success && result.session) {
      setSession(result.session);
      if (result.session.activeClinic) {
        setClinic(result.session.activeClinic);
      }
      queryClient.clear();
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await services.authRepo.logout();
    setSession(null);
    queryClient.clear();
  }, []);

  const updateProfileName = useCallback(async (name: string) => {
    if (!session?.user) return;
    const updatedUser = await services.authRepo.updateProfile(session.user.id, { name });
    setSession((prev) => (prev ? { ...prev, user: updatedUser } : null));
  }, [session]);

  const actor = useMemo<Actor | null>(() => {
    if (!session || !session.user) return null;
    return {
      userId: session.user.id,
      userName: session.user.name,
      role: session.user.role,
      clinicId: session.user.role === 'super_admin' ? null : clinic.id,
      doctorId: session.user.doctorId,
      clientId: session.user.clientId,
      phone: session.user.phone,
    };
  }, [session, clinic.id]);

  const authValue = useMemo<AuthContextValue>(
    () => ({
      user: session?.user || null,
      role: session?.user?.role || null,
      session,
      isAuthenticated: !!session?.isAuthenticated,
      isLoading,
      actor,
      requestOtp,
      verifyOtp,
      logout,
      updateProfileName,
    }),
    [session, isLoading, actor, requestOtp, verifyOtp, logout, updateProfileName]
  );

  const clinicValue = useMemo<ClinicContextValue>(
    () => ({
      clinic,
      clinicId: clinic.id,
      setClinic,
    }),
    [clinic]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <ClinicContext.Provider value={clinicValue}>
          <PlatformAuthProvider>
            {children}
          </PlatformAuthProvider>
        </ClinicContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};
