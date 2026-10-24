import { platformClient } from '../../api/platformClient';
import type {
  IPlatformAuthRepository,
  SendPlatformOtpResult,
  VerifyPlatformOtpResult,
} from '../../repositories/IPlatformAuthRepository';

export class HttpPlatformAuthRepository implements IPlatformAuthRepository {
  async sendOtp(phone: string): Promise<SendPlatformOtpResult> {
    return platformClient.post<SendPlatformOtpResult>('/auth/otp/send', { phone });
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyPlatformOtpResult> {
    return platformClient.post<VerifyPlatformOtpResult>('/auth/otp/verify', { phone, code });
  }

  async refreshSession(): Promise<VerifyPlatformOtpResult> {
    return platformClient.post<VerifyPlatformOtpResult>('/auth/refresh');
  }

  async logout(): Promise<{ success: boolean }> {
    return platformClient.post<{ success: boolean }>('/auth/logout');
  }
}
