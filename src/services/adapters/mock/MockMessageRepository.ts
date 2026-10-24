import type { IMessageRepository } from '../../repositories/IMessageRepository';
import type { OutboxMessage } from '../../../domain/automation';
import { mockStorage, simulateDelay } from './mockStorage';

export class MockMessageRepository implements IMessageRepository {
  async getOutboxMessages(clinicId: string): Promise<OutboxMessage[]> {
    await simulateDelay();
    return mockStorage.getOutbox().filter((m) => m.clinicId === clinicId);
  }

  async saveMessage(message: Omit<OutboxMessage, 'id' | 'createdAt'>): Promise<OutboxMessage> {
    await simulateDelay();
    const newMsg: OutboxMessage = {
      ...message,
      id: `outbox-${Date.now()}`,
      createdAt: 'هم‌اکنون',
    };
    const current = mockStorage.getOutbox();
    mockStorage.saveOutbox([newMsg, ...current]);
    return newMsg;
  }
}
