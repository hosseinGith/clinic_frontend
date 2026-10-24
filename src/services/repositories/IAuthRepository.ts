import type { UserProfile, UserSession, Role, Actor } from '../../domain/session';

export interface RequestOtpResult {
  success: boolean;
  message: string;
  expiresInSeconds: number;
}

export interface VerifyOtpResult {
  success: boolean;
  session?: UserSession;
  error?: string;
}

export interface VerifyPhoneOwnershipResult {
  success: boolean;
  verificationToken?: string;
  error?: string;
}

export interface CreateUserInput {
  name: string;
  phone: string;
  role: Role;
  roleTitle: string;
  email?: string;
  doctorId?: string;
}

export interface IAuthRepository {
  requestOtp(phone: string): Promise<RequestOtpResult>;
  verifyOtp(phone: string, code: string): Promise<VerifyOtpResult>;
  verifyPhoneOwnership(phone: string, code: string): Promise<VerifyPhoneOwnershipResult>;
  getCurrentUser(): Promise<UserSession | null>;
  logout(): Promise<void>;
  refreshSession(): Promise<UserSession | null>;
  updateProfile(userId: string, input: { name: string }): Promise<UserProfile>;

  // User management (owner / admin)
  getUsers(clinicId: string): Promise<UserProfile[]>;
  createUser(clinicId: string, input: CreateUserInput, actor?: Actor): Promise<UserProfile>;
  updateUserRole(
    clinicId: string,
    userId: string,
    newRole: Role,
    actor?: Actor,
    doctorId?: string
  ): Promise<UserProfile>;
  toggleUserStatus(clinicId: string, userId: string, actor?: Actor): Promise<UserProfile>;
}
