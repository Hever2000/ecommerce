-- Migration: 0001_init
-- Description: Initial schema for ecommerce AWS

-- Create custom enums
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'SHIPPED');
CREATE TYPE "ShippingType" AS ENUM ('PICKUP', 'HOME_DELIVERY');

-- Users (admin/employee only)
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ
);

-- Roles
CREATE TABLE "roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "description" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions
CREATE TABLE "permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "description" VARCHAR(255),
    "module" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User-Role junction
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    PRIMARY KEY ("user_id", "role_id")
);

-- Role-Permission junction
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    PRIMARY KEY ("role_id", "permission_id")
);

-- User-Permission overrides
CREATE TABLE "user_permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("user_id", "permission_id")
);

-- Categories (self-referencing tree)
CREATE TABLE "categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(150) NOT NULL UNIQUE,
    "description" TEXT,
    "parent_id" UUID REFERENCES "categories"("id"),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ
);

CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- Attributes (e.g., Color, Size, Material)
CREATE TABLE "attributes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attribute values (e.g., Red, XL, Cotton)
CREATE TABLE "attribute_values" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "attribute_id" UUID NOT NULL REFERENCES "attributes"("id") ON DELETE CASCADE,
    "value" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("attribute_id", "value")
);

-- Products
CREATE TABLE "products" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL,
    "category_id" UUID REFERENCES "categories"("id"),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ
);

CREATE INDEX "products_category_id_idx" ON "products"("category_id");
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- Product-Attribute junction (which attributes this product uses)
CREATE TABLE "product_attributes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "attribute_id" UUID NOT NULL REFERENCES "attributes"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("product_id", "attribute_id")
);

-- Product Variants (each SKU is a variant)
CREATE TABLE "product_variants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "sku" VARCHAR(100) NOT NULL UNIQUE,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- Variant-to-AttributeValue mapping (e.g., variant X has Color=Red, Size=XL)
CREATE TABLE "variant_attribute_values" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
    "attribute_value_id" UUID NOT NULL REFERENCES "attribute_values"("id") ON DELETE CASCADE,
    UNIQUE ("variant_id", "attribute_value_id")
);

-- Product Images (stored in S3, URL in DB)
CREATE TABLE "product_images" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "variant_id" UUID REFERENCES "product_variants"("id"),
    "url" TEXT NOT NULL,
    "alt" VARCHAR(255),
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- Inventory Movements (audit trail for stock changes)
CREATE TABLE "inventory_movements" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
    "type" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" VARCHAR(255),
    "user_id" UUID REFERENCES "users"("id"),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "inventory_movements_variant_id_idx" ON "inventory_movements"("variant_id");

-- Orders (guest checkout, no user relation)
CREATE TABLE "orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "guest_email" VARCHAR(255) NOT NULL,
    "guest_first_name" VARCHAR(100) NOT NULL,
    "guest_last_name" VARCHAR(100) NOT NULL,
    "guest_phone" VARCHAR(20) NOT NULL,
    "guest_address" TEXT NOT NULL,
    "guest_city" VARCHAR(100) NOT NULL,
    "guest_province" VARCHAR(100) NOT NULL,
    "guest_postal_code" VARCHAR(20) NOT NULL,
    "shipping_type" "ShippingType" NOT NULL,
    "shipping_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- Order Items
CREATE TABLE "order_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "variant_id" UUID NOT NULL REFERENCES "product_variants"("id"),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL
);

CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- Payments (Mercado Pago integration)
CREATE TABLE "payments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "mp_preference_id" VARCHAR(255),
    "mp_payment_id" VARCHAR(255),
    "mp_status" VARCHAR(50),
    "mp_status_detail" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");
CREATE INDEX "payments_mp_payment_id_idx" ON "payments"("mp_payment_id");

-- Audit Logs
CREATE TABLE "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(255),
    "user_id" UUID REFERENCES "users"("id"),
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- Enable updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON "roles"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON "categories"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON "products"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON "product_variants"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON "orders"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON "payments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
