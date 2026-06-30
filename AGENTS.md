# Premium Ballroom — Agent Instructions

## Stack

| Layer | Stack |
|-------|-------|
| Backend | NestJS 10 (modular monolith, 14 modules) |
| Frontend | Next.js 14 App Router + Tailwind CSS + Zustand |
| DB | PostgreSQL (Supabase) + Prisma 5 |
| Auth | JWT (access 15m, refresh 7d) + Google OAuth |
| Payments | Mercado Pago (webhook-only, never trust frontend) |
| Storage | Supabase Storage |
| Infra | Docker Compose |

## Project structure

```
backend/          # NestJS API — path alias @/ → src/
  prisma/         # schema.prisma, migrations, seed.sql
  src/
    common/       # Shared guards, decorators, pipes, interceptors
    modules/      # 14 feature modules (auth, products, orders, payments, …)
    prisma/       # PrismaModule + PrismaService
  test/           # E2E tests (*.e2e-spec.ts, jest-e2e.json)
frontend/         # Next.js 14 App Router
  src/
    app/          # Pages (admin, cart, checkout, products, …)
    components/   # UI components
    lib/          # API client (api.ts), Zustand stores (cart-store.ts, checkout-store.ts)
    context/      # AuthContext.tsx
    types/        # TypeScript types

```

## Dev setup order

```
backend: npm install → npx prisma generate → npx prisma migrate dev → npm run prisma:seed → npm run start:dev
frontend: npm install → npm run dev
```

- `postinstall` hook auto-runs `prisma generate`
- Backend on `:3000`, frontend on `:3001`
- Default admin: `admin@ecommerce.com` / `Admin123!`

## Key commands

### Backend

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Dev server (watch mode) |
| `npm run lint` / `lint:check` | ESLint (fix / check only) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Jest, `*.spec.ts`) |
| `npm run test:e2e` | E2E tests (Supertest, `*.e2e-spec.ts`) |
| `npm run test:cov` | Coverage |
| `npm run prisma:seed` | Seed DB (admin, roles, permissions, categories, products) |
| `npm run prisma:migrate` | `prisma migrate dev` |

### Frontend

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on `:3001` |
| `npm run lint` / `lint:check` | Next.js ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | `next build` (output: standalone) |

## CI pipeline order

```
lint:check → typecheck → test → build
```

CI does NOT run `typecheck` on frontend build step (only `build`). Separate jobs for backend and frontend.

## API conventions

- Global prefix: `/api/v1`
- Swagger: `/api/v1/docs`
- Guards stack: Helmet → CORS → ThrottlerGuard (100 req/60s) → JwtAuthGuard → RolesGuard → PermissionsGuard
- Validation: `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
- Global interceptor: `SerializeInterceptor`
- `@Public()` decorator skips JwtAuthGuard for public routes

## Architecture notes

- **Modular monolith** — modules communicate only via service classes, no cross-module DB access
- **RBAC** — 16 granular permissions, 2 roles (ADMIN/EMPLOYEE), per-user overrides. Permissions embedded in JWT at login
- **Guest checkout** — no signup required to buy. Cart persisted in localStorage via Zustand
- **Payments** — Mercado Pago webhook updates order status. Never trust frontend. Restore stock on failure
- **Inventory** — stock adjustments (ADD/REMOVE/SET) with immutable audit trail per movement
- **Auth** — Refresh token rotation (silent refresh via `api.ts` subscriber pattern). Google OAuth available

## Framework quirks & gotchas

- Backend path alias: `@/` → `src/` (both tsconfig and Jest moduleNameMapper)
- Frontend proxy: Next.js rewrites `/api/:path*` to `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`). In dev, the backend URL is used directly; in production via Docker, Nginx routes `/api/` to the backend container
- Docker: Nginx reverse proxy on port 80 routes `/api/` → backend:3000, `/` → frontend:3001
- `start:prod` runs `prisma migrate deploy` before starting (applies pending migrations). Not for dev
- `seed.sql` uses fixed UUIDs — permissions (`a00...`), roles (`b00...`), admin user (`c00...`)
- E2E tests live in `backend/test/` (not co-located with source)
