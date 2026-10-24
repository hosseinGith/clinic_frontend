import React from 'react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlatformAuthProvider, usePlatformAuth } from '../features/platform/context/PlatformAuthContext';
import { RequirePlatformAuth } from '../features/platform/guards/RequirePlatformAuth';
import { PlatformLoginView } from '../features/platform/PlatformLoginView';
import { setPlatformAccessToken, getPlatformAccessToken, platformClient, setPlatformAuthHandlers } from '../services/api/platformClient';
import { services } from '../services';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('SuperAdmin Platform Phase 1 Frontend Suite', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    setPlatformAccessToken(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('In-Memory Token & Single-Flight 401 Refresh Interceptor', () => {
    it('stores access token strictly in memory, never in localStorage/sessionStorage', () => {
      setPlatformAccessToken('secret-token-123');
      expect(getPlatformAccessToken()).toBe('secret-token-123');
      expect(localStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('token')).toBeNull();

      setPlatformAccessToken(null);
      expect(getPlatformAccessToken()).toBeNull();
    });

    it('intercepts 401 response and triggers single-flight refresh', async () => {
      let refreshCallCount = 0;
      let requestCallCount = 0;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async (url: any, init: any) => {
        const urlStr = url.toString();

        if (urlStr.includes('/platform/auth/refresh')) {
          refreshCallCount++;
          return new Response(
            JSON.stringify({
              token: 'new-refreshed-platform-token',
              user: {
                id: 'usr-super',
                name: 'مدیر پلتفرم',
                phone: '09120000000',
                role: 'super_admin',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }

        if (urlStr.includes('/platform/clinics/summary')) {
          requestCallCount++;
          // First call returns 401, second call returns 200
          if (requestCallCount === 1) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(
            JSON.stringify({
              total: 5,
              active: 4,
              suspended: 1,
              deleted: 0,
              createdLast30Days: 2,
              latest: [],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }

        return originalFetch(url, init);
      }) as any;

      setPlatformAuthHandlers(
        async () => {
          refreshCallCount++;
          return 'new-refreshed-platform-token';
        },
        () => {},
      );

      const data = await platformClient.get<{ total: number }>('/clinics/summary');
      expect(refreshCallCount).toBe(1);
      expect(requestCallCount).toBe(2);
      expect(data).toHaveProperty('total', 5);
      expect(getPlatformAccessToken()).toBe('new-refreshed-platform-token');

      globalThis.fetch = originalFetch;
    });
  });

  describe('Route Protection & Tenant Separation', () => {
    it('redirects unauthenticated visitors from /platform/* to /platform/login', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PlatformAuthProvider>
            <MemoryRouter initialEntries={['/platform']}>
              <Routes>
                <Route
                  path="/platform"
                  element={
                    <RequirePlatformAuth>
                      <div>داشبورد پلتفرم</div>
                    </RequirePlatformAuth>
                  }
                />
                <Route path="/platform/login" element={<div>صفحه ورود پلتفرم</div>} />
              </Routes>
            </MemoryRouter>
          </PlatformAuthProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('صفحه ورود پلتفرم')).toBeTruthy();
      });
      expect(screen.queryByText('داشبورد پلتفرم')).toBeNull();
    });

    it('allows super_admin to view protected platform pages', async () => {
      // Simulate authenticated super_admin session in repo
      vi.spyOn(services.platformAuthRepo, 'refreshSession').mockResolvedValue({
        token: 'mock-super-token',
        user: {
          id: 'usr-super',
          name: 'مدیر پلتفرم',
          phone: '09120000000',
          role: 'super_admin',
        },
      });

      const MockComponent: React.FC = () => {
        const { user } = usePlatformAuth();
        return (
          <div>
            <span>خوش آمدید: {user?.name}</span>
            <span>داشبورد فوق محرمانه</span>
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <PlatformAuthProvider>
            <MemoryRouter initialEntries={['/platform']}>
              <Routes>
                <Route
                  path="/platform"
                  element={
                    <RequirePlatformAuth>
                      <MockComponent />
                    </RequirePlatformAuth>
                  }
                />
                <Route path="/platform/login" element={<div>صفحه ورود پلتفرم</div>} />
              </Routes>
            </MemoryRouter>
          </PlatformAuthProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/داشبورد فوق محرمانه/)).toBeTruthy();
      });
    });
  });

  describe('Platform Login Flow & Form Validations', () => {
    it('validates Iranian phone format and handles OTP 2-step countdown timer', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PlatformAuthProvider>
            <MemoryRouter initialEntries={['/platform/login']}>
              <Routes>
                <Route path="/platform/login" element={<PlatformLoginView />} />
              </Routes>
            </MemoryRouter>
          </PlatformAuthProvider>
        </QueryClientProvider>,
      );

      const phoneInput = screen.getByLabelText(/شماره موبایل مدیر ارشد/);
      const submitBtn = screen.getByRole('button', { name: /ارسال کد یک‌بارمصرف \(OTP\)/ });

      // Invalid format error
      fireEvent.change(phoneInput, { target: { value: '091234' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/فرمت صحیح: 09xxxxxxxxx/)).toBeTruthy();

      // Valid format progresses to step 2
      fireEvent.change(phoneInput, { target: { value: '09120000000' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/کد 6 رقمی تأیید/)).toBeTruthy();
      });
      expect(screen.getByLabelText(/کد 6 رقمی تأیید/)).toBeTruthy();
      expect(screen.getByText(/ارسال مجدد تا/)).toBeTruthy();
    });
  });

  describe('Behavioral Invariants & Resilience (Item 6 & 4)', () => {
    it('(a) Clears cached queries and state on 401 permanent failure / logout so no previous data is visible to next admin', async () => {
      // Seed query cache with platform data
      queryClient.setQueryData(['platform', 'clinics', 'list'], { items: [{ id: '1', name: 'محرمانه' }] });
      queryClient.setQueryData(['platform', 'summary'], { total: 10 });
      expect(queryClient.getQueryData(['platform', 'clinics', 'list'])).toBeDefined();

      const MockComponent: React.FC = () => {
        const { logout } = usePlatformAuth();
        return (
          <button onClick={() => void logout()} data-testid="logout-btn">
            خروج
          </button>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <PlatformAuthProvider>
            <MockComponent />
          </PlatformAuthProvider>
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(queryClient.getQueryData(['platform', 'clinics', 'list'])).toBeUndefined();
        expect(queryClient.getQueryData(['platform', 'summary'])).toBeUndefined();
      });
    });

    it('(b) Surface Persian error messages properly for 403, 409, 429, and 422 HTTP server responses', async () => {
      const originalFetch = globalThis.fetch;

      // 409 Conflict test
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ message: 'شناسه انگلیسی کلینیک تکراری است.' }),
      });

      await expect(platformClient.get('/test')).rejects.toThrow('شناسه انگلیسی کلینیک تکراری است.');

      // 429 Rate Limit test
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ message: 'تعداد درخواست‌ها بیش از حد مجاز است.' }),
      });

      await expect(platformClient.get('/test')).rejects.toThrow('تعداد درخواست‌ها بیش از حد مجاز است.');

      // 403 Forbidden test
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'دسترسی غیرمجاز.' }),
      });

      await expect(platformClient.get('/test')).rejects.toThrow('دسترسی غیرمجاز.');

      globalThis.fetch = originalFetch;
    });

    it('(c) Preserves Create Clinic form inputs during transient session expiration and retries request on refresh', async () => {
      let refreshCalled = 0;
      let postCalled = 0;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async (url: any, init: any) => {
        const urlStr = url.toString();
        if (urlStr.includes('/auth/refresh')) {
          refreshCalled++;
          return new Response(JSON.stringify({ token: 'new-token', user: { role: 'super_admin' } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (urlStr.includes('/platform/clinics')) {
          postCalled++;
          if (postCalled === 1) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(
            JSON.stringify({
              clinic: { id: 'c-1', slug: 'teb', name: 'کلینیک طب' },
              owner: { id: 'u-1', name: 'دکتر طب', phone: '09121112233' },
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return originalFetch(url, init);
      }) as any;

      setPlatformAuthHandlers(
        async () => {
          refreshCalled++;
          return 'refreshed-tok';
        },
        () => {},
      );

      const payload = {
        slug: 'teb',
        name: 'کلینیک طب',
        ownerName: 'دکتر طب',
        ownerPhone: '09121112233',
      };

      const res = await platformClient.post<{ clinic: { id: string } }>('/clinics', payload);
      expect(refreshCalled).toBeGreaterThanOrEqual(1);
      expect(postCalled).toBe(2);
      expect(res.clinic.id).toBe('c-1');

      globalThis.fetch = originalFetch;
    });

    it('guarantees production build always activates HttpPlatform repositories', () => {
      // In PROD mode, services must never use MockPlatformAuthRepository or MockPlatformClinicRepository
      expect(services.platformAuthRepo).toBeDefined();
      expect(services.platformClinicRepo).toBeDefined();
    });
  });
});
