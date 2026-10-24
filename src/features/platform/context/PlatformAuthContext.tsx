import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PlatformUser } from '../../../services/repositories/IPlatformAuthRepository';
import { services } from '../../../services';
import { setPlatformAccessToken, setPlatformAuthHandlers } from '../../../services/api/platformClient';

export interface PlatformAuthContextValue {
  user: PlatformUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (phone: string, code: string) => Promise<{ token: string; user: PlatformUser }>;
  logout: () => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Setup single-flight refresh handler for platformClient
  useEffect(() => {
    setPlatformAuthHandlers(
      async () => {
        try {
          const res = await services.platformAuthRepo.refreshSession();
          if (res?.token) {
            setPlatformAccessToken(res.token);
            setUser(res.user);
            return res.token;
          }
        } catch {
          // Refresh failed
        }
        return null;
      },
      () => {
        setPlatformAccessToken(null);
        setUser(null);
        queryClient.removeQueries({ queryKey: ['platform'] });
      }
    );
  }, [queryClient]);

  // Bootstrap session from server via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const res = await services.platformAuthRepo.refreshSession();
        if (!isMounted) return;
        if (res?.token && res?.user) {
          setPlatformAccessToken(res.token);
          setUser(res.user);
        }
      } catch {
        // No active platform session
        if (isMounted) {
          setPlatformAccessToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    return services.platformAuthRepo.sendOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const res = await services.platformAuthRepo.verifyOtp(phone, code);
    if (res?.token && res?.user) {
      setPlatformAccessToken(res.token);
      setUser(res.user);
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await services.platformAuthRepo.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setPlatformAccessToken(null);
      setUser(null);
      queryClient.removeQueries({ queryKey: ['platform'] });
    }
  }, [queryClient]);

  const value = useMemo<PlatformAuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user && user.role === 'super_admin',
      isLoading,
      sendOtp,
      verifyOtp,
      logout,
    }),
    [user, isLoading, sendOtp, verifyOtp, logout]
  );

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = (): PlatformAuthContextValue => {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error('usePlatformAuth must be used within a PlatformAuthProvider');
  }
  return context;
};
