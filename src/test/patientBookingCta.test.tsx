import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientView } from '../features/patient/PatientView';

// Mock contexts
vi.mock('../app/contexts', () => ({
  useAuth: () => ({
    user: { id: 'patient-1', name: 'سارا احمدی', phone: '09121112233', role: 'patient' },
    actor: { id: 'patient-1', name: 'سارا احمدی', phone: '09121112233', role: 'patient' },
    logout: vi.fn(),
    updateProfileName: vi.fn(),
  }),
  useClinic: () => ({
    clinic: {
      id: 'clinic-1',
      name: 'کلینیک نمونه',
      slug: 'sample-clinic',
      address: 'خیابان ولیعصر',
      workingHours: '8 الی 20',
    },
    clinicId: 'clinic-1',
  }),
}));

// Mock services
vi.mock('../services', () => ({
  services: {
    appointmentRepo: {
      getAppointments: vi.fn().mockResolvedValue([]),
      updateStatus: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('PatientView Direct Appointment Booking', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PatientView />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('renders primary "رزرو نوبت جدید" ButtonLink pointing to /book/:clinicSlug in the header', () => {
    renderComponent();
    const bookButton = screen.getByRole('link', { name: /رزرو نوبت جدید/ });
    expect(bookButton).toBeTruthy();
    expect(bookButton.getAttribute('href')).toBe('/book/sample-clinic');
  });

  it('renders interactive booking banner and "ثبت درخواست نوبت" action button', () => {
    renderComponent();
    expect(
      screen.getByText('نیاز به دریافت خدمت درمانی یا زیبایی جدید دارید؟')
    ).toBeTruthy();
    expect(
      screen.getByText(/می‌توانید خدمت، پزشک معالج و ساعت خالی دلخواه خود را به‌صورت برخط و آنی ثبت فرمایید/)
    ).toBeTruthy();

    const bannerButton = screen.getByRole('link', { name: 'ثبت درخواست نوبت' });
    expect(bannerButton).toBeTruthy();
    expect(bannerButton.getAttribute('href')).toBe('/book/sample-clinic');
  });

  it('no longer renders the passive reception notice', () => {
    renderComponent();
    expect(
      screen.queryByText(/برای رزرو نوبت جدید، با پذیرش کلینیک تماس بگیرید/)
    ).toBeNull();
  });
});
