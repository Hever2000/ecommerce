# Deployment Guide

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional)
- Supabase account (or local PostgreSQL)
- Supabase account (for Storage — optional in dev)

### 1. Clone and install

```bash
git clone https://github.com/your-org/premium-ballroom
cd premium-ballroom

# Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### 2. Environment variables

**Backend** (`backend/.env`):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce?schema=public
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
MERCADO_PAGO_ACCESS_TOKEN=your-mp-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@ecommerce.com
CORS_ORIGIN=http://localhost:3001
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Docker Compose (Local)

```bash
docker compose up --build
```

This starts:

- **Backend** on port `3000` (with healthcheck: GET /health)
- **Frontend** on port `3001` (waits for backend healthy)

Both containers run in bridge network `ecommerce-network`.

### Healthcheck

Docker Compose waits for the backend to pass its healthcheck before starting the frontend:

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

---

## Environment Variables Reference

| Variable                     | Required | Description                             |
| ---------------------------- | -------- | --------------------------------------- |
| `NODE_ENV`                   | Yes      | `development`, `production`             |
| `PORT`                       | No       | Backend port (default: 3000)            |
| `DATABASE_URL`               | Yes      | PostgreSQL connection string            |
| `JWT_SECRET`                 | Yes      | Secret for signing JWT tokens           |
| `JWT_ACCESS_EXPIRATION`      | No       | Access token TTL (default: `15m`)       |
| `JWT_REFRESH_EXPIRATION`     | No       | Refresh token TTL (default: `7d`)       |
| `GOOGLE_CLIENT_ID`           | No       | Google OAuth client ID                  |
| `MERCADO_PAGO_ACCESS_TOKEN`  | Yes      | Mercado Pago API access token           |
| `SUPABASE_URL`               | Yes*     | Supabase project URL (*if using Storage)|
| `SUPABASE_SERVICE_KEY`       | Yes*     | Supabase service role key (*if Storage) |
| `RESEND_API_KEY`             | Yes*     | Resend API key (*if using email)        |
| `RESEND_FROM_EMAIL`          | No       | Sender email (default: noreply@...)     |
| `CORS_ORIGIN`                | Yes      | Allowed CORS origin (frontend URL)      |

---

## CI/CD Considerations

### Recommended pipeline

1. **Lint & Type Check** — `npm run lint`, `tsc --noEmit`
2. **Unit Tests** — `npm run test`
3. **Build** — `npm run build` (backend), `npm run build` (frontend)
4. **Docker Build** — Build images, push to registry
5. **Migrate** — `npx prisma migrate deploy` (runs pending migrations)
6. **Deploy** — Pull images on VPS, `docker compose up -d`

### Migration safety

- Migrations run **before** the new application version deploys
- Prisma migrations are backward-compatible (no destructive changes without approval)
- Rollback: deploy previous Docker image + run a down migration if needed

### Secrets in CI

- Use CI/CD secrets (GitHub Actions secrets, GitLab CI variables)
- Use environment variables via Docker Compose or secrets management (never committed)

---

## Healthchecks

Docker Compose runs healthchecks every 30s. Failed healthchecks trigger container restarts (`restart: unless-stopped`).
