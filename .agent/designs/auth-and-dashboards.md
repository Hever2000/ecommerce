# Design: Auth & Dashboards

## Architecture Decisions

### AD1: Global Guard Registration via APP_GUARD
- **Context**: Guards exist (JwtAuthGuard, RolesGuard, PermissionsGuard) but are NOT registered globally. Only ThrottlerGuard is in AppModule providers.
- **Decision**: Register three guards in AppModule using `{ provide: APP_GUARD, useClass: ... }`
- **Order**: JwtAuthGuard → RolesGuard → PermissionsGuard
- **Rationale**: APP_GUARD applies globally, respects metadata decorators. Each guard checks its own metadata (`@Public()`, `@Roles()`, `@Permissions()`) and skips if absent.
- **Tradeoff**: Every request goes through guard pipeline (minimal overhead, acceptable)
- **Note**: ThrottlerGuard stays as first guard (already registered)

### AD2: RolesGuard and PermissionsGuard — Already work as-is
- **Context**: Both guards exist in `common/guards/`, read `@Roles()` and `@Permissions()` metadata via Reflector, check against `user.role` and `user.permissions` from request.
- **Decision**: Register them globally. No code changes needed.
- **Note**: They MUST come AFTER JwtAuthGuard because they depend on `user` being populated on the request object.

### AD3: AuthProvider via React Context
- **Context**: Auth state is raw localStorage with no reactivity. `login/page.tsx` calls `storeAuth()` then `router.push()` directly.
- **Decision**: Create `AuthContext` with `AuthProvider` wrapping `RootLayout`. Expose `{ user, isAuthenticated, isLoading, login, logout }`.
- **Rationale**: React Context is sufficient for auth state. Login flow becomes: api call → `AuthContext.login()` → stores auth + sets user state → redirect. Components reactively know auth state.
- **Location**: `frontend/src/context/AuthContext.tsx`

### AD4: Route Protection Strategy — Client-side first, middleware later
- **Context**: Tokens are stored in localStorage. Next.js Middleware (edge runtime) cannot read localStorage — only cookies.
- **Decision**: Phase 1 — Protect `/admin/*` and `/employee/*` via client-side `AuthContext` check in layout/page. If `!isAuthenticated`, redirect to `/login`. Phase 2 (future) — migrate to httpOnly cookies and add `middleware.ts`.
- **Rationale**: Middleware with localStorage tokens is impossible. Client-side redirect is instant, avoids flash of protected content since AuthContext state initializes synchronously on mount from localStorage.
- **Tradeoff**: Client-side check is less secure than server-side middleware, but acceptable for Phase 1. Middleware will be added when cookie-based auth is introduced.

### AD5: Refresh Token Strategy — Queue Pattern with Single Pending Promise
- **Context**: No refresh interceptor exists. Concurrent 401s would each trigger a refresh call.
- **Decision**: Single `isRefreshing` flag + `pendingRequests` queue. While refreshing, all 401s are queued. On success, all retry. On failure, force logout.
- **Rationale**: Prevents race conditions, ensures exactly one refresh call at a time.

### AD6: Logout — Stateless (No-Op server-side for now)
- **Context**: No refresh token table or tokenVersion in Prisma schema. No mechanism to invalidate tokens server-side.
- **Decision**: `POST /auth/logout` returns 200 idempotently. Frontend clears localStorage and context state.
- **Future**: Add `tokenVersion` column to User model, increment on logout, check tokenVersion in JwtStrategy. This invalidates ALL tokens for a user on logout.
- **Rationale**: Avoids schema migration for now. Current tokens are short-lived (15min access, 7d refresh). Risk is minimal for MVP.

## Backend Architecture

### Guard Pipeline Flow

```
Request
  → ThrottlerGuard (already registered)
    → JwtAuthGuard (NEW: globally registered)
      ├─ @Public()? → skip → allow (already implemented)
      └─ Valid JWT?  → user attached to req → next
        → RolesGuard (NEW: globally registered)
          ├─ @Roles('ADMIN')? → check user.role === 'ADMIN'
          ├─ @Roles() empty/no decorator? → allow
          └─ Role doesn't match → 403 Forbidden
          → PermissionsGuard (NEW: globally registered)
            ├─ @Permissions('read:users')? → check all present in user.permissions
            ├─ No @Permissions()? → allow
            └─ Missing any permission → 403 Forbidden
```

### AppModule Changes

```typescript
// backend/src/app.module.ts
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  {
    provide: APP_GUARD,
    useClass: PermissionsGuard,
  },
],
```

### AuthModule — Ensure Reflector and Guards are provided

JwtAuthGuard, RolesGuard, and PermissionsGuard inject `Reflector`. Since they're registered in AppModule (which is the root), `Reflector` is globally available via `@nestjs/core`. No additional providers needed in AuthModule.

However, the guards' dependency on `Reflector` means they must be importable. Since they live in `common/guards/`, they don't need module registration — they're standalone injectables.

### Logout Endpoint

```typescript
// POST /api/v1/auth/logout
// Body: { refreshToken: string }
// Response: { message: 'Logout successful' }
// Behavior: No-op server-side. Returns 200 always (idempotent).
// Future: increment tokenVersion on User model.
```

### AuthController changes

```typescript
@Public() // not needed actually — we want this to work with valid JWT
@Post('logout')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Logout and invalidate refresh token' })
@ApiResponse({ status: 200, description: 'Logout successful' })
async logout(@Body() dto: LogoutDto) {
  return this.authService.logout(dto);
}
```

**Note**: `POST /auth/logout` is NOT `@Public()`. It requires a valid JWT (to identify the user). The frontend sends the access token in Authorization header. This is intentional — we want to know WHO is logging out for future audit logging.

### LogoutDto

```typescript
// backend/src/modules/auth/dto/logout.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

### AuthService logout method

```typescript
async logout(dto: LogoutDto): Promise<{ message: string }> {
  // Future: verify refreshToken, increment tokenVersion for user
  // For now: no-op, return success
  return { message: 'Logout successful' };
}
```

## Frontend Architecture

### AuthContext — React Context Provider

```
frontend/src/context/AuthContext.tsx
```

States:
- `user: AuthUser | null` — the authenticated user
- `isAuthenticated: boolean` — derived from `user !== null`
- `isLoading: boolean` — true on initial mount while reading localStorage

Methods:
- `login(data: AuthResponse): void` — calls `storeAuth(data)`, sets user
- `logout(): Promise<void>` — calls `POST /auth/logout`, then `clearAuth()`, sets user to null

On mount (`useEffect`):
1. Read from localStorage via `getStoredUser()`
2. If user found, set state and `isLoading = false`
3. If not found, `isLoading = false`

```typescript
// Shape
interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
}
```

### Login Page Changes

Current flow: `storeAuth(res)` → `router.push(getRedirectPath(res.user.role))`

New flow: `auth.login(res)` → `router.push(getRedirectPath(res.user.role))`

The login page uses `useAuth()` hook instead of directly calling `storeAuth`.

### API Client with Refresh Interceptor

```
frontend/src/lib/api.ts
```

The `request()` function gains intercept logic:

```
1. Make request with Bearer token
2. If 401:
   a. If already refreshing → queue the request (push to pendingRequests promise array)
   b. If NOT refreshing → set isRefreshing = true
      → POST /auth/refresh with refreshToken from localStorage
      → On success: update tokens in localStorage, retry ALL queued requests with new token
      → On failure: clearAuth(), redirect to /login, reject all queued
      → Finally: isRefreshing = false, clear queue
3. If not 401 → return response
```

```typescript
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

async function refreshToken(): Promise<string> {
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
```

### Root Layout — Wrap with AuthProvider

```typescript
// frontend/src/app/layout.tsx
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
```

### Navbar Changes

The Navbar should react to auth state:
- If authenticated: show user name + logout button
- If not: show login/register links

```typescript
// In Navbar.tsx
const { user, isAuthenticated, logout } = useAuth();
```

### Admin Dashboard Page

```
frontend/src/app/admin/dashboard/page.tsx
```

- `'use client'`
- Uses `useAuth()` to get user
- Client-side protection: if not authenticated or role !== 'ADMIN', redirect to `/login`
- Simple welcome page with user info and placeholder stats

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user.firstName}</p>
      {/* Stats placeholders */}
    </div>
  );
}
```

### Employee Dashboard Page

```
frontend/src/app/employee/dashboard/page.tsx
```

Same pattern as admin but checks for `user?.role === 'EMPLOYEE'`.

### Dashboard Layout (Optional Enhancement)

Consider creating `frontend/src/app/admin/layout.tsx` and `frontend/src/app/employee/layout.tsx` to wrap dashboard pages with a sidebar + header — keeping the pattern consistent with Next.js layout nesting.

```typescript
// frontend/src/app/admin/layout.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="flex">
      <aside>{/* Admin sidebar */}</aside>
      <main>{children}</main>
    </div>
  );
}
```

### AdminDashboard and EmployeeDashboard Sidebar Components

```
frontend/src/components/dashboard/AdminSidebar.tsx
frontend/src/components/dashboard/EmployeeSidebar.tsx
```

Both are simple navigation sidebars with role-specific links. Could share a base layout component if the structure is similar.

## Data Flow

### Login → Dashboard

```
User submits email/password on /login
  → api.post('/auth/login', { email, password })
  → Backend validates credentials → returns AuthResponse
  → auth.login(res) → storeAuth(res) + setUser(user)
  → getRedirectPath(user.role) → '/admin/dashboard' or '/employee/dashboard'
  → router.push(redirectPath)
  → Dashboard layout: useAuth() → user is already set → renders content
```

### Protected API Call with Auto-Refresh

```
Component calls api.get('/some/protected/resource')
  → request() adds Authorization: Bearer {accessToken}
  → Server responds 401 (expired token)
  → request() interceptor:
    ├─ isRefreshing=false → set=true, call refreshToken()
    │   → POST /auth/refresh { refreshToken }
    │   → On success: update accessToken in localStorage, retry original request
    │   → On failure: clearAuth(), window.location.href = '/login'
    └─ isRefreshing=true → queue request as pending promise
  → Component receives data
```

### Logout Flow

```
User clicks "Logout" in Navbar
  → auth.logout()
    → api.post('/auth/logout', { refreshToken })
    → clearAuth() (removes all localStorage items)
    → setUser(null)
    → router.push('/login')
  → UI immediately reflects unauthenticated state
```

## Files to Create/Modify

### Backend

| File | Action | Description |
|------|--------|-------------|
| `backend/src/app.module.ts` | MODIFY | Add APP_GUARD providers for JwtAuthGuard, RolesGuard, PermissionsGuard |
| `backend/src/modules/auth/auth.controller.ts` | MODIFY | Add POST /auth/logout endpoint |
| `backend/src/modules/auth/auth.service.ts` | MODIFY | Add logout() method (no-op, returns success) |
| `backend/src/modules/auth/dto/logout.dto.ts` | CREATE | `{ refreshToken: string }` with class-validator decorators |

### Frontend

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/context/AuthContext.tsx` | CREATE | AuthProvider component + useAuth() hook |
| `frontend/src/lib/api.ts` | MODIFY | Add refresh interceptor with queue pattern |
| `frontend/src/app/layout.tsx` | MODIFY | Wrap children with AuthProvider |
| `frontend/src/app/login/page.tsx` | MODIFY | Use `auth.login()` instead of direct `storeAuth()` |
| `frontend/src/app/admin/dashboard/page.tsx` | CREATE | Admin dashboard page (role-guarded) |
| `frontend/src/app/admin/layout.tsx` | CREATE | Admin layout with sidebar + role guard |
| `frontend/src/app/employee/dashboard/page.tsx` | CREATE | Employee dashboard page (role-guarded) |
| `frontend/src/app/employee/layout.tsx` | CREATE | Employee layout with sidebar + role guard |
| `frontend/src/components/dashboard/AdminSidebar.tsx` | CREATE | Sidebar nav for admin (links to admin-specific pages) |
| `frontend/src/components/dashboard/EmployeeSidebar.tsx` | CREATE | Sidebar nav for employee (links to employee-specific pages) |
| `frontend/src/components/layout/Navbar.tsx` | MODIFY | Add auth-aware UI (user name, logout button) |

## Key Patterns & Conventions

1. **Guard pipeline order**: ThrottlerGuard → JwtAuthGuard (sets user) → RolesGuard (checks role) → PermissionsGuard (checks permissions). Order matters because RolesGuard and PermissionsGuard depend on `req.user` being populated.

2. **@Public() decorator**: Already works in JwtAuthGuard. Apply to any endpoint that should be accessible without authentication (login, register, refresh, public product listing, etc.). Controllers like `HealthController` would also need `@Public()` since the global guard would otherwise require a token.

3. **Client-side route protection**: Dashboard layouts check auth state on mount and redirect to `/login` if unauthorized. This is a soft guard — the real server-side protection is the backend guard pipeline returning 403 for unauthorized role/permission access.

4. **Refresh token queue**: The `isRefreshing` flag + `pendingRequests` array pattern is critical to prevent a thundering herd of refresh requests. The interceptor is only in `request()` — not in raw `fetch` calls.

5. **AuthContext initialization**: On mount, syncs from localStorage immediately (synchronous). The `isLoading` flag handles the brief moment before state is set. After that, all auth state lives in React state — localStorage is only for persistence across page reloads.

## Potential Pitfalls

1. **Health endpoint will 401**: The `/api/v1/health` endpoint (or any public route without `@Public()`) will fail once JwtAuthGuard is global. Ensure ALL public endpoints have `@Public()`.

2. **Refresh endpoint must remain @Public()**: Currently `POST /auth/refresh` has `@Public()` — it MUST stay public because it's called when the access token is expired.

3. **Logout is NOT @Public()**: The logout endpoint requires a valid JWT. This is intentional — we need to know who's logging out. The frontend sends the (not-yet-expired) access token.

4. **Circular dependency risk**: JwtAuthGuard injecting services that import AuthModule could cause circular deps. Current design avoids this (guards only use Reflector, no service injection).

5. **Middleware ordering in AppModule**: APP_GUARD providers are called in the order they're registered. ThrottlerGuard first, then JwtAuthGuard, RolesGuard, PermissionsGuard. This is correct.
