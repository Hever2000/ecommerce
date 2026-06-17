const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
}

let isRefreshing = false;
let subscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

function onRefreshFailed() {
  subscribers = [];
}

function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth-token');
  localStorage.removeItem('refresh-token');
  localStorage.removeItem('auth-user');
  window.location.href = '/login';
}

async function refreshAccessToken(): Promise<string> {
  const refreshTokenValue = localStorage.getItem('refresh-token');
  if (!refreshTokenValue) throw new Error('No refresh token');

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });

  if (!res.ok) throw new Error('Refresh failed');

  const data = await res.json();
  localStorage.setItem('auth-token', data.accessToken);
  return data.accessToken;
}

async function executeRequest<T>(
  url: string,
  options: RequestInit,
  headers: Record<string, string>
): Promise<T> {
  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data?.message || data?.error || response.statusText,
      response.status,
      data
    );
  }

  return data as T;
}

async function request<T>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    return await executeRequest<T>(url, fetchOptions, headers);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      !endpoint.includes('/auth/refresh')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          onRefreshed(newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          return await executeRequest<T>(url, fetchOptions, headers);
        } catch (refreshError) {
          onRefreshFailed();
          clearAuthAndRedirect();
          throw refreshError;
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise<T>((resolve, reject) => {
        subscribers.push((newToken: string) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          executeRequest<T>(url, fetchOptions, headers).then(resolve, reject);
        });
      });
    }

    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  del: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};
