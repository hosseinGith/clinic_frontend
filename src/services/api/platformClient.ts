import { env } from '../../config/env';

export interface PlatformRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  _isRetry?: boolean;
}

export class PlatformApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    code?: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.name = 'PlatformApiError';
  }
}

// In-memory token storage only - NEVER saved to localStorage or sessionStorage
let platformAccessToken: string | null = null;
let platformRefreshHandler: (() => Promise<string | null>) | null = null;
let platformLogoutHandler: (() => void) | null = null;
let platformRefreshPromise: Promise<string | null> | null = null;

export const setPlatformAccessToken = (token: string | null): void => {
  platformAccessToken = token;
};

export const getPlatformAccessToken = (): string | null => {
  return platformAccessToken;
};

export const setPlatformAuthHandlers = (
  onRefresh: () => Promise<string | null>,
  onLogout: () => void
): void => {
  platformRefreshHandler = onRefresh;
  platformLogoutHandler = onLogout;
};

function isPlatformAuthBypassEndpoint(endpoint: string): boolean {
  return /\/auth\/(otp\/send|otp\/verify|refresh|logout)/.test(endpoint);
}

export const platformClient = {
  async request<T>(endpoint: string, options: PlatformRequestOptions = {}): Promise<T> {
    const { params, headers: customHeaders, _isRetry, ...fetchOptions } = options;

    const base = env.apiBaseUrl.replace(/\/+$/, '');
    let url = endpoint.startsWith('http')
      ? endpoint
      : `${base}/platform${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(platformAccessToken ? { Authorization: `Bearer ${platformAccessToken}` } : {}),
      ...customHeaders,
    };

    try {
      const response = await fetch(url, {
        credentials: 'include', // required for platform_refresh_token cookie
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        // Single-flight refresh on 401 Unauthorized
        if (
          response.status === 401 &&
          !_isRetry &&
          !isPlatformAuthBypassEndpoint(endpoint) &&
          platformRefreshHandler
        ) {
          const hadToken = Boolean(platformAccessToken);
          try {
            if (!platformRefreshPromise) {
              platformRefreshPromise = platformRefreshHandler().finally(() => {
                platformRefreshPromise = null;
              });
            }
            const newToken = await platformRefreshPromise;
            if (newToken) {
              setPlatformAccessToken(newToken);
              return this.request<T>(endpoint, { ...options, _isRetry: true });
            }
          } catch {
            // Refresh failed
          }

          if (hadToken && platformLogoutHandler) {
            setPlatformAccessToken(null);
            platformLogoutHandler();
          }
        }

        let errorData: Record<string, unknown> = {};
        try {
          errorData = (await response.json()) as Record<string, unknown>;
        } catch {
          // Non-JSON response
        }

        const message =
          typeof errorData.message === 'string'
            ? errorData.message
            : `خطای ارتباط با سامانه پلتفرم: ${response.statusText}`;

        const code = typeof errorData.code === 'string' ? errorData.code : undefined;
        const errors =
          errorData.errors && typeof errorData.errors === 'object'
            ? (errorData.errors as Record<string, string[]>)
            : undefined;

        throw new PlatformApiError(response.status, message, code, errors);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof PlatformApiError) throw err;
      throw new PlatformApiError(0, 'خطای ارتباط با شبکه پلتفرم. لطفاً اتصال اینترنت خود را بررسی فرمایید.');
    }
  },

  get<T>(endpoint: string, options?: PlatformRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, data?: unknown, options?: PlatformRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch<T>(endpoint: string, data?: unknown, options?: PlatformRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string, data?: unknown, options?: PlatformRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};
