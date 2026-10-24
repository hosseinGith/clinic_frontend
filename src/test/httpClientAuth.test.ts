import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpClient, setAuthToken, setAuthHandlers } from '../services/api/httpClient';
import { HttpAuthRepository } from '../services/adapters/http/HttpAuthRepository';

describe('HTTP Client & Auth Refresh Loop Protection (Phase 1)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setAuthToken(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('does NOT trigger refresh loop or logout when /auth/* returns 401', async () => {
    const refreshFn = vi.fn().mockResolvedValue('new-token');
    const logoutFn = vi.fn();
    setAuthHandlers(refreshFn, logoutFn);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Refresh token expired' }),
    });

    // Calling an /auth/* endpoint like /auth/refresh
    await expect(httpClient.post('/auth/refresh')).rejects.toThrow();

    // refreshFn and logoutFn must NOT have been called
    expect(refreshFn).not.toHaveBeenCalled();
    expect(logoutFn).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent 401s into a single refresh request (single-flight)', async () => {
    let refreshCallCount = 0;
    const refreshFn = vi.fn().mockImplementation(async () => {
      refreshCallCount++;
      // Simulate delay in refresh
      await new Promise((res) => setTimeout(res, 50));
      return 'refreshed-jwt-token';
    });
    const logoutFn = vi.fn();
    setAuthHandlers(refreshFn, logoutFn);
    setAuthToken('expired-jwt');

    let requestCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
      requestCount++;
      const authHeader = (options.headers as Record<string, string>)?.['Authorization'];
      if (authHeader === 'Bearer refreshed-jwt-token') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: 'protected-data' }),
        };
      }
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Token expired' }),
      };
    });

    // Launch two concurrent protected requests
    const [res1, res2] = await Promise.all([
      httpClient.get<{ success: boolean; data: string }>('/protected-resource-1'),
      httpClient.get<{ success: boolean; data: string }>('/protected-resource-2'),
    ]);

    expect(res1.data).toBe('protected-data');
    expect(res2.data).toBe('protected-data');
    // Crucial: Single-flight must ensure refreshHandler was called exactly ONCE!
    expect(refreshCallCount).toBe(1);
    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(requestCount).toBe(4);
  });

  it('refreshSession returns newly issued token inside session object', async () => {
    const httpAuthRepo = new HttpAuthRepository();

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/refresh')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'newly-minted-token-xyz',
            user: {
              id: 'usr-1',
              name: 'علی محمدی',
              role: 'doctor',
              role_title: 'پزشک معالج',
              avatar_initials: 'ع',
              phone: '09121110004',
              is_active: true,
              created_at: '1403/01/01',
            },
          }),
        };
      }
      if (urlStr.includes('/auth/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              id: 'usr-1',
              name: 'علی محمدی',
              role: 'doctor',
              role_title: 'پزشک معالج',
              avatar_initials: 'ع',
              phone: '09121110004',
              is_active: true,
              created_at: '1403/01/01',
            },
            active_clinic: {
              id: 'c1',
              slug: 'ariana',
              name: 'کلینیک آریانا',
              tagline: 'کلینیک تخصصی',
              phone: '02188888888',
              address: 'تهران',
              working_hours: '9-20',
            },
            available_clinics: [],
          }),
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });

    const refreshed = await httpAuthRepo.refreshSession();
    expect(refreshed).not.toBeNull();
    expect(refreshed?.token).toBe('newly-minted-token-xyz');
  });
});
