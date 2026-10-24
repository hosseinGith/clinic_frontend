import { describe, it, expect, beforeEach } from 'vitest';
import { MockAutomationRepository } from '../services/adapters/mock/MockAutomationRepository';
import { MockAppointmentRepository } from '../services/adapters/mock/MockAppointmentRepository';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { SEED_CLINIC } from '../mocks/seed';
import { integrationRegistry } from '../integrations/registry';

describe('Phase 4: Automations and Integrations', () => {
  let automationRepo: MockAutomationRepository;
  let appointmentRepo: MockAppointmentRepository;
  const clinicId = SEED_CLINIC.id;

  beforeEach(() => {
    mockStorage.resetToSeed();
    automationRepo = new MockAutomationRepository();
    appointmentRepo = new MockAppointmentRepository();
  });

  describe('1. Automation Health reflects channel provider status', () => {
    it('computes automation healthy as false when its channel provider is disconnected', async () => {
      // Disconnect SMS provider
      integrationRegistry.updateStatus('sms', 'disconnected');

      const automations = await automationRepo.getAutomations(clinicId);
      const smsAutomations = automations.filter((a) => a.channel.includes('پیامک'));

      // If SMS provider is disconnected, SMS-based automations must NOT be healthy
      for (const a of smsAutomations) {
        expect(a.healthy).toBe(false);
      }

      // Reconnect SMS provider
      integrationRegistry.updateStatus('sms', 'connected');
      const automationsAfter = await automationRepo.getAutomations(clinicId);
      const smsAutomationsAfter = automationsAfter.filter((a) => a.channel.includes('پیامک'));
      for (const a of smsAutomationsAfter) {
        expect(a.healthy).toBe(true);
      }
    });
  });

  describe('2. appointment.created event triggers outbox confirmation message', () => {
    it('creates an outbox message when appointment.created event is emitted', async () => {
      mockStorage.clearOutbox();

      await automationRepo.triggerEvent(clinicId, 'appointment.created', {
        name: 'شیدا فراهانی',
        phone: '09123334455',
        service: 'بوتاکس پیشانی',
        time: '18:30',
      });

      const outbox = mockStorage.getOutboxMessages();
      expect(outbox.length).toBeGreaterThan(0);
      const sentMessage = outbox.find((m) => m.recipientPhone === '09123334455');
      expect(sentMessage).toBeDefined();
      expect(sentMessage?.content).toContain('دریافت شد');
    });
  });

  describe('3. visit.completed event emission on appointment status completion', () => {
    it('emits visit.completed and creates survey message when appointment is marked completed', async () => {
      mockStorage.clearOutbox();
      const appointments = mockStorage.getAppointments();
      const testApt = appointments.find((a) => a.status === 'in_clinic');
      expect(testApt).toBeDefined();

      await appointmentRepo.updateStatus(clinicId, testApt!.id, 'completed', {
        userId: 'usr-admin',
        clinicId,
        role: 'admin',
        userName: 'مدیر',
        phone: '09121110002',
      });

      const outbox = mockStorage.getOutboxMessages();
      // Should have generated survey message for visit.completed
      const surveyMessage = outbox.find(
        (m) => m.recipientPhone === testApt!.clientPhone && m.content.includes('رضایت')
      );
      expect(surveyMessage).toBeDefined();
    });
  });

  describe('4. 24-Hour Reminder Scheduling for distant appointments', () => {
    it('schedules reminder with status pending and scheduledFor when appointment is > 24 hours away', async () => {
      mockStorage.clearOutbox();

      // Submit an appointment scheduled for 3 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await automationRepo.triggerEvent(clinicId, 'appointment.reminder_24h', {
        name: 'مریم احمدی',
        phone: '09121112233',
        service: 'فیلر لب',
        time: '14:00',
        appointmentDateTime: `${futureDateStr}T14:00:00Z`,
      });

      const outbox = mockStorage.getOutboxMessages();
      const reminderMsg = outbox.find((m) => m.recipientPhone === '09121112233');
      expect(reminderMsg).toBeDefined();
      expect(reminderMsg?.scheduledFor).toBeDefined();
      expect(reminderMsg?.status).toBe('pending');
    });
  });

  describe('5. Enable/Disable Automation Toggle', () => {
    it('prevents sending messages when automation rule is disabled', async () => {
      mockStorage.clearOutbox();

      // Disable appointment.created rule
      await automationRepo.setEnabled(clinicId, 'auto-booking-created', false);

      const automations = await automationRepo.getAutomations(clinicId);
      const rule = automations.find((a) => a.id === 'auto-booking-created');
      expect(rule?.enabled).toBe(false);

      // Trigger event while disabled
      await automationRepo.triggerEvent(clinicId, 'appointment.created', {
        name: 'ناهید نادری',
        phone: '09128881122',
        service: 'هایفوتراپی',
        time: '16:00',
      });

      const outbox = mockStorage.getOutboxMessages();
      const message = outbox.find((m) => m.recipientPhone === '09128881122');
      expect(message).toBeUndefined(); // Did not send because rule was disabled
    });
  });
});
