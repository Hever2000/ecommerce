# Architecture Decision Records

## ADR-001: Monolito Modular over Microservices

**Status:** Accepted

**Context:** We needed an architecture for a single-team ecommerce project. Microservices would introduce distributed transaction complexity, network overhead, and operational burden.

**Decision:** Use a Monolito Modular pattern — a single NestJS application with clearly separated modules (each with its own controller, service, DTOs, and module file). Modules communicate through service classes, not through the database.

**Consequences:**
- One Docker container to build and deploy
- ACID transactions across the entire order/payment flow
- No network latency between modules
- Cannot scale modules independently (not a concern at this scale)
- Enforces discipline: no cross-module DB access, only service-level calls

## ADR-002: Prisma over Raw SQL or TypeORM

**Status:** Accepted

**Context:** We needed an ORM with strong TypeScript integration, safe migrations, and compatibility with Supabase PostgreSQL.

**Decision:** Use Prisma 5 as the data access layer.

**Consequences:**
- Auto-generated types from the schema — zero type drift
- Declarative migration files (SQL-based, inspectable)
- Prisma Client is thin and performant
- Supabase works with any PostgreSQL-compatible ORM — Prisma fits naturally
- N+1 queries require explicit `include` — prevents lazy loading surprises
- Schema file is the single source of truth for the data model

## ADR-003: Guest Checkout over Customer Accounts

**Status:** Accepted

**Context:** Requiring account creation before purchase increases friction and cart abandonment. Most buyers will not return — they just want to buy once.

**Decision:** Implement guest-only checkout. Orders store customer information directly on the `orders` table (`guest_email`, `guest_first_name`, etc.) with no `user_id` foreign key.

**Consequences:**
- Zero auth infrastructure for buyers (no signup, no password reset)
- Orders are self-contained — no JOIN needed to get customer data
- No customer account management (no profile, no order history login)
- Order tracking uses the order ID returned at creation
- Admin panel is the only place with auth (JWT for employees)
- Simplifies the frontend significantly (no auth forms for buyers)

## ADR-004: EAV for Product Variants over Fixed Columns

**Status:** Accepted

**Context:** Products need different attributes (Color, Size, Storage, Material). Fixed columns would require schema changes for each new attribute type across different product categories.

**Decision:** Use an Entity-Attribute-Value pattern for product attributes:

```
Attribute (Color) -> AttributeValue (Red, Blue, XL)
Product -> ProductAttribute (Product X uses Color, Size)
ProductVariant -> VariantAttributeValue (Variant X has Color=Red, Size=XL)
```

**Consequences:**
- Adding new attribute types requires zero schema changes
- Querying by attribute values is more complex (multiple JOINs)
- Supports any product category without customization
- Seed data includes 4 attributes and 15 values as examples
- Each variant's combination is stored explicitly in `variant_attribute_values`

## ADR-005: Webhook-Only Payment Updates over Frontend Trust

**Status:** Accepted

**Context:** Frontend callbacks for payment status can be tampered with. Relying on client-side "success" redirects is a security risk.

**Decision:** Payment status is updated ONLY via Mercado Pago webhooks (`POST /api/v1/payments/webhook`). The frontend never directly updates payment or order status.

**Consequences:**
- Payment status is authoritative — verified server-side
- Webhook signature validation must be implemented in production
- Frontend polls order status after redirect to MP
- On payment failure, stock is automatically restored
- Complete audit trail in the `payments` table

## ADR-006: Supabase Storage for Images over Local Storage

**Status:** Accepted

**Context:** Product images need to be served fast, at scale, without bloating the application server.

**Decision:** Store images in Supabase Storage (S3-compatible, built-in CDN). The application server handles upload validation, then pushes to Supabase.

**Consequences:**
- Images served from Supabase CDN — low latency globally
- Application server disk stays clean (no static file serving)
- Supabase Storage bucket with RLS policies for security
- Upload size limit: 5MB per file, jpg/jpeg/png/webp only
- No separate CloudFront distribution to manage
- Storage usage tracked in Supabase dashboard

## ADR-007: Supabase PostgreSQL over Self-Managed RDS

**Status:** Accepted

**Context:** We needed a PostgreSQL database with minimal operational overhead and a generous free tier.

**Decision:** Use Supabase for managed PostgreSQL hosting.

**Consequences:**
- Free tier: 500MB database, auth, API, real-time
- Managed backups, SSL, connection pooling
- Supabase is standard PostgreSQL — fully compatible with Prisma
- No need to manage RDS instances or replication
- Easy to migrate to RDS if needed (same PostgreSQL protocol)
- Supabase dashboard provides a convenient UI for data browsing

## ADR-008: RBAC with Granular Permissions

**Status:** Accepted

**Context:** Simple role-based access (admin vs employee) was not flexible enough. We needed the ability to grant or deny specific actions per role, and optionally per user.

**Decision:** Implement a three-layer RBAC system:

```
User -> Roles -> Permissions (many-to-many)
User -> Permissions (direct overrides, grant/deny)
```

**Consequences:**
- 16 granular permissions across 6 modules (products, categories, orders, users, roles, inventory, audit, settings)
- ADMIN role gets all permissions; EMPLOYEE gets a curated subset
- Permission checks use a dedicated `PermissionsGuard` with `@Permissions()` decorator
- User-specific overrides via `user_permissions` table
- JWT payload includes all permissions — no extra DB query on each request
- Permission names follow the `VERB_RESOURCE` convention
