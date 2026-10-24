export type IntegrationType = 'sms' | 'whatsapp' | 'payment' | 'online_booking';

export type ConnectionStatus = 'connected' | 'not_connected' | 'degraded';

export interface IntegrationStatus {
  id: IntegrationType;
  title: string;
  providerName: string;
  status: ConnectionStatus;
  statusLabel: string;
  hint: string;
  lastCheckedAt: string;
}

export interface SidebarServiceStatus {
  bookingActive: boolean;
  smsConnected: boolean;
  bookingStatusText: string;
  smsStatusText: string;
}
