-- ==============================================================================
-- Enterprise E-Commerce Platform - Phase 6 Migration
-- Analytics Views, CRM Enhancements, Discount Auditing & Transactional Email Trigger
-- ==============================================================================

-- 1. ADD CRM SUSPENSION / BAN FIELD TO USERS
-- ------------------------------------------------------------------------------
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_banned ON public.users(is_banned);

-- 2. HIGH-PERFORMANCE ANALYTICS DATABASE VIEWS
-- ------------------------------------------------------------------------------

-- Executive Analytics Summary
CREATE OR REPLACE VIEW public.view_admin_analytics AS
SELECT
    COALESCE(SUM(total_amount), 0)::numeric(12, 2) AS total_revenue,
    CASE 
        WHEN COUNT(id) > 0 THEN (COALESCE(SUM(total_amount), 0) / COUNT(id))::numeric(10, 2)
        ELSE 0.00 
    END AS average_order_value,
    COUNT(id)::integer AS total_orders,
    (
        SELECT COUNT(DISTINCT user_id)::integer 
        FROM public.orders 
        WHERE user_id IS NOT NULL
    ) AS active_customers,
    (
        SELECT COUNT(id)::integer 
        FROM public.product_variants 
        WHERE inventory_count < 10
    ) AS low_stock_count
FROM public.orders;

-- 30-Day Daily Rolling Revenue
CREATE OR REPLACE VIEW public.view_revenue_30_days AS
WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '29 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    )::date AS day
)
SELECT 
    to_char(ds.day, 'YYYY-MM-DD') AS date,
    to_char(ds.day, 'Mon DD') AS label,
    COALESCE(SUM(o.total_amount), 0)::numeric(10, 2) AS revenue,
    COUNT(o.id)::integer AS order_count
FROM date_series ds
LEFT JOIN public.orders o 
    ON date_trunc('day', o.created_at) = ds.day
GROUP BY ds.day
ORDER BY ds.day ASC;

-- Top Selling Products by Volume
CREATE OR REPLACE VIEW public.view_top_selling_products AS
SELECT
    p.id AS product_id,
    p.title AS product_title,
    COALESCE(SUM(oi.quantity), 0)::integer AS units_sold,
    COALESCE(SUM(oi.quantity * oi.price_at_time), 0)::numeric(12, 2) AS total_revenue
FROM public.products p
JOIN public.product_variants pv ON pv.product_id = p.id
JOIN public.order_items oi ON oi.variant_id = pv.id
GROUP BY p.id, p.title
ORDER BY units_sold DESC
LIMIT 10;

-- Customer 360 CRM View (Lifetime Value & Order Aggregates)
CREATE OR REPLACE VIEW public.view_customer_crm AS
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_banned,
    u.stripe_customer_id,
    u.created_at,
    COUNT(o.id)::integer AS order_count,
    COALESCE(SUM(o.total_amount), 0)::numeric(12, 2) AS lifetime_value,
    MAX(o.created_at) AS last_order_at
FROM public.users u
LEFT JOIN public.orders o ON o.user_id = u.id
GROUP BY u.id, u.email, u.full_name, u.role, u.is_banned, u.stripe_customer_id, u.created_at;

-- 3. PERMISSIONS FOR VIEWS
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.view_admin_analytics TO authenticated;
GRANT SELECT ON public.view_revenue_30_days TO authenticated;
GRANT SELECT ON public.view_top_selling_products TO authenticated;
GRANT SELECT ON public.view_customer_crm TO authenticated;

-- 4. DATABASE WEBHOOK & TRIGGER FOR TRANSACTIONAL EMAILS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.handle_new_order_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    payload jsonb;
    target_url text;
BEGIN
    -- Construct structured payload for Edge Function / Webhook listener
    payload := jsonb_build_object(
        'event', 'ORDER_CREATED',
        'order_id', NEW.id,
        'user_id', NEW.user_id,
        'total_amount', NEW.total_amount,
        'tax_amount', NEW.tax_amount,
        'shipping_amount', NEW.shipping_amount,
        'status', NEW.status,
        'shipping_address', NEW.shipping_address,
        'created_at', NEW.created_at
    );

    target_url := COALESCE(
        current_setting('app.settings.order_email_webhook_url', true),
        'https://your-project.supabase.co/functions/v1/order-confirmation'
    );

    -- Asynchronously invoke transactional email webhook without blocking transaction
    BEGIN
        PERFORM net.http_post(
            url := target_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'X-Source', 'Supabase-Database-Trigger'
            ),
            body := payload
        );
    EXCEPTION WHEN OTHERS THEN
        -- Fail-safe: Never abort order insertion if notification dispatch encounters network faults
        RAISE WARNING 'Order confirmation email trigger failed: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created_send_email ON public.orders;
CREATE TRIGGER on_order_created_send_email
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_order_email();
