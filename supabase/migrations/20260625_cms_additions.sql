-- Migration: Additional CMS support, coupon enhancements, and media storage
-- Run this in the Supabase SQL Editor.

-- 1. Rename column usage_count to uses_count in public.coupon_codes if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'coupon_codes'
          AND column_name = 'usage_count'
    ) THEN
        ALTER TABLE public.coupon_codes RENAME COLUMN usage_count TO uses_count;
    END IF;
END $$;

-- 2. Add columns to coupon_codes table
ALTER TABLE public.coupon_codes ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE public.coupon_codes ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.coupon_codes ADD COLUMN IF NOT EXISTS min_purchase_amount NUMERIC DEFAULT 0;
ALTER TABLE public.coupon_codes ADD COLUMN IF NOT EXISTS product_ids TEXT[] DEFAULT '{}'::TEXT[];

-- 3. Create the media storage bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable public read for media storage bucket and admin controls
-- Remove duplicate policies if any
DROP POLICY IF EXISTS "media_public_select" ON storage.objects;
DROP POLICY IF EXISTS "media_insert" ON storage.objects;
DROP POLICY IF EXISTS "media_update" ON storage.objects;
DROP POLICY IF EXISTS "media_delete" ON storage.objects;

CREATE POLICY "media_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
CREATE POLICY "media_update" ON storage.objects FOR UPDATE USING (bucket_id = 'media');
CREATE POLICY "media_delete" ON storage.objects FOR DELETE USING (bucket_id = 'media');
