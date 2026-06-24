-- Create the trigger function if it does not exist
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create shop_orders if it does not exist
CREATE TABLE IF NOT EXISTS public.shop_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'pending_payment' NOT NULL CHECK (status IN ('pending_payment', 'paid', 'processing', 'shipped', 'cancelled')),
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    payment_id BIGINT REFERENCES public.payments(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    product_name TEXT,
    quantity INTEGER DEFAULT 1,
    delivery_address TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alter shop_orders to support anonymous guests and the new Buy Now fields (in case table already existed)
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Drop existing insert policy and create a new one allowing anonymous inserts
DROP POLICY IF EXISTS "shop_orders_insert" ON public.shop_orders;
CREATE POLICY "shop_orders_insert" ON public.shop_orders FOR INSERT WITH CHECK (true);

-- Drop existing select policy and create a new one to allow users or admins to view
DROP POLICY IF EXISTS "shop_orders_select" ON public.shop_orders;
CREATE POLICY "shop_orders_select" ON public.shop_orders FOR SELECT USING (player_id = public.current_user_profile_id() OR public.is_admin());

-- Drop existing admin policy if any and create
DROP POLICY IF EXISTS "shop_orders_admin" ON public.shop_orders;
CREATE POLICY "shop_orders_admin" ON public.shop_orders FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Create shop_enquiries table
CREATE TABLE IF NOT EXISTS public.shop_enquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    product_name TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'responded', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for shop_enquiries
ALTER TABLE public.shop_enquiries ENABLE ROW LEVEL SECURITY;

-- Add policies for shop_enquiries
DROP POLICY IF EXISTS "shop_enquiries_insert" ON public.shop_enquiries;
CREATE POLICY "shop_enquiries_insert" ON public.shop_enquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "shop_enquiries_select" ON public.shop_enquiries;
CREATE POLICY "shop_enquiries_select" ON public.shop_enquiries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "shop_enquiries_delete" ON public.shop_enquiries;
CREATE POLICY "shop_enquiries_delete" ON public.shop_enquiries FOR DELETE USING (public.is_admin());

-- Add trigger for updated_at on shop_enquiries if the function exists
DROP TRIGGER IF EXISTS update_shop_enquiries_updated_at ON public.shop_enquiries;
CREATE TRIGGER update_shop_enquiries_updated_at BEFORE UPDATE ON public.shop_enquiries FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add trigger for updated_at on shop_orders if the function exists
DROP TRIGGER IF EXISTS update_shop_orders_updated_at ON public.shop_orders;
CREATE TRIGGER update_shop_orders_updated_at BEFORE UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Enable RLS on shop_orders just in case it isn't enabled
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.shop_enquiries TO anon, authenticated, service_role;
GRANT ALL ON public.shop_orders TO anon, authenticated, service_role;
