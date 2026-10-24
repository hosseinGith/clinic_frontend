import { env } from '../../config/env';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  _isRetry?: boolean;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let logoutHandler: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

function isAuthBypassEndpoint(endpoint: string): boolean {
  return /\/auth\/(otp|refresh|logout)/.test(endpoint);
}

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setAuthHandlers = (
  onRefresh: () => Promise<string | null>,
  onLogout: () => void
) => {
  refreshHandler = onRefresh;
  logoutHandler = onLogout;
};

export const httpClient = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers: customHeaders, _isRetry, ...fetchOptions } = options;

    let url = endpoint.startsWith('http') ? endpoint : `${env.apiBaseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined) searchParams.append(key, String(val));
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...customHeaders,
    };

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        // Handle 401 Unauthorized: bypass for /auth/*, single-flight refresh, and trigger logout only if user had session
        if (
          response.status === 401 &&
          !_isRetry &&
          !isAuthBypassEndpoint(endpoint) &&
          refreshHandler
        ) {
          const hadSession = Boolean(authToken);
          try {
            if (!refreshPromise) {
              refreshPromise = refreshHandler().finally(() => {
                refreshPromise = null;
              });
            }
            const newToken = await refreshPromise;
            if (newToken) {
              setAuthToken(newToken);
              return this.request<T>(endpoint, { ...options, _isRetry: true });
            }
          } catch {
            // refresh failed
          }
          if (hadSession && logoutHandler) {
            setAuthToken(null);
            logoutHandler();
          }
        }

        let errorData: Record<string, unknown> = {};
        try {
          errorData = (await response.json()) as Record<string, unknown>;
        } catch {
          // Response body was not JSON
        }

        const message =
          typeof errorData.message === 'string'
            ? errorData.message
            : `خطای ارتباط با سرور: ${response.statusText}`;

        const errors =
          errorData.errors && typeof errorData.errors === 'object'
            ? (errorData.errors as Record<string, string[]>)
            : undefined;

        throw new ApiError(response.status, message, errors);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, 'خطای ارتباط با شبکه. لطفاً اتصال اینترنت خود را بررسی کنید.');
    }
  },

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
