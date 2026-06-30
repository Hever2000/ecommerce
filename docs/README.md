# Premium Ballroom

Full-featured ecommerce platform with guest checkout, RBAC admin panel, and Mercado Pago payments.

## Quick Start

```bash
# Backend
cd backend
cp .env.example .env   # Edit with your Supabase credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

**Default admin:** `admin@ecommerce.com` / `Admin123!`

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Backend      | **NestJS 10** + TypeScript              |
| Frontend     | **Next.js 14** + React 18 + Tailwind    |
| Database     | **PostgreSQL** via Supabase             |
| ORM          | **Prisma 5**                            |
| Auth         | JWT (access + refresh tokens)           |
| Payments     | Mercado Pago                            |
| Email        | Resend                                  |
| Storage      | Supabase Storage                        |
| Infra        | Docker Compose                          |
| Monitoring   | Winston                                 |

## Project Structure

```
premium-ballroom/
├── backend/                    # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma       # Data model (single source of truth)
│   │   ├── seed.sql            # Seed data (admin, categories, products)
│   │   └── migrations/         # Prisma migration files
│   └── src/
│       ├── main.ts             # App bootstrap (helmet, CORS, validation, Swagger)
│       ├── app.module.ts       # Root module (14 modules imported)
│       ├── prisma/             # Database connection service
│       ├── common/             # Shared layer
│       │   ├── guards/         # JwtAuth, Roles, Permissions
│       │   ├── decorators/     # @Public, @Roles, @Permissions, @CurrentUser
│       │   ├── pipes/          # ParseUUID
│       │   ├── filters/        # HttpException filter (structured errors)
│       │   └── interceptors/   # Transform + Logging
│       └── modules/            # 14 feature modules
│           ├── auth/           # Login, JWT issuance, refresh
│           ├── users/          # Admin/employee CRUD
│           ├── roles/          # Role management
│           ├── permissions/    # Permission catalog
│           ├── products/       # Products + EAV + variants
│           ├── categories/     # Category tree
│           ├── inventory/      # Stock adjustments + audit
│           ├── orders/         # Guest checkout + status
│           ├── payments/       # Mercado Pago webhooks
│           ├── shipping/       # Cost calculation
│           ├── email/          # Transactional emails
│           ├── uploads/        # Supabase Storage file uploads
│           ├── audit/          # Action log
│           └── health/         # Liveness + readiness
├── frontend/                   # Next.js 14 app
│   └── src/
│       ├── lib/
│       │   ├── api.ts          # HTTP client (auto auth token)
│       │   └── cart-store.ts   # Zustand cart (persisted)
│       └── types/              # TypeScript type definitions
└── docker-compose.yml          # Backend + Frontend containers
```

## Available Scripts

### Backend

| Script                | Description                       |
| --------------------- | --------------------------------- |
| `npm run start:dev`   | Start with hot-reload             |
| `npm run build`       | Compile to `dist/`                |
| `npm run start:prod`  | Run compiled production build     |
| `npm run test`        | Run unit tests (Jest)             |
| `npm run test:e2e`    | Run e2e tests (Supertest)         |
| `npm run lint`        | ESLint fix                        |
| `npx prisma studio`   | Open Prisma Studio (DB browser)   |
| `npx prisma migrate dev` | Create/apply migrations        |
| `npm run prisma:seed` | Seed database                     |

### Frontend

| Script           | Description            |
| ---------------- | ---------------------- |
| `npm run dev`    | Start dev server (3001)|
| `npm run build`  | Production build       |
| `npm run start`  | Serve production build |
| `npm run lint`   | Next.js lint           |

## Detailed Documentation

| File              | Description                              |
| ----------------- | ---------------------------------------- |
| `ARCHITECTURE.md` | Stack overview, Monolito Modular, RBAC, data flows, security architecture, deployment diagram |
| `DECISIONS.md`    | 8 Architecture Decision Records (ADR-001 through ADR-008) |
| `DATABASE.md`     | ERD, table relationships, EAV model, indexes, enums, seed data |
| `API.md`          | All endpoints with methods, paths, auth requirements, request/response examples |
| `DEPLOYMENT.md`   | Local setup, Docker Compose, environment variables, CI/CD |
| `SECURITY.md`     | JWT auth, RBAC guards, rate limiting, Helmet, CORS, validation, webhook security, secrets, audit |

## API Documentation

Swagger UI available in development at:

```
http://localhost:3000/api/v1/docs
```
