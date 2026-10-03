-- ==============================================================================
-- ENTERPRISE E-COMMERCE PLATFORM - PHASE 2 MIGRATION
-- Core Schema, RLS Policies, Functions, and Triggers
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom User Roles
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'super_admin',
        'store_manager',
        'support_agent',
        'customer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Order Status Progression
DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM (
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Promotional Discount Types
DO $$ BEGIN
    CREATE TYPE public.discount_type AS ENUM (
        'percentage',
        'fixed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Helper Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


-- 2. USERS TABLE (EXTENDING AUTH.USERS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text NOT NULL,
    role public.user_role NOT NULL DEFAULT 'customer'::public.user_role,
    stripe_customer_id text UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);

CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auth Trigger: Automatically insert new row into public.users upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        id,
        full_name,
        email,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        'customer'::public.user_role,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE 
            WHEN public.users.full_name IS NULL OR public.users.full_name = '' 
            THEN EXCLUDED.full_name 
            ELSE public.users.full_name 
        END,
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- 3. ENTERPRISE CATALOG SCHEMA (CATEGORIES, PRODUCTS, VARIANTS, IMAGES)
-- ------------------------------------------------------------------------------

-- Categories Table (Hierarchical / Self-Referencing)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    base_price numeric(10, 2) NOT NULL CHECK (base_price >= 0),
    compare_at_price numeric(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    is_published boolean NOT NULL DEFAULT false,
    seo_title text,
    seo_description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

CREATE OR REPLACE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Product Variants Table (Crucial for inventory & SKU tracking)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku text NOT NULL UNIQUE,
    size text,
    color text,
    inventory_count integer NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
    price_adjustment numeric(10, 2) NOT NULL DEFAULT 0.00,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

-- Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    alt_text text,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_display_order ON public.product_images(product_id, display_order ASC);


-- 4. ORDER & FULFILLMENT SCHEMA
-- ------------------------------------------------------------------------------

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
    tax_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    shipping_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_amount >= 0),
    status public.order_status NOT NULL DEFAULT 'pending'::public.order_status,
    shipping_address jsonb NOT NULL,
    tracking_number text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE OR REPLACE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    price_at_time numeric(10, 2) NOT NULL CHECK (price_at_time >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);


-- 5. MARKETING & AUDIT TABLES
-- ------------------------------------------------------------------------------

-- Discounts Table
CREATE TABLE IF NOT EXISTS public.discounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    discount_type public.discount_type NOT NULL,
    value numeric(10, 2) NOT NULL CHECK (value > 0),
    expires_at timestamptz,
    usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
    times_used integer NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_expires_at ON public.discounts(expires_at);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    table_affected text NOT NULL,
    record_id text,
    timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_timestamp ON public.audit_logs(table_affected, timestamp DESC);


-- 6. SECURITY DEFINER HELPER: IS_ADMIN_OR_MANAGER
-- ------------------------------------------------------------------------------
-- Critical: Prevents infinite recursion when evaluating RLS policies on public.users
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role IN ('super_admin'::public.user_role, 'store_manager'::public.user_role)
    );
$$;


-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on every table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 7.1 "GOD MODE" ADMIN POLICIES (super_admin & store_manager)
-- ------------------------------------------------------------------------------
CREATE POLICY "admin_all_users" ON public.users
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "admin_all_categories" ON public.categories
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "admin_all_products" ON public.products
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "admin_all_variants" ON public.product_variants
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "admin_all_images" ON public.product_images
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "admin_all_orders" ON public.orders
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "admin_all_order_items" ON public.order_items
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "admin_all_discounts" ON public.discounts
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "admin_all_audit_logs" ON public.audit_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager())
    WITH CHECK (public.is_admin_or_manager());

-- ------------------------------------------------------------------------------
-- 7.2 PUBLIC READ POLICIES (Only Published Catalog)
-- ------------------------------------------------------------------------------
-- Anyone (anon or authenticated) can view categories
CREATE POLICY "public_read_categories" ON public.categories
    FOR SELECT
    TO public
    USING (true);

-- Anyone can view products ONLY IF is_published is true
CREATE POLICY "public_read_published_products" ON public.products
    FOR SELECT
    TO public
    USING (is_published = true);

-- Anyone can view variants ONLY IF the parent product is published
CREATE POLICY "public_read_published_variants" ON public.product_variants
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id
              AND p.is_published = true
        )
    );

-- Anyone can view images ONLY IF the parent product is published
CREATE POLICY "public_read_published_images" ON public.product_images
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_images.product_id
              AND p.is_published = true
        )
    );

-- Public can validate active discounts by code
CREATE POLICY "public_read_active_discounts" ON public.discounts
    FOR SELECT
    TO public
    USING (
        (expires_at IS NULL OR expires_at > now())
        AND (usage_limit IS NULL OR times_used < usage_limit)
    );

-- ------------------------------------------------------------------------------
-- 7.3 CUSTOMER ACCESS POLICIES
-- ------------------------------------------------------------------------------
-- Customer can read only their own profile
CREATE POLICY "customer_select_own_profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Customer can update only their own profile (cannot escalate their own role)
CREATE POLICY "customer_update_own_profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
    );

-- Customer can view only their own orders
CREATE POLICY "customer_select_own_orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Customer can view only order items belonging to their own orders
CREATE POLICY "customer_select_own_order_items" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND o.user_id = auth.uid()
        )
    );
