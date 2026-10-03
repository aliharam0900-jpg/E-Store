-- ==============================================================================
-- ENTERPRISE E-COMMERCE PLATFORM - STORAGE CONFIGURATION
-- Initializes 'product_images' bucket and RLS policies
-- ==============================================================================

-- 1. Create product_images public storage bucket if not exists
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

-- 2. Storage RLS Policies
-- Allow anyone to view product images publicly
CREATE POLICY "Public Read Product Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product_images');

-- Allow authenticated admins to upload product images
CREATE POLICY "Admins Insert Product Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product_images'
    AND public.is_admin_or_manager()
);

-- Allow authenticated admins to update product images
CREATE POLICY "Admins Update Product Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product_images'
    AND public.is_admin_or_manager()
);

-- Allow authenticated admins to delete product images
CREATE POLICY "Admins Delete Product Images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'product_images'
    AND public.is_admin_or_manager()
);
