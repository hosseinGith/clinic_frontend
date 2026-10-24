import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, setAuthToken } from '../services/api/httpClient';
import {
  HttpAppointmentRepository,
  HttpClientRepository,
  HttpCatalogRepository,
  HttpAuthRepository,
} from '../services/adapters/http';

describe('HTTP Adapters: 404 Null Handling & Single-Flight Refresh', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setAuthToken(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('1. 404 Null Return for getById methods', () => {
    const appointmentRepo = new HttpAppointmentRepository();
    const clientRepo = new HttpClientRepository();
    const catalogRepo = new HttpCatalogRepository();

    it('HttpAppointmentRepository.getAppointmentById returns null on 404 and throws on other errors', async () => {
      // 404 response
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ code: 'NOT_FOUND', message: 'نوبت یافت نشد' }),
      });

      const result = await appointmentRepo.getAppointmentById('ariana', 'non-existent-id');
      expect(result).toBeNull();

      // 500 response -> must throw
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'خطای سرور' }),
      });

      await expect(appointmentRepo.getAppointmentById('ariana', 'err-id')).rejects.toThrow(ApiError);
    });

    it('HttpClientRepository.getClientById returns null on 404 and throws on other errors', async () => {
      // 404 response
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ code: 'NOT_FOUND', message: 'پرونده مراجع یافت نشد' }),
      });

      const result = await clientRepo.getClientById('ariana', 'non-existent-client');
      expect(result).toBeNull();

      // 403 response -> must throw
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'عدم دسترسی' }),
      });

      await expect(clientRepo.getClientById('ariana', 'forbidden-client')).rejects.toThrow(ApiError);
    });

    it('HttpCatalogRepository.getServiceById returns null on 404 and throws on other errors', async () => {
      // 404 response
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ code: 'NOT_FOUND', message: 'خدمت یافت نشد' }),
      });

      const result = await catalogRepo.getServiceById('ariana', 'non-existent-srv');
      expect(result).toBeNull();

      // 500 response -> must throw
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'خطا' }),
      });

      await expect(catalogRepo.getServiceById('ariana', 'err-srv')).rejects.toThrow(ApiError);
    });

    it('HttpCatalogRepository.getDoctorById returns null on 404 and throws on other errors', async () => {
      // 404 response
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ code: 'NOT_FOUND', message: 'پزشک یافت نشد' }),
      });

      const result = await catalogRepo.getDoctorById('ariana', 'non-existent-doc');
      expect(result).toBeNull();

      // 500 response -> must throw
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'خطا' }),
      });

      await expect(catalogRepo.getDoctorById('ariana', 'err-doc')).rejects.toThrow(ApiError);
    });
  });

  describe('2. Single-Flight Refresh in HttpAuthRepository', () => {
    it('concurrent refreshSession calls share one in-flight promise and send only one HTTP request', async () => {
      const authRepo = new HttpAuthRepository();

      let refreshNetworkCalls = 0;
      let meNetworkCalls = 0;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        const urlStr = String(url);

        if (urlStr.includes('/auth/refresh')) {
          refreshNetworkCalls++;
          // Simulate network latency
          await new Promise((resolve) => setTimeout(resolve, 50));
          return {
            ok: true,
            status: 200,
            json: async () => ({
              access_token: 'new-access-token',
              user: {
                id: 'usr-1',
                name: 'دکتر کاوه',
                role: 'owner',
                role_title: 'صاحب کلینیک',
                avatar_initials: 'د',
                phone: '09121110001',
                is_active: true,
                created_at: '2026-10-20T00:00:00Z',
              },
            }),
          };
        }

        if (urlStr.includes('/auth/me')) {
          meNetworkCalls++;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              user: {
                id: 'usr-1',
                name: 'دکتر کاوه',
                role: 'owner',
                role_title: 'صاحب کلینیک',
                avatar_initials: 'د',
                phone: '09121110001',
                is_active: true,
                created_at: '2026-10-20T00:00:00Z',
              },
              active_clinic: {
                id: 'ariana',
                slug: 'ariana',
                name: 'کلینیک آریانا',
                tagline: '',
                phone: '02188888888',
                address: '',
                working_hours: '9 تا 20',
              },
              available_clinics: [],
            }),
          };
        }

        return {
          ok: false,
          status: 404,
          json: async () => ({ message: 'Not found' }),
        };
      });

      // Fire 3 concurrent refresh calls (simulating React StrictMode & multiple components at boot)
      const [res1, res2, res3] = await Promise.all([
        authRepo.refreshSession(),
        authRepo.refreshSession(),
        authRepo.refreshSession(),
      ]);

      // Exactly ONE request to /auth/refresh must have been made
      expect(refreshNetworkCalls).toBe(1);

      // All 3 callers must receive the exact same valid session
      expect(res1).not.toBeNull();
      expect(res1?.token).toBe('new-access-token');
      expect(res1?.user.name).toBe('دکتر کاوه');
      expect(res2).toEqual(res1);
      expect(res3).toEqual(res1);

      // After in-flight promise completes, a new call must initiate a new request
      const subsequentCall = await authRepo.refreshSession();
      expect(refreshNetworkCalls).toBe(2);
      expect(subsequentCall?.token).toBe('new-access-token');
    });
  });
});
