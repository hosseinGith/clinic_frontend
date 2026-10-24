import type { WhatsAppProvider, SendWhatsAppResult } from '../ports/WhatsAppProvider';

export class MockWhatsAppProvider implements WhatsAppProvider {
  name = 'واتساپ تجاری Cloud API (شبیه‌ساز)';

  async send(_to: string, _message: string): Promise<SendWhatsAppResult> {
    await new Promise((r) => setTimeout(r, 80));
    return {
      success: true,
      messageId: `wa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}
