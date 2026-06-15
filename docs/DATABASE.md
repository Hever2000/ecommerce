# Database Documentation

## Stack

- **Provider:** PostgreSQL (via Supabase)
- **ORM:** Prisma 5 (`prisma-client-js`)
- **Migration:** SQL files in `backend/prisma/migrations/`
- **Seed:** Raw SQL in `backend/prisma/seed.sql`

## ERD Description

### Core Tables

| Table               | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `users`             | Admin & employee accounts only. No buyer accounts (guest checkout) |
| `roles`             | Role definitions (ADMIN, EMPLOYEE)                                 |
| `permissions`       | Granular permission catalog (16 permissions across 6 modules)     |
| `user_roles`        | Many-to-many: users <-> roles                                     |
| `role_permissions`  | Many-to-many: roles <-> permissions                                |
| `user_permissions`  | Direct permission overrides per user (grant/deny)                  |

### Product Tables

| Table                   | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `categories`            | Hierarchical, self-referencing tree via `parent_id`    |
| `products`              | Product base entity with `base_price` and `category`   |
| `attributes`            | EAV attribute definitions (Color, Size, etc.)          |
| `attribute_values`      | Values per attribute (Red, XL, 128GB)                  |
| `product_attributes`    | Which attributes a product uses                        |
| `product_variants`      | SKU-level entity with price, stock per variant         |
| `variant_attribute_values` | Maps a variant to its specific attribute values    |
| `product_images`        | S3 URLs per product (optionally per variant)           |

### Order Tables

| Table                | Description                                       |
| -------------------- | ------------------------------------------------- |
| `orders`             | Guest orders with full customer info denormalized |
| `order_items`        | Line items per order, referencing variants        |
| `payments`           | Mercado Pago payment records per order            |

### Audit Tables

| Table                 | Description                              |
| --------------------- | ---------------------------------------- |
| `inventory_movements` | Immutable stock change log               |
| `audit_logs`          | Immutable admin action log with metadata |

### Relationships

```
categories (parent_id -> self)
categories 1--* products
products 1--* product_variants
products 1--* product_images
products *--* attributes (via product_attributes)
product_variants *--* attribute_values (via variant_attribute_values)
product_variants *--* product_images (variant_id nullable)
product_variants 1--* inventory_movements
orders 1--* order_items
orders 1--* payments
order_items *--1 product_variants
```

### Junction Tables (all many-to-many)

```
user_roles:        users *--* roles
role_permissions:  roles *--* permissions
user_permissions:  users *--* permissions (with granted bool)
product_attributes: products *--* attributes
variant_attribute_values: product_variants *--* attribute_values
```

## Key Modeling Decisions

### EAV for Product Variants

Products have variable attributes depending on category. Instead of fixed columns (e.g., `color`, `size`, `storage`), we use a full EAV model:

- `attributes` defines the axis (Color, Size, Material)
- `attribute_values` defines valid values per axis (Red, XL, Cotton)
- `product_attributes` declares which axes a product uses
- `variant_attribute_values` gives each variant its specific coordinates

This means a T-shirt uses Color+Size, a smartphone uses Color+Storage, with zero schema changes.

### Guest Orders

Orders store all customer data directly on the row (`guest_email`, `guest_first_name`, etc.) rather than linking to a `customers` or `users` table. This makes orders immutable with respect to customer data — even if the customer's email changes, the order record stays accurate.

### Soft Delete

`users`, `categories`, and `products` use a `deleted_at` timestamp for soft delete. All queries filter `WHERE deleted_at IS NULL` by default. This preserves referential integrity and allows recovery.

### Enums as PostgreSQL Native

`OrderStatus` and `ShippingType` are PostgreSQL native enums (not strings in application code). Prisma maps them to TypeScript enums.

## Indexes

| Table                   | Index                          | Type      |
| ----------------------- | ------------------------------ | --------- |
| categories              | `parent_id`                    | B-tree    |
| products                | `category_id`                  | B-tree    |
| products                | `slug`                         | B-tree    |
| product_variants        | `product_id`                   | B-tree    |
| product_variants        | `sku`                          | B-tree    |
| product_images          | `product_id`                   | B-tree    |
| inventory_movements     | `variant_id`                   | B-tree    |
| orders                  | `status`                       | B-tree    |
| orders                  | `created_at`                   | B-tree    |
| order_items             | `order_id`                     | B-tree    |
| payments                | `order_id`                     | B-tree    |
| payments                | `mp_payment_id`                | B-tree    |
| audit_logs              | `action`                       | B-tree    |
| audit_logs              | `entity`                       | B-tree    |
| audit_logs              | `entity_id`                    | B-tree    |
| audit_logs              | `created_at`                   | B-tree    |

Unique indexes on: `users.email`, `roles.name`, `permissions.name`, `categories.slug`, `products.slug`, `product_variants.sku`, `attribute_values(attribute_id, value)`.

## Enums

```sql
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'SHIPPED'
);

CREATE TYPE "ShippingType" AS ENUM (
  'PICKUP', 'HOME_DELIVERY'
);
```

| OrderStatus | Description                              |
| ----------- | ---------------------------------------- |
| PENDING     | Created, awaiting payment                |
| PAID        | Payment approved via webhook             |
| FAILED      | Payment rejected/cancelled               |
| CANCELLED   | Manually cancelled by admin              |
| SHIPPED     | Order dispatched                         |

| ShippingType | Description          |
| ------------ | -------------------- |
| PICKUP       | In-store pickup      |
| HOME_DELIVERY| Ship to address      |

## Seed Data

The `seed.sql` file includes:

1. **16 permissions** — full CRUD across products, categories, orders, users, roles, inventory, audit, settings
2. **2 roles** — ADMIN (all permissions) and EMPLOYEE (product, order, inventory operations)
3. **1 admin user** — `admin@ecommerce.com` / `Admin123!`
4. **9 categories** — 3 root + 6 children (tree structure)
5. **4 attributes** + **15 attribute values** — Color, Size, Storage, Material
6. **6 products** — across categories with attribute assignments
7. **25 variants** — with SKU, price, stock, and attribute value mappings

## Connection String

The database URL is set via the `DATABASE_URL` environment variable:

```
postgresql://user:password@host:port/database?schema=public
```

Example (Supabase):

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres?schema=public
```

The connection is configured in `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
