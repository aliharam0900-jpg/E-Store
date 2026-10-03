-- ==============================================================================
-- ENTERPRISE E-COMMERCE PLATFORM - PHASE 9 MIGRATION
-- Table: newsletter_subscribers
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    subscribed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON public.newsletter_subscribers(subscribed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public / anon users to subscribe (INSERT)
DROP POLICY IF EXISTS "public_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "public_insert_newsletter" ON public.newsletter_subscribers
    FOR INSERT TO public WITH CHECK (true);

-- Allow reading / export for management (SELECT)
DROP POLICY IF EXISTS "public_read_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "public_read_newsletter" ON public.newsletter_subscribers
    FOR SELECT TO public USING (true);

-- Allow deleting if needed
DROP POLICY IF EXISTS "manage_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "manage_newsletter" ON public.newsletter_subscribers
    FOR ALL TO public USING (true) WITH CHECK (true);
