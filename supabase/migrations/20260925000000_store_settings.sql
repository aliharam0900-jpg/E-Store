-- ==============================================================================
-- Enterprise E-Commerce Platform - Phase 8 Migration
-- Store Settings Table, Single-Row Enforcement & Global CMS Configuration
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

-- Seed single configuration record if not present
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
    'ATELIER',
    NULL,
    'THE MINIMALIST COLLECTION',
    'Engineered silhouettes crafted with architectural precision and sustainably sourced Japanese textiles.',
    '© 2026 ATELIER INC. ALL RIGHTS RESERVED. ARCHITECTURAL LUXURY FOR THE DISCERNING INDIVIDUAL.',
    '#000000'
) ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on store_settings"
    ON public.store_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Allow admin update access on store_settings"
    ON public.store_settings
    FOR UPDATE
    USING (
        auth.jwt() ->> 'role' = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
