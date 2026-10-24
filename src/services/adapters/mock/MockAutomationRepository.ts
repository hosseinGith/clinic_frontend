import type { IAutomationRepository } from '../../repositories/IAutomationRepository';
import type { Automation, AutomationEvent, AutomationStats, OutboxMessage } from '../../../domain/automation';
import { mockStorage, simulateDelay } from './mockStorage';
import { integrationRegistry } from '../../../integrations/registry';

export class MockAutomationRepository implements IAutomationRepository {
  async getAutomations(clinicId: string): Promise<Automation[]> {
    await simulateDelay();
    const isSmsConnected = integrationRegistry.isConnected('sms');
    const isWhatsappConnected = integrationRegistry.isConnected('whatsapp');

    return mockStorage
      .getAutomations()
      .filter((a) => a.clinicId === clinicId)
      .map((a) => {
        const requiresSms = a.channel.includes('پیامک');
        const requiresWhatsapp = a.channel.includes('واتساپ');

        let healthy = true;
        if (requiresSms && !isSmsConnected) {
          healthy = false;
        }
        if (requiresWhatsapp && !isWhatsappConnected && !requiresSms) {
          healthy = false;
        }

        return {
          ...a,
          healthy,
        };
      });
  }

  async getStats(clinicId: string): Promise<AutomationStats> {
    await simulateDelay(30);
    const automations = mockStorage.getAutomations().filter((a) => a.clinicId === clinicId);
    const totalActions = automations.reduce((sum, a) => sum + (a.totalTriggered || 0), 0);
    const hoursSaved = Math.round((totalActions * 4) / 60);

    return {
      totalActions,
      hoursSaved,
    };
  }

  async setEnabled(clinicId: string, id: string, enabled: boolean): Promise<void> {
    await simulateDelay(20);
    const automations = mockStorage.getAutomations();
    const item = automations.find((a) => a.clinicId === clinicId && a.id === id);
    if (item) {
      item.enabled = enabled;
      mockStorage.saveAutomations([...automations]);
    }
  }

  async triggerEvent(
    clinicId: string,
    event: AutomationEvent,
    payload: Record<string, unknown>
  ): Promise<void> {
    await simulateDelay(50);
    const automations = await this.getAutomations(clinicId);
    const matchingRule = automations.find(
      (a) => a.clinicId === clinicId && a.event === event && a.enabled && a.healthy
    );

    if (!matchingRule) return;

    // Compose personalized message
    let content = matchingRule.messageTemplate;
    Object.entries(payload).forEach(([k, v]) => {
      content = content.replace(new RegExp(`{${k}}`, 'g'), String(v));
    });

    const recipientPhone = String(payload.phone || payload.clientPhone || '09120000000');
    const recipientName = String(payload.name || payload.clientName || 'مراجع گرامی');

    // Route through providers
    const channel = matchingRule.channel.includes('واتساپ') ? 'whatsapp' : 'sms';
    let messageStatus: 'sent' | 'pending' | 'failed' = 'sent';
    let scheduledFor: string | undefined = undefined;

    // 24-Hour Reminder Scheduling
    const appointmentDateTime = (payload.appointmentDateTime || payload.dateTime) as string | undefined;
    if (appointmentDateTime) {
      const aptTime = new Date(appointmentDateTime).getTime();
      const diffMs = aptTime - Date.now();
      if (diffMs > 24 * 60 * 60 * 1000) {
        messageStatus = 'pending';
        scheduledFor = new Date(aptTime - 24 * 60 * 60 * 1000).toISOString();
      }
    }

    if (messageStatus !== 'pending') {
      if (channel === 'whatsapp') {
        await integrationRegistry.whatsappProvider.send(recipientPhone, content);
      } else {
        const isSmsConnected = integrationRegistry.isConnected('sms');
        if (!isSmsConnected) {
          messageStatus = 'failed';
        }
        await integrationRegistry.smsProvider.send(recipientPhone, content);
      }
    }

    // Save to simulated outbox
    const outboxMessage: OutboxMessage = {
      id: `outbox-${Date.now()}`,
      clinicId,
      recipientPhone,
      recipientName,
      channel,
      content,
      status: messageStatus,
      triggerEvent: event,
      scheduledFor,
      createdAt: 'هم‌اکنون',
    };

    const currentOutbox = mockStorage.getOutbox();
    mockStorage.saveOutbox([outboxMessage, ...currentOutbox]);

    // Increment automation counter
    const allAutomations = mockStorage.getAutomations();
    const storedRule = allAutomations.find((a) => a.clinicId === clinicId && a.id === matchingRule.id);
    if (storedRule) {
      storedRule.totalTriggered += 1;
      mockStorage.saveAutomations([...allAutomations]);
    }
  }
}
