# Security Policy

## Supported Versions

This project is in active development. Security patches will be applied to the latest version.

## Reporting a Vulnerability

If you discover a security vulnerability, please do NOT file a public issue. Instead, email the project maintainer directly. We will respond within 48 hours with a plan to address the issue.

---

## Authentication (JWT)

The API uses **JSON Web Tokens** (JWT) for authentication, implemented via `@nestjs/jwt` and `passport-jwt`.

### Token types

| Token        | TTL  | Purpose                  |
| ------------ | ---- | ------------------------ |
| Access Token | 15m  | Authenticates API calls  |
| Refresh Token | 7d  | Obtains new access tokens |

### JWT Payload

```typescript
interface JwtPayload {
  sub: string;          // User ID
  email: string;        // User email
  role: string;         // Primary role name
  permissions: string[]; // All resolved permission names
  iat?: number;         // Issued at
  exp?: number;         // Expires at
}
```

Permissions are embedded in the JWT at login time — no extra database query on each request.

### Login flow

1. User posts `{ email, password }` to `/api/v1/auth/login`
2. Server validates credentials via bcrypt compare
3. Server loads user roles + role permissions from database
4. Server signs an access token (15m) + refresh token (7d)
5. Tokens returned to client

### Refresh flow

1. Client posts `{ refreshToken }` to `/api/v1/auth/refresh`
2. Server verifies the refresh token
3. Server re-checks user is still active
4. Server signs a new access token

---

## Authorization (RBAC)

Three-layer authorization model:

| Layer              | Mechanism                      | File                        |
| ------------------ | ------------------------------ | --------------------------- |
| Authentication     | `JwtAuthGuard`                 | `common/guards/jwt-auth.guard.ts` |
| Role check         | `RolesGuard` + `@Roles()`      | `common/guards/roles.guard.ts` |
| Permission check   | `PermissionsGuard` + `@Permissions()` | `common/guards/permissions.guard.ts` |

### Global guard registration

`JwtAuthGuard` is the default for all routes. Routes marked with `@Public()` bypass authentication:

```typescript
@Public()
@Get('health')
health() { ... }
```

---

## Guards

### JwtAuthGuard

- Extends Passport's `AuthGuard('jwt')`
- Checks for `Bearer <token>` in `Authorization` header
- Validates token signature and expiration
- Skips authentication for `@Public()` decorated routes
- Returns 401 with `Invalid or expired token` on failure

### RolesGuard

- Reads `@Roles()` metadata from the route handler
- Compares against `user.role` from the JWT payload
- Returns 403 if role doesn't match
- Allows request if no roles are specified

### PermissionsGuard

- Reads `@Permissions()` metadata from the route handler
- Checks ALL required permissions exist in `user.permissions[]`
- Returns 403 with `Insufficient permissions` if any permission is missing
- Allows request if no permissions are specified

### Decorators

```typescript
@Roles('ADMIN')
@Permissions('CREATE_PRODUCT', 'UPDATE_PRODUCT')
```

### Usage chain on a route

```typescript
@Post()
@ApiBearerAuth()
@Roles('ADMIN', 'EMPLOYEE')
@Permissions('CREATE_PRODUCT')
create(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

---

## Rate Limiting

Configured via `@nestjs/throttler`:

```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,    // 60 seconds window
  limit: 100,    // 100 requests per window
}])
```

- Applied globally via `APP_GUARD: ThrottlerGuard`
- 100 requests per 60 seconds per IP
- Returns 429 `Too Many Requests` when exceeded

---

## Helmet

Enabled via `helmet` middleware:

```typescript
app.use(helmet());
```

Sets secure HTTP headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0`
- `Strict-Transport-Security` (when served over HTTPS)
- Removes `X-Powered-By` header

---

## CORS

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});
```

- In development: allows `http://localhost:3001`
- In production: restricted to the actual frontend domain
- Credentials enabled for cookie-based flows if needed

---

## Input Validation

Global `ValidationPipe` with strict settings:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,               // Strip unknown properties
    forbidNonWhitelisted: true,    // Throw on unknown properties
    transform: true,               // Auto-transform types
  }),
);
```

- Uses `class-validator` decorators on DTOs
- `ParseUUIDPipe` validates UUID format for all ID parameters
- File uploads validated by `MaxFileSizeValidator` (5MB) and `FileTypeValidator` (jpg/jpeg/png/webp)

---

## Payment Webhook Security

The Mercado Pago webhook at `POST /api/v1/payments/webhook`:

- Currently accepts public requests (signature validation marked as TODO)
- **Production requirement**: Validate `x-signature` header against Mercado Pago's signing secret
- Payment status is set server-side only — never from frontend
- On payment failure, stock is automatically restored
- All webhook payloads are logged for audit

---

## Secrets Management

### Local development

Secrets stored in `backend/.env` and `frontend/.env.local` (gitignored). Template files in `.env.example`.

### Production (AWS)

Secrets stored in **AWS Secrets Manager**:

| Secret            | Stored In          |
| ----------------- | ------------------ |
| JWT_SECRET        | Secrets Manager    |
| MERCADO_PAGO_ACCESS_TOKEN | Secrets Manager |
| RESEND_API_KEY    | Secrets Manager    |

Terraform creates the secret and passes its ARN to the EC2 instance via user-data.

### What is NEVER committed

- `.env` files
- `credentials.json`
- Any file containing tokens, keys, or passwords
- Terraform `.tfvars` with secrets

---

## Audit Logging

All sensitive operations are logged to the `audit_logs` table:

```typescript
model AuditLog {
  id        String   @id @default(uuid())
  action    String   // e.g., "USER_CREATED", "PRODUCT_DELETED"
  entity    String   // e.g., "users", "products"
  entityId  String?  // ID of the affected record
  userId    String?  // Who performed the action
  metadata  Json?    // Arbitrary context data
  ipAddress String?  // Client IP
  createdAt DateTime
}
```

- Audit logs are append-only (no update/delete)
- `inventory_movements` table provides a similar audit trail for stock changes

### Logged actions (examples)

- User creation/deletion
- Product CRUD
- Order status changes
- Stock adjustments
- Role/permission changes

---

## Security Checklist for Production

- [ ] Generate a strong random JWT_SECRET (64+ chars)
- [ ] Implement Mercado Pago webhook signature validation
- [ ] Restrict CORS_ORIGIN to production domain
- [ ] Enable HTTPS via ACM + Route53 (not just CloudFront default cert)
- [ ] Restrict S3 bucket to CloudFront OAI only (remove public access)
- [ ] Add Nginx/Caddy reverse proxy on EC2 (don't expose 3000/3001 directly)
- [ ] Set up WAF in front of CloudFront
- [ ] Enable CloudTrail for AWS API audit
- [ ] Rotate secrets regularly via Secrets Manager
- [ ] Run `npm audit` before each deployment
