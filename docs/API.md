# API Documentation

**Base URL:** `/api/v1`

All timestamps in ISO 8601. All IDs are UUID v4.

Standard response envelope:

```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

Error response:

```json
{
  "statusCode": 400,
  "message": "Validation error details",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/v1/products"
}
```

---

## Auth

| Method | Path                      | Auth     | Description                     |
| ------ | ------------------------- | -------- | ------------------------------- |
| POST   | `/api/v1/auth/login`      | Public   | Login with email + password     |
| POST   | `/api/v1/auth/refresh`    | Public   | Refresh access token            |

### POST /auth/login

```json
// Request
{ "email": "admin@ecommerce.com", "password": "Admin123!" }

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "admin@ecommerce.com",
    "firstName": "Admin",
    "lastName": "Principal",
    "role": "ADMIN",
    "permissions": ["CREATE_PRODUCT", "..."]
  }
}
```

Access token: 15m expiration. Refresh token: 7d expiration.

### POST /auth/refresh

```json
// Request
{ "refreshToken": "eyJ..." }

// Response
{ "accessToken": "eyJ..." }
```

---

## Health

| Method | Path                 | Auth   | Description          |
| ------ | -------------------- | ------ | -------------------- |
| GET    | `/api/v1/health`     | Public | Liveness check       |
| GET    | `/api/v1/ready`      | Public | Readiness + DB check |

### GET /health

```json
{ "status": "ok", "timestamp": "...", "uptime": 12345 }
```

### GET /ready

```json
// Success
{ "status": "ok", "database": "connected", "timestamp": "..." }

// Failure
{ "status": "error", "database": "disconnected", "timestamp": "..." }
```

---

## Products

| Method | Path                         | Auth                         | Description                         |
| ------ | ---------------------------- | ---------------------------- | ----------------------------------- |
| POST   | `/api/v1/products`           | ADMIN, EMPLOYEE + CREATE     | Create product with variants        |
| GET    | `/api/v1/products`           | Public                       | List products (filters + paginate)  |
| GET    | `/api/v1/products/slug/:slug`| Public                       | Get product by slug                 |
| GET    | `/api/v1/products/:id`       | Public                       | Get product by ID                   |
| PUT    | `/api/v1/products/:id`       | ADMIN, EMPLOYEE + UPDATE     | Update product                      |
| DELETE | `/api/v1/products/:id`       | ADMIN, EMPLOYEE + DELETE     | Soft delete product                 |

### GET /products

Query params: `?page=1&limit=10&search=remera&categoryId=uuid&minPrice=1000&maxPrice=50000`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Remera Premium",
      "slug": "remera-premium",
      "description": "Remera de algodón premium",
      "basePrice": 14999.00,
      "categoryId": "uuid",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

---

## Categories

| Method | Path                            | Auth                         | Description                |
| ------ | ------------------------------- | ---------------------------- | -------------------------- |
| POST   | `/api/v1/categories`            | ADMIN, EMPLOYEE + CREATE     | Create category            |
| GET    | `/api/v1/categories`            | Public                       | List all categories        |
| GET    | `/api/v1/categories/tree`       | Public                       | Get category tree          |
| GET    | `/api/v1/categories/slug/:slug` | Public                       | Get category by slug       |
| GET    | `/api/v1/categories/:id`        | Public                       | Get category by ID         |
| PUT    | `/api/v1/categories/:id`        | ADMIN, EMPLOYEE + UPDATE     | Update category            |
| DELETE | `/api/v1/categories/:id`        | ADMIN, EMPLOYEE + DELETE     | Soft delete category       |

### GET /categories/tree

Returns nested structure:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Ropa",
      "slug": "ropa",
      "children": [
        { "id": "uuid", "name": "Hombre", "slug": "ropa-hombre", "children": [] },
        { "id": "uuid", "name": "Mujer", "slug": "ropa-mujer", "children": [] }
      ]
    }
  ]
}
```

---

## Orders

| Method | Path                          | Auth                         | Description                       |
| ------ | ----------------------------- | ---------------------------- | --------------------------------- |
| POST   | `/api/v1/orders`              | Public                       | Create order (guest checkout)     |
| GET    | `/api/v1/orders/:id`          | Public                       | Get order by ID (guest tracking)  |
| GET    | `/api/v1/orders`              | ADMIN, EMPLOYEE + VIEW       | List all orders (admin)           |
| PATCH  | `/api/v1/orders/:id/status`   | ADMIN, EMPLOYEE + UPDATE     | Update order status               |

### POST /orders

```json
// Request
{
  "items": [{ "variantId": "uuid", "quantity": 2 }],
  "guestEmail": "buyer@example.com",
  "guestFirstName": "Juan",
  "guestLastName": "Pérez",
  "guestPhone": "+5491123456789",
  "guestAddress": "Av. Siempre Viva 123",
  "guestCity": "Buenos Aires",
  "guestProvince": "CABA",
  "guestPostalCode": "1424",
  "shippingType": "HOME_DELIVERY"
}

// Response
{
  "data": {
    "id": "uuid",
    "total": 59998.00,
    "subtotal": 59998.00,
    "shippingCost": 1500.00,
    "status": "PENDING",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### GET /orders (admin)

Query params: `?page=1&limit=20&status=PAID`

### PATCH /orders/:id/status

```json
// Request
{ "status": "SHIPPED" }

// Response
{ "data": { "id": "uuid", "status": "SHIPPED", "updatedAt": "..." } }
```

---

## Payments

| Method | Path                                    | Auth                         | Description                     |
| ------ | --------------------------------------- | ---------------------------- | ------------------------------- |
| POST   | `/api/v1/payments/webhook`              | Public                       | Mercado Pago webhook            |
| POST   | `/api/v1/payments/:orderId/preference`  | ADMIN, EMPLOYEE + VIEW       | Create payment preference       |
| GET    | `/api/v1/payments/:orderId`             | ADMIN, EMPLOYEE + VIEW       | Get payments for order          |

### POST /payments/webhook

Receives Mercado Pago IPN notifications. Updates payment and order status. Validates webhook signature (production).

### POST /payments/:orderId/preference

Creates a Mercado Pago payment preference for the order.

```json
// Response
{
  "preferenceId": "pref_uuid_1234567890",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?...",
  "items": [{ "id": "SKU001", "title": "Product", "quantity": 1, "unitPrice": 14999 }],
  "total": 14999
}
```

---

## Shipping

| Method | Path                              | Auth   | Description                |
| ------ | --------------------------------- | ------ | -------------------------- |
| POST   | `/api/v1/shipping/calculate`      | Public | Calculate shipping cost    |
| GET    | `/api/v1/shipping/pickup`         | Public | Get pickup shipping info   |

### POST /shipping/calculate

```json
// Request
{ "province": "CABA", "subtotal": 59998, "itemCount": 2 }

// Response
{ "cost": 1500, "estimatedDays": 3 }
```

---

## Uploads

| Method | Path                         | Auth                         | Description              |
| ------ | ---------------------------- | ---------------------------- | ------------------------ |
| POST   | `/api/v1/uploads/single`     | ADMIN, EMPLOYEE + CREATE     | Upload single file       |
| POST   | `/api/v1/uploads/multiple`   | ADMIN, EMPLOYEE + CREATE     | Upload up to 10 files    |
| DELETE | `/api/v1/uploads/:key`       | ADMIN, EMPLOYEE + UPDATE     | Delete file by URL       |

Validation: max 5MB per file, jpg/jpeg/png/webp only.

### POST /uploads/single

`multipart/form-data` with field `file`.

```json
// Response
{ "url": "https://bucket.s3.amazonaws.com/products/1234567890-image.jpg" }
```

---

## Users (Admin)

| Method | Path                    | Auth            | Description          |
| ------ | ----------------------- | --------------- | -------------------- |
| POST   | `/api/v1/users`         | ADMIN + MANAGE  | Create employee      |
| GET    | `/api/v1/users`         | ADMIN + MANAGE  | List users           |
| GET    | `/api/v1/users/:id`     | ADMIN + MANAGE  | Get user by ID       |
| PUT    | `/api/v1/users/:id`     | ADMIN + MANAGE  | Update user          |
| DELETE | `/api/v1/users/:id`     | ADMIN + MANAGE  | Soft delete user     |

---

## Roles (Admin)

| Method | Path                              | Auth            | Description                  |
| ------ | --------------------------------- | --------------- | ---------------------------- |
| POST   | `/api/v1/roles`                   | ADMIN + MANAGE  | Create role                  |
| GET    | `/api/v1/roles`                   | ADMIN + MANAGE  | List all roles               |
| GET    | `/api/v1/roles/:id`               | ADMIN + MANAGE  | Get role by ID               |
| PUT    | `/api/v1/roles/:id/permissions`   | ADMIN + MANAGE  | Update role permissions      |
| DELETE | `/api/v1/roles/:id`               | ADMIN + MANAGE  | Delete role                  |

---

## Permissions (Admin)

| Method | Path                                | Auth           | Description                  |
| ------ | ----------------------------------- | -------------- | ---------------------------- |
| GET    | `/api/v1/permissions`               | ADMIN          | List all permissions         |
| GET    | `/api/v1/permissions/module/:module`| ADMIN          | Get permissions by module    |

---

## Inventory (Admin)

| Method | Path                                    | Auth                         | Description                       |
| ------ | --------------------------------------- | ---------------------------- | --------------------------------- |
| POST   | `/api/v1/inventory/adjust`              | ADMIN, EMPLOYEE + ADJUST     | Adjust stock (ADD/REMOVE/SET)     |
| GET    | `/api/v1/inventory/low-stock`           | ADMIN, EMPLOYEE + VIEW       | Get low stock alerts              |
| GET    | `/api/v1/inventory/movements/:variantId`| ADMIN, EMPLOYEE + VIEW       | Get inventory movements           |

### POST /inventory/adjust

```json
// Request
{ "variantId": "uuid", "type": "ADD", "quantity": 10, "reason": "Restock" }

// Response
{ "variantId": "uuid", "sku": "REM-NEG-S", "previousStock": 50, "newStock": 60 }
```

### GET /inventory/low-stock

Query: `?threshold=10`

---

## Audit (Admin)

| Method | Path                | Auth            | Description        |
| ------ | ------------------- | --------------- | ------------------ |
| GET    | `/api/v1/audit`     | ADMIN + VIEW    | List audit logs    |

Query: `?page=1&limit=20`

---

## Swagger

Interactive API documentation at:

```
GET /api/v1/docs
```
