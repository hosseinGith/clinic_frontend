import type { OutboxMessage } from '../../domain/automation';

export interface IMessageRepository {
  getOutboxMessages(clinicId: string): Promise<OutboxMessage[]>;
  saveMessage(message: Omit<OutboxMessage, 'id' | 'createdAt'>): Promise<OutboxMessage>;
}
