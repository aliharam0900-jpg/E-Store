-- ==============================================================================
-- ENTERPRISE E-COMMERCE PLATFORM - PRODUCTION DATABASE MIGRATION
-- Copy and paste this script directly into your Supabase Dashboard SQL Editor
-- Dashboard URL: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- ==============================================================================
-- 2. CATEGORIES TABLE (Taxonomy hierarchy)
-- ==============================================================================
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

-- ==============================================================================
-- 3. STORE SETTINGS TABLE (Global Brand, Hero CMS, Theme Color)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    store_name text NOT NULL DEFAULT 'ATELIER',
    logo_url text,
    hero_headline text NOT NULL DEFAULT 'THE MINIMALIST COLLECTION',
    hero_subtext text NOT NULL DEFAULT 'Engineered silhouettes crafted with architectural precision and sustainably sourced Japanese textiles.',
    footer_text text NOT NULL DEFAULT '© 2026 ATELIER INC. ALL RIGHTS RESERVED. ARCHITECTURAL LUXURY FOR THE DISCERNING INDIVIDUAL.',
    primary_color_hex text NOT NULL DEFAULT '#000000',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure updated_at trigger for store_settings
CREATE OR REPLACE TRIGGER update_store_settings_updated_at
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Seed single configuration record
INSERT INTO public.store_settings (
    id,
    store_name,
    logo_url,
    hero_headline,
    hero_subtext,
    footer_text,
    primary_color_hex
) VALUES (
    1,
    'MONOLITH',
    NULL,
    'ENGINEERED ARTIFACTS & FORM',
    'Industrial precision meets utilitarian apparel. Constructed with aerospace titanium, bonded weather-membranes, and zero aesthetic compromise.',
    '© 2026 MONOLITH ENTERPRISES INC. ALL RIGHTS RESERVED. ARCHITECTURAL LUXURY FOR THE DISCERNING INDIVIDUAL.',
    '#000000'
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. PRODUCTS TABLE (Catalog Base Records)
-- ==============================================================================
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

-- ==============================================================================
-- 5. PRODUCT VARIANTS TABLE (SKU, Sizing, Colors, Inventory)
-- ==============================================================================
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

-- ==============================================================================
-- 6. PRODUCT IMAGES TABLE (Media Assets & Gallery Order)
-- ==============================================================================
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

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 7.1 Categories Access
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "manage_categories" ON public.categories;
CREATE POLICY "manage_categories" ON public.categories
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 7.2 Store Settings Access
DROP POLICY IF EXISTS "public_read_store_settings" ON public.store_settings;
CREATE POLICY "public_read_store_settings" ON public.store_settings
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "manage_store_settings" ON public.store_settings;
CREATE POLICY "manage_store_settings" ON public.store_settings
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 7.3 Products Access
DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "manage_products" ON public.products;
CREATE POLICY "manage_products" ON public.products
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 7.4 Product Variants Access
DROP POLICY IF EXISTS "public_read_variants" ON public.product_variants;
CREATE POLICY "public_read_variants" ON public.product_variants
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "manage_variants" ON public.product_variants;
CREATE POLICY "manage_variants" ON public.product_variants
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 7.5 Product Images Access
DROP POLICY IF EXISTS "public_read_images" ON public.product_images;
CREATE POLICY "public_read_images" ON public.product_images
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "manage_images" ON public.product_images;
CREATE POLICY "manage_images" ON public.product_images
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. STORAGE BUCKET CONFIGURATION (product_images)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product_images',
    'product_images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'product_images');

DROP POLICY IF EXISTS "Public Insert Product Images" ON storage.objects;
CREATE POLICY "Public Insert Product Images"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'product_images');

DROP POLICY IF EXISTS "Public Update Product Images" ON storage.objects;
CREATE POLICY "Public Update Product Images"
    ON storage.objects FOR UPDATE
    TO public
    USING (bucket_id = 'product_images');

DROP POLICY IF EXISTS "Public Delete Product Images" ON storage.objects;
CREATE POLICY "Public Delete Product Images"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'product_images');

-- ==============================================================================
-- 9. INITIAL DATA SEEDS (Starter Categories & Showcase Product)
-- ==============================================================================
DO $$
DECLARE
    v_cat_id uuid;
    v_prod_id uuid;
BEGIN
    -- 1. Seed Categories
    INSERT INTO public.categories (name, slug, description)
    VALUES 
        ('Outerwear', 'outerwear', 'Technical weather-resistant garments'),
        ('Trousers', 'trousers', 'Articulated technical pants and cargo utility trousers'),
        ('Accessories', 'accessories', 'Modular belts, bags, and EDC equipment')
    ON CONFLICT (slug) DO NOTHING;

    -- Look up Outerwear category id
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'outerwear' LIMIT 1;

    -- 2. Seed First Production Showcase Product
    INSERT INTO public.products (
        title,
        slug,
        description,
        base_price,
        compare_at_price,
        category_id,
        is_published,
        seo_title,
        seo_description
    )
    VALUES (
        'Monolith Technical Modular Shell Jacket',
        'modular-shell-jacket',
        'Multi-climate technical outerwear engineered with waterproof GORE-TEX membrane, bonded seam architecture, and ergonomic articulation.',
        340.00,
        395.00,
        v_cat_id,
        true,
        'Modular Shell Jacket | Monolith',
        'Precision-engineered technical outerwear.'
    )
    ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO v_prod_id;

    IF v_prod_id IS NULL THEN
        SELECT id INTO v_prod_id FROM public.products WHERE slug = 'modular-shell-jacket' LIMIT 1;
    END IF;

    -- 3. Seed Variants for the Initial Product
    INSERT INTO public.product_variants (
        product_id,
        sku,
        size,
        color,
        inventory_count,
        price_adjustment
    )
    VALUES 
        (v_prod_id, 'MSJ-BLK-S', 'S', 'Obsidian', 20, 0.00),
        (v_prod_id, 'MSJ-BLK-M', 'M', 'Obsidian', 15, 0.00),
        (v_prod_id, 'MSJ-BLK-L', 'L', 'Obsidian', 10, 0.00)
    ON CONFLICT (sku) DO NOTHING;

    -- 4. Seed Showcase Image
    IF NOT EXISTS (
        SELECT 1 FROM public.product_images 
        WHERE product_id = v_prod_id 
          AND image_url = 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000'
    ) THEN
        INSERT INTO public.product_images (
            product_id,
            image_url,
            alt_text,
            display_order
        )
        VALUES (
            v_prod_id,
            'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000',
            'Monolith Modular Shell Jacket',
            0
        );
    END IF;
END $$;
