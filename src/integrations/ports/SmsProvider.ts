export interface SendSmsResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export interface SmsProvider {
  name: string;
  send(to: string, message: string, templateCode?: string): Promise<SendSmsResult>;
  checkHealth(): Promise<boolean>;
}
