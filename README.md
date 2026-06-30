<p align="center">
  <img src="https://img.shields.io/badge/status-development-yellow" alt="Status">
  <img src="https://img.shields.io/badge/backend-NestJS_10-ea2845" alt="NestJS">
  <img src="https://img.shields.io/badge/frontend-Next.js_14-000000" alt="Next.js">
  <img src="https://img.shields.io/badge/DB-PostgreSQL-336791" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/ORM-Prisma_5-2D3748" alt="Prisma">
  <img src="https://img.shields.io/badge/payments-Mercado_Pago-00B1EA" alt="Mercado Pago">
</p>

# Premium Ballroom

Full-featured ecommerce platform with guest checkout, RBAC admin panel, and Mercado Pago payments.

Built with **NestJS 10** (modular monolith) + **Next.js 14** (App Router) + **PostgreSQL** (Supabase) + **Supabase Storage**.

## Features

- **Guest checkout** — buy without signing up. Zero friction.
- **RBAC admin panel** — granular permissions (16 permissions, 2 roles, per-user overrides).
- **Product catalog** — EAV attributes, SKU variants, category tree, search + filter + paginate.
- **Mercado Pago payments** — webhook-only status updates (never trust the frontend).
- **Inventory management** — stock adjustments with immutable audit trail.
- **Supabase Storage** — image uploads with built-in CDN.
- **Docker Compose** — one command to run the full stack.
- **Swagger** — auto-generated API docs at `/api/v1/docs`.

## Architecture

```
                    ┌──────────────┐
                    │  VPS (Docker) │
                    │              │         ┌──────────────┐
                    │  Nginx       │         │  Supabase    │
                    │  (proxy/SSL) │         │  PostgreSQL  │
                    │  Frontend    │         │  + Storage   │
                    │  :3001       │         └──────▲───────┘
                    │  Backend     │────────────────┘
                    │  :3000       │
                    └──────────────┘
```

[Full architecture →](ARCHITECTURE.md) | [Security →](SECURITY.md) | [Deployment →](DEPLOYMENT.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | **NestJS 10** + TypeScript |
| Frontend | **Next.js 14** (App Router) + React 18 + Tailwind CSS |
| Database | **PostgreSQL** via Supabase |
| ORM | **Prisma 5** |
| Auth | JWT (access 15m + refresh 7d) + Google OAuth |
| Payments | Mercado Pago (webhook-driven) |
| Email | Resend (transactional) |
| Storage | Supabase Storage |
| Infra | Docker Compose |
| Monitoring | Winston |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/premium-ballroom
cd premium-ballroom

# 2. Backend
cd backend
cp .env.example .env   # Edit with your credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed     # Creates admin user, categories, products
npm run start:dev       # http://localhost:3000

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev             # http://localhost:3001
```

> **Default admin:** `admin@ecommerce.com` / `Admin123!`

### Docker (alternative)

```bash
docker compose up --build
```

## Project Structure

```
premium-ballroom/
├── backend/                    # NestJS API (monolito modular)
│   ├── prisma/
│   │   ├── schema.prisma       # Data model
│   │   ├── seed.sql            # Seed data
│   │   └── migrations/         # Prisma migrations
│   └── src/
│       ├── main.ts             # Bootstrap (helmet, CORS, validation, Swagger)
│       ├── app.module.ts       # Root module (14 modules)
│       ├── prisma/             # Database service
│       ├── common/             # Shared: guards, decorators, pipes, filters
│       └── modules/            # 14 feature modules
├── frontend/                   # Next.js 14 App Router
│   └── src/
│       ├── app/                # Pages (App Router)
│       ├── components/         # UI components
│       ├── lib/                # API client, auth, cart store
│       └── types/              # TypeScript types
├── docs/                       # Supplementary docs
├── docker-compose.yml          # Full stack containers
├── ARCHITECTURE.md
├── SECURITY.md
├── DEPLOYMENT.md
└── CONTRIBUTING.md
```

## Available Scripts

### Backend

| Script | Description |
|--------|------------|
| `npm run start:dev` | Hot-reload development |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run production build |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | E2e tests (Supertest) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run prisma:seed` | Seed database |

### Frontend

| Script | Description |
|--------|------------|
| `npm run dev` | Dev server on `:3001` |
| `npm run build` | Production build |
| `npm run lint` | Next.js lint |
| `npm run format` | Prettier |



## Environment Variables

See `.env.example` in each app directory:

- [Backend](backend/.env.example) — 16 variables (DB, JWT, MP, Supabase, Resend, CORS)
- [Frontend](frontend/.env.example) — 2 variables (API URL, Google Client ID)

## Documentation

| Document | Description |
|----------|------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, Monolito Modular, RBAC, data flows, security, deployment |
| [SECURITY.md](SECURITY.md) | JWT auth, RBAC guards, rate limiting, Helmet, CORS, secrets |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Local setup, Docker, CI/CD |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [API.md](docs/API.md) | All endpoints with examples |
| [DATABASE.md](docs/DATABASE.md) | ERD, indexes, enums, EAV model |

## License

[MIT](LICENSE)
