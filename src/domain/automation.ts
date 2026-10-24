export type AutomationEvent =
  | 'appointment.created'
  | 'appointment.confirmed'
  | 'appointment.reminder_24h'
  | 'lead.hot'
  | 'client.inactive'
  | 'visit.completed';

export interface Automation {
  id: string;
  clinicId: string;
  title: string;
  channel: string; // e.g. "پیامک و واتساپ"
  healthy: boolean;
  event: AutomationEvent;
  messageTemplate: string;
  enabled: boolean;
  totalTriggered: number;
}

export interface AutomationStats {
  totalActions: number; // e.g. 186
  hoursSaved: number; // e.g. 12
}

export interface OutboxMessage {
  id: string;
  clinicId: string;
  recipientPhone: string;
  recipientName: string;
  channel: 'sms' | 'whatsapp';
  content: string;
  status: 'sent' | 'pending' | 'failed';
  triggerEvent: AutomationEvent;
  scheduledFor?: string;
  createdAt: string;
}
