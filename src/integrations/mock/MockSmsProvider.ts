import type { SmsProvider, SendSmsResult } from '../ports/SmsProvider';

export class MockSmsProvider implements SmsProvider {
  name = 'کاوهنگار (شبیه‌ساز)';

  async send(_to: string, _message: string, _templateCode?: string): Promise<SendSmsResult> {
    // Simulated network delay
    await new Promise((r) => setTimeout(r, 80));

    const messageId = `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return {
      success: true,
      messageId,
    };
  }

  async checkHealth(): Promise<boolean> {
    return false; // Initially marked as not yet connected as required by sidebar card: «پیامک هنوز متصل نیست»
  }
}
