-- Migration: Create admins, Coupon and Payment Log Tables
-- Run this in the Supabase SQL Editor.

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate security helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE email = auth.jwt()->>'email' AND role = 'super_admin'
    ),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_select_policy" ON public.admins;
DROP POLICY IF EXISTS "admins_all_policy" ON public.admins;
CREATE POLICY "admins_select_policy" ON public.admins FOR SELECT USING (true);
CREATE POLICY "admins_all_policy" ON public.admins FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Ensure admins email constraint is unique
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_email_key;
ALTER TABLE public.admins ADD CONSTRAINT admins_email_key UNIQUE (email);

-- Clean up coupon and payment logs tables if they exist
DROP TABLE IF EXISTS public.coupon_usage CASCADE;
DROP TABLE IF EXISTS public.coupon_codes CASCADE;
DROP TABLE IF EXISTS public.payment_logs CASCADE;

CREATE TABLE IF NOT EXISTS public.coupon_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent NUMERIC NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER, -- NULL means unlimited
    usage_count INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    applied_to TEXT NOT NULL CHECK (applied_to IN ('academy', 'shop', 'tournament', 'ground')),
    reference_id UUID,
    discount_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id BIGINT REFERENCES public.payments(id) ON DELETE SET NULL,
    event TEXT NOT NULL, -- 'order_created', 'payment_authorized', 'payment_captured', 'payment_failed'
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies for coupon_codes
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupon_codes_select_policy" ON public.coupon_codes;
DROP POLICY IF EXISTS "coupon_codes_all_policy" ON public.coupon_codes;
CREATE POLICY "coupon_codes_select_policy" ON public.coupon_codes FOR SELECT USING (true);
CREATE POLICY "coupon_codes_all_policy" ON public.coupon_codes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS policies for coupon_usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupon_usage_select_policy" ON public.coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_insert_policy" ON public.coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_all_policy" ON public.coupon_usage;
CREATE POLICY "coupon_usage_select_policy" ON public.coupon_usage FOR SELECT USING (
  public.is_admin() OR user_id = public.current_user_profile_id()
);
CREATE POLICY "coupon_usage_insert_policy" ON public.coupon_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "coupon_usage_all_policy" ON public.coupon_usage FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS policies for payment_logs
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_logs_select_policy" ON public.payment_logs;
DROP POLICY IF EXISTS "payment_logs_insert_policy" ON public.payment_logs;
CREATE POLICY "payment_logs_select_policy" ON public.payment_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "payment_logs_insert_policy" ON public.payment_logs FOR INSERT WITH CHECK (true);

-- Indices for coupon usage and codes
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment ON public.payment_logs(payment_id);

-- Timestamps trigger
DROP TRIGGER IF EXISTS update_coupon_codes_updated_at ON public.coupon_codes;
CREATE TRIGGER update_coupon_codes_updated_at BEFORE UPDATE ON public.coupon_codes FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Seed Default Coupon
INSERT INTO public.coupon_codes (code, discount_percent, expiry_date, usage_limit, is_active)
VALUES ('WELCOME8', 8.0, '2030-12-31 23:59:59+00', NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Seed default super admin if auth user exists
INSERT INTO public.admins (id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'renegadessportsarena@gmail.com'
ON CONFLICT (id) DO NOTHING;
