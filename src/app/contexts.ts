import { createContext, useContext } from 'react';
import type { UserSession, UserProfile, Role, ClinicWorkspace, Actor } from '../domain/session';
import type { RequestOtpResult, VerifyOtpResult } from '../services/repositories/IAuthRepository';

export interface AuthContextValue {
  user: UserProfile | null;
  role: Role | null;
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  actor: Actor | null;
  requestOtp: (phone: string) => Promise<RequestOtpResult>;
  verifyOtp: (phone: string, code: string) => Promise<VerifyOtpResult>;
  logout: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppProviders');
  return ctx;
};


export interface ClinicContextValue {
  clinic: ClinicWorkspace;
  clinicId: string;
  setClinic: (clinic: ClinicWorkspace) => void;
}

export const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

export const useClinic = (): ClinicContextValue => {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be used within AppProviders');
  return ctx;
};
