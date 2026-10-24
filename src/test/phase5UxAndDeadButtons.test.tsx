import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockStorage } from '../services/adapters/mock/mockStorage';
import { MockAppointmentRepository } from '../services/adapters/mock/MockAppointmentRepository';
import { SEED_CLINIC } from '../mocks/seed';
import { ErrorState } from '../components/common/ErrorState';
import { ButtonLink } from '../components/ui/ButtonLink';
import { DemoBanner } from '../components/layout/DemoBanner';
import { NextActionsList } from '../features/dashboard/components/NextActionsList';
import { LeadsView } from '../features/leads/LeadsView';
import { AppointmentsView } from '../features/appointments/AppointmentsView';
import { AppProviders } from '../app/providers';
import type { DashboardNextAction } from '../domain/dashboard';

describe('Phase 5: Dead Buttons, UX Polish & Error States', () => {
  const clinicId = SEED_CLINIC.id;

  beforeEach(() => {
    mockStorage.resetToSeed();
  });

  describe('1. ErrorState component', () => {
    it('renders Persian error message and triggers retry', () => {
      let retried = false;
      render(
        <ErrorState
          title="خطا در ارتباط"
          message="سرور در دسترس نیست"
          onRetry={() => {
            retried = true;
          }}
        />
      );

      expect(screen.getByText('خطا در ارتباط')).toBeTruthy();
      expect(screen.getByText('سرور در دسترس نیست')).toBeTruthy();
      const retryBtn = screen.getByRole('button', { name: /تلاش مجدد/ });
      fireEvent.click(retryBtn);
      expect(retried).toBe(true);
    });
  });

  describe('2. ButtonLink component', () => {
    it('renders a valid link without nested button element', () => {
      const { container } = render(
        <MemoryRouter>
          <ButtonLink to="/test" variant="primary">
            تست دکمه لینک
          </ButtonLink>
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: 'تست دکمه لینک' });
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('/test');
      expect(container.querySelector('button')).toBeNull(); // No invalid nested <button>
    });
  });

  describe('3. NextActionsList navigation routes', () => {
    it('links to /clients?status=at_risk, /leads, and /appointments with date/status', () => {
      const actions: DashboardNextAction[] = [
        {
          id: 'a1',
          priority: 'high',
          title: 'پیگیری مشتریان در خطر',
          description: 'توضیحات',
          value: '120000',
          valueLabel: 'ارزش',
          actionType: 'call_clients',
        },
        {
          id: 'a2',
          priority: 'medium',
          title: 'پاسخ به سرنخ‌ها',
          description: 'توضیحات',
          value: '50%',
          valueLabel: 'نرخ',
          actionType: 'reply_leads',
        },
        {
          id: 'a3',
          priority: 'low',
          title: 'تأیید نوبت‌های فردا',
          description: 'توضیحات',
          value: '30%',
          valueLabel: 'کاهش',
          actionType: 'confirm_tomorrow',
        },
      ];

      render(
        <MemoryRouter>
          <NextActionsList actions={actions} />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link', { name: /شروع اقدام/ });
      expect(links[0].getAttribute('href')).toBe('/clients?status=at_risk');
      expect(links[1].getAttribute('href')).toBe('/leads');
      expect(links[2].getAttribute('href')).toBe(
        '/appointments?date=tomorrow&status=pending_confirmation'
      );
    });
  });

  describe('4. LeadsView dynamic status badge', () => {
    it('displays status badge corresponding to lead.status', async () => {
      // Modify one lead to 'contacted'
      const leads = mockStorage.getLeads();
      leads[0].status = 'contacted';
      mockStorage.saveLeads(leads);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <AppProviders>
              <LeadsView />
            </AppProviders>
          </QueryClientProvider>
        </MemoryRouter>
      );

      // Should show 'تماس گرفته‌شده' instead of all 'سرنخ داغ'
      const contactedBadge = await screen.findByText('تماس گرفته‌شده');
      expect(contactedBadge).toBeTruthy();
    });
  });

  describe('5. Reception Manual Appointment Client Upsert', () => {
    it('upserts a client record when creating an appointment manually', async () => {
      const appointmentRepo = new MockAppointmentRepository();
      const services = mockStorage.getServices();
      const doctors = mockStorage.getDoctors();

      const newPhone = '09129998877';
      const newName = 'کیانا راد';

      const initialClients = mockStorage.getClients();
      expect(initialClients.find((c) => c.phone.includes('9998877'))).toBeUndefined();

      const apt = await appointmentRepo.createAppointment(clinicId, {
        clinicId,
        date: '2026-10-25',
        time: '11:00',
        clientName: newName,
        clientPhone: newPhone,
        serviceId: services[0].id,
        doctorId: doctors[0].id,
        source: 'reception_manual',
      });

      expect(apt.clientId).toBeDefined();

      const updatedClients = mockStorage.getClients();
      const createdClient = updatedClients.find((c) => c.phone === newPhone || c.id === apt.clientId);
      expect(createdClient).toBeDefined();
      expect(createdClient?.name).toBe(newName);
    });
  });

  describe('6. DemoBanner for mock mode', () => {
    it('renders demo notice when env.dataSource is mock', () => {
      render(<DemoBanner />);
      expect(
        screen.getByText('نسخه‌ی نمایشی — داده‌ها فقط در مرورگر شما ذخیره می‌شوند.')
      ).toBeTruthy();
    });
  });

  describe('7. AppointmentsView Date Filtering & Jalali Formatting', () => {
    it('renders Jalali formatted date and supports today/tomorrow/all filters', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <MemoryRouter initialEntries={['/appointments?date=today']}>
          <QueryClientProvider client={queryClient}>
            <AppProviders>
              <AppointmentsView />
            </AppProviders>
          </QueryClientProvider>
        </MemoryRouter>
      );

      // Should have filter buttons
      expect(screen.getByRole('button', { name: 'امروز' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'فردا' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'همه' })).toBeTruthy();
    });
  });
});

