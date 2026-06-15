# Architecture Overview

## Stack

| Layer        | Technology                           |
| ------------ | ------------------------------------ |
| Backend      | NestJS 10, TypeScript                |
| Frontend     | Next.js 14, React 18, Tailwind CSS   |
| Database     | PostgreSQL (Supabase)                |
| ORM          | Prisma 5                             |
| Auth         | Passport.js, JWT (access + refresh)  |
| Payments     | Mercado Pago SDK                     |
| Email        | Resend                               |
| Storage      | AWS S3 + CloudFront                  |
| Container    | Docker, Docker Compose               |
| Infra        | Terraform (AWS)                      |
| Monitoring   | CloudWatch, Winston                  |
| API Docs     | Swagger / OpenAPI                    |

## Monolito Modular

The project follows a **Monolito Modular** pattern — a single deployable unit with clear module boundaries. This combines the operational simplicity of a monolith with the conceptual separation of microservices.

### Why not microservices?

- Single team, no need for distributed transactions
- No network overhead between modules
- Simpler deployment (one Docker image)
- Shared database transaction support
- Faster development velocity

### Module isolation rules

1. Each module has its own `controller`, `service`, `dto/`, and `module` definition
2. Modules communicate only through service classes (no cross-module DB access)
3. Shared code lives in `common/` (guards, decorators, pipes, filters, interceptors)
4. Prisma is the single source of truth for the data layer

## Module List

| Module       | Responsibility                                                   |
| ------------ | ---------------------------------------------------------------- |
| Auth         | Login, JWT issuance, token refresh                               |
| Users        | CRUD for admin/employee users, soft delete                       |
| Roles        | Role management, role-permission assignment                      |
| Permissions  | Read-only permission catalog, module filtering                   |
| Products     | Product CRUD, EAV attributes, variants, search/filter/paginate   |
| Categories   | Category CRUD, self-referencing tree (parent/children)           |
| Inventory    | Stock adjustments (ADD/REMOVE/SET), movement audit, low-stock    |
| Orders       | Guest checkout, order tracking, status management                |
| Payments     | Mercado Pago webhook, preference creation, payment tracking      |
| Shipping     | Cost calculation by province, pickup option                      |
| Email        | Transactional emails via Resend (order confirmation, etc.)       |
| Uploads      | S3 file upload (single/multiple), image deletion                 |
| Audit        | Immutable action log for admin operations                        |
| Health       | Liveness (`/health`) and readiness (`/ready`) checks             |

## Data Flow Diagrams

### Guest Checkout Flow

```
Browser                   Backend                    Mercado Pago
  |                          |                            |
  |-- POST /api/v1/orders -->|                            |
  |   { items, guest info }  |  Validate stock            |
  |                          |  Decrement stock           |
  |                          |  Create order (PENDING)    |
  |<-- { orderId, total } ---|                            |
  |                          |                            |
  |-- POST /api/v1/payments/ |                            |
  |    {orderId}/preference  |  Create MP preference      |
  |<-- { preferenceId,      |                            |
  |     initPoint } ---------|                            |
  |                          |                            |
  |-- Redirect to MP ------------> Checkout               |
  |                          |                            |
  |                          |<-- POST /api/v1/payments/  |
  |                          |     webhook (payment)      |
  |                          |  Validate signature        |
  |                          |  Update payment record     |
  |                          |  Update order -> PAID/FAIL |
  |                          |  Send email notification   |
  |                          |  Restore stock on failure  |
```

### Admin Operation Flow

```
Dashboard                  Backend                   Database
  |                          |                          |
  |-- (JWT in header) ------>|                          |
  |   POST /api/v1/products  |  JwtAuthGuard            |
  |                          |  -> extract user         |
  |                          |  RolesGuard              |
  |                          |  -> check role           |
  |                          |  PermissionsGuard        |
  |                          |  -> check permission     |
  |                          |-- Write product -------->|
  |                          |-- Log action ----------->| audit_logs
  |<-- { data: product } ----|                          |
```

### Image Upload Flow

```
Dashboard                  Backend                    S3
  |                          |                          |
  |-- POST /api/v1/uploads/  |  Validate file (5MB    |
  |   single (multipart)     |  max, jpg/png/webp)     |
  |                          |-- PUT object ---------->|
  |                          |  { public-read ACL }    |
  |<-- { url } --------------|                          |
```

## RBAC Model

```
User --< UserRole >-- Role --< RolePermission >-- Permission
  |                                                    |
  +-----------< UserPermission (override) >------------+
```

### Roles

| Role     | Description                      |
| -------- | -------------------------------- |
| ADMIN    | Full system access               |
| EMPLOYEE | Limited operational access       |

### Permissions (16 granulares)

| Permission          | Module     | ADMIN | EMPLOYEE |
| ------------------- | ---------- | ----- | -------- |
| CREATE_PRODUCT      | products   | Yes   | Yes      |
| READ_PRODUCT        | products   | Yes   | Yes      |
| UPDATE_PRODUCT      | products   | Yes   | Yes      |
| DELETE_PRODUCT      | products   | Yes   | No       |
| CREATE_CATEGORY     | categories | Yes   | Yes      |
| READ_CATEGORY       | categories | Yes   | Yes      |
| UPDATE_CATEGORY     | categories | Yes   | Yes      |
| DELETE_CATEGORY     | categories | Yes   | No       |
| VIEW_ORDERS         | orders     | Yes   | Yes      |
| UPDATE_ORDER_STATUS | orders     | Yes   | Yes      |
| MANAGE_EMPLOYEES    | users      | Yes   | No       |
| MANAGE_ROLES        | roles      | Yes   | No       |
| VIEW_INVENTORY      | inventory  | Yes   | Yes      |
| ADJUST_INVENTORY    | inventory  | Yes   | Yes      |
| VIEW_AUDIT_LOGS     | audit      | Yes   | No       |
| MANAGE_SETTINGS     | settings   | Yes   | No       |

## Security Architecture

```
Request
  |
  v
Helmet (headers) + CORS
  |
  v
ThrottlerGuard (rate limit: 100 req/60s)
  |
  v
JwtAuthGuard (checks Bearer token, skips @Public routes)
  |
  v
RolesGuard (checks @Roles decorator)
  |
  v
PermissionsGuard (checks @Permissions decorator)
  |
  v
ValidationPipe (whitelist, forbidNonWhitelisted, transform)
  |
  v
Controller -> Service -> Prisma -> PostgreSQL
```

## Deployment Architecture

```
Internet
  |
  +-- DNS (Route53)
  |
  +-- EC2 (Docker Compose)
  |     +-- Nginx/Caddy (reverse proxy)
  |     +-- Backend container (port 3000)
  |     +-- Frontend container (port 3001)
  |
  +-- S3 + CloudFront (static images, CDN)
  |
  +-- Secrets Manager (JWT, MP, Resend keys)
  |
  +-- CloudWatch (logs + metrics + alarms)
  |
  +-- Supabase (managed PostgreSQL)
```

### Terraform creates

- EC2 instance (t2.micro, Amazon Linux 2023)
- Security group (SSH, HTTP, HTTPS, 3000, 3001)
- S3 bucket (public-read, CORS configured)
- CloudFront distribution (OAC, HTTPS, compress)
- Secrets Manager (JWT, Mercado Pago, Resend)
- CloudWatch log group + CPU alarm

## Architecture Decision Records

Significant decisions are documented in [docs/DECISIONS.md](docs/DECISIONS.md):

| ADR | Decision |
|-----|----------|
| ADR-001 | Monolito Modular over Microservices |
| ADR-002 | Prisma over Raw SQL or TypeORM |
| ADR-003 | Guest Checkout over Customer Accounts |
| ADR-004 | EAV for Product Variants over Fixed Columns |
| ADR-005 | Webhook-Only Payment Updates over Frontend Trust |
| ADR-006 | S3 + CloudFront for Images over Local Storage |
| ADR-007 | Supabase PostgreSQL over Self-Managed RDS |
| ADR-008 | RBAC with Granular Permissions |
