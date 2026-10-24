export interface PlatformUser {
  id: string;
  name: string;
  phone: string;
  role: 'super_admin';
}

export interface PlatformAuthSession {
  token: string;
  user: PlatformUser;
}

export interface SendPlatformOtpResult {
  success: boolean;
  message: string;
  expiresIn?: number;
}

export interface VerifyPlatformOtpResult {
  token: string;
  user: PlatformUser;
}

export interface IPlatformAuthRepository {
  sendOtp(phone: string): Promise<SendPlatformOtpResult>;
  verifyOtp(phone: string, code: string): Promise<VerifyPlatformOtpResult>;
  refreshSession(): Promise<VerifyPlatformOtpResult>;
  logout(): Promise<{ success: boolean }>;
}
