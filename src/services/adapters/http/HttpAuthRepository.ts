import type {
  IAuthRepository,
  RequestOtpResult,
  VerifyOtpResult,
  CreateUserInput,
} from '../../repositories/IAuthRepository';
import type { UserProfile, UserSession, Role, ClinicWorkspace } from '../../../domain/session';
import { httpClient, setAuthToken } from '../../api/httpClient';

interface UserProfileDto {
  id: string;
  name: string;
  role: Role;
  role_title: string;
  avatar_initials: string;
  email?: string;
  phone: string;
  doctor_id?: string;
  client_id?: string;
  clinic_id?: string;
  is_active: boolean;
  created_at: string;
}

interface ClinicWorkspaceDto {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  phone: string;
  address: string;
  working_hours: string;
}

interface RequestOtpResponseDto {
  success: boolean;
  message: string;
  expires_in_seconds: number;
}

interface VerifyOtpResponseDto {
  success: boolean;
  access_token: string;
  user: UserProfileDto;
  active_clinic: ClinicWorkspaceDto;
  available_clinics: ClinicWorkspaceDto[];
}

function mapUserDtoToDomain(dto: UserProfileDto): UserProfile {
  return {
    id: dto.id,
    name: dto.name,
    role: dto.role,
    roleTitle: dto.role_title,
    avatarInitials: dto.avatar_initials,
    email: dto.email,
    phone: dto.phone,
    doctorId: dto.doctor_id,
    clientId: dto.client_id,
    clinicId: dto.clinic_id,
    isActive: dto.is_active,
    createdAt: dto.created_at,
  };
}

function mapClinicDtoToDomain(dto: ClinicWorkspaceDto): ClinicWorkspace {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    tagline: dto.tagline,
    phone: dto.phone,
    address: dto.address,
    workingHours: dto.working_hours,
  };
}

export class HttpAuthRepository implements IAuthRepository {
  private inFlightRefreshPromise: Promise<UserSession | null> | null = null;

  async requestOtp(phone: string): Promise<RequestOtpResult> {
    const res = await httpClient.post<RequestOtpResponseDto>('/auth/otp/request', {
      phone,
    });
    return {
      success: res.success,
      message: res.message,
      expiresInSeconds: res.expires_in_seconds,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    const res = await httpClient.post<VerifyOtpResponseDto>('/auth/otp/verify', {
      phone,
      code,
    });

    if (res.access_token) {
      setAuthToken(res.access_token);
    }

    const session: UserSession = {
      user: mapUserDtoToDomain(res.user),
      activeClinic: mapClinicDtoToDomain(res.active_clinic),
      availableClinics: (res.available_clinics || []).map(mapClinicDtoToDomain),
      isAuthenticated: true,
      token: res.access_token,
    };

    return {
      success: res.success,
      session,
    };
  }

  async verifyPhoneOwnership(phone: string, code: string): Promise<{ success: boolean; verificationToken?: string; error?: string }> {
    try {
      const res = await httpClient.post<{ success: boolean; verification_token: string; message?: string }>('/auth/otp/verify-phone', {
        phone,
        code,
      });
      return {
        success: res.success,
        verificationToken: res.verification_token,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'خطا در تأیید مالکیت شماره تلفن.',
      };
    }
  }

  async getCurrentUser(): Promise<UserSession | null> {
    try {
      const res = await httpClient.get<{
        user: UserProfileDto;
        active_clinic: ClinicWorkspaceDto;
        available_clinics: ClinicWorkspaceDto[];
      }>('/auth/me');

      return {
        user: mapUserDtoToDomain(res.user),
        activeClinic: mapClinicDtoToDomain(res.active_clinic),
        availableClinics: (res.available_clinics || []).map(mapClinicDtoToDomain),
        isAuthenticated: true,
      };
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } finally {
      setAuthToken(null);
    }
  }

  async refreshSession(): Promise<UserSession | null> {
    if (this.inFlightRefreshPromise) {
      return this.inFlightRefreshPromise;
    }

    this.inFlightRefreshPromise = (async () => {
      try {
        const res = await httpClient.post<{
          access_token: string;
          user: UserProfileDto;
        }>('/auth/refresh');

        if (res.access_token) {
          setAuthToken(res.access_token);
        }

        const currentUser = await this.getCurrentUser();
        if (!currentUser) return null;
        return {
          ...currentUser,
          token: res.access_token,
        };
      } catch {
        return null;
      } finally {
        this.inFlightRefreshPromise = null;
      }
    })();

    return this.inFlightRefreshPromise;
  }

  async updateProfile(userId: string, input: { name: string }): Promise<UserProfile> {
    const res = await httpClient.patch<UserProfileDto>(`/auth/profile/${userId}`, {
      name: input.name,
    });
    return mapUserDtoToDomain(res);
  }

  async getUsers(clinicId: string): Promise<UserProfile[]> {
    const res = await httpClient.get<UserProfileDto[]>(`/clinics/${clinicId}/users`);
    return res.map(mapUserDtoToDomain);
  }

  async createUser(clinicId: string, input: CreateUserInput): Promise<UserProfile> {
    const res = await httpClient.post<UserProfileDto>(`/clinics/${clinicId}/users`, {
      name: input.name,
      phone: input.phone,
      role: input.role,
      role_title: input.roleTitle,
      email: input.email,
      doctor_id: input.doctorId,
    });
    return mapUserDtoToDomain(res);
  }

  async updateUserRole(
    clinicId: string,
    userId: string,
    newRole: Role,
    _actor?: unknown,
    doctorId?: string
  ): Promise<UserProfile> {
    const res = await httpClient.patch<UserProfileDto>(
      `/clinics/${clinicId}/users/${userId}/role`,
      { role: newRole, doctor_id: doctorId }
    );
    return mapUserDtoToDomain(res);
  }

  async toggleUserStatus(clinicId: string, userId: string): Promise<UserProfile> {
    const res = await httpClient.patch<UserProfileDto>(
      `/clinics/${clinicId}/users/${userId}/status`
    );
    return mapUserDtoToDomain(res);
  }
}
