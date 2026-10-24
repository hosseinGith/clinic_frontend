export interface SendWhatsAppResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export interface WhatsAppProvider {
  name: string;
  send(to: string, message: string): Promise<SendWhatsAppResult>;
  checkHealth(): Promise<boolean>;
}
