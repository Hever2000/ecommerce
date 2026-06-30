export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function storeAuth(data: AuthResponse) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth-token', data.accessToken);
  localStorage.setItem('refresh-token', data.refreshToken);
  localStorage.setItem('auth-user', JSON.stringify(data.user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('auth-user');
  return raw ? JSON.parse(raw) : null;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh-token');
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth-token');
  localStorage.removeItem('refresh-token');
  localStorage.removeItem('auth-user');
}

export function getRedirectPath(role: string): string {
  switch (role) {
    case 'ADMIN':
    case 'EMPLOYEE':
      return '/dashboard';
    default:
      return '/';
  }
}
