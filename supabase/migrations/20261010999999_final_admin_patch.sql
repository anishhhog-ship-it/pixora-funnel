-- Pixora Funnel - Final Admin & Activations Modules Schema Setup
-- Consolidated migration for all Admin Panel tables & Activation Keys

-- 1. Ensure platform_admins exists
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure admin_audit_logs exists
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES public.platform_admins(id) ON DELETE SET NULL,
    admin_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    after_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no TEXT NOT NULL UNIQUE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    products TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Processing', -- Processing, Dispatched, Delivered, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Google Integrations Table
CREATE TABLE IF NOT EXISTS public.google_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    google_account_id TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- Connected, Disconnected, Reconnection Required, Pending, Failed
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Open', -- Open, Pending Reply, Resolved
    priority TEXT NOT NULL DEFAULT 'Normal', -- Low, Normal, High Priority
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Activation Keys Table
CREATE TABLE IF NOT EXISTS public.activation_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_string TEXT NOT NULL UNIQUE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who generated it
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;

-- 8. Create Security Policies
DROP POLICY IF EXISTS "Admins full access orders" ON public.orders;
CREATE POLICY "Admins full access orders" ON public.orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "Businesses can read own orders" ON public.orders;
CREATE POLICY "Businesses can read own orders" ON public.orders FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins full access integrations" ON public.google_integrations;
CREATE POLICY "Admins full access integrations" ON public.google_integrations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "Businesses can manage own integrations" ON public.google_integrations;
CREATE POLICY "Businesses can manage own integrations" ON public.google_integrations FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins full access tickets" ON public.support_tickets;
CREATE POLICY "Admins full access tickets" ON public.support_tickets FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "Businesses can manage own tickets" ON public.support_tickets;
CREATE POLICY "Businesses can manage own tickets" ON public.support_tickets FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage activation keys" ON public.activation_keys;
CREATE POLICY "Admins can manage activation keys" ON public.activation_keys FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM platform_admins WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can read their own activation keys" ON public.activation_keys;
CREATE POLICY "Users can read their own activation keys" ON public.activation_keys FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE id = activation_keys.business_id AND owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can use activation keys" ON public.activation_keys;
CREATE POLICY "Users can use activation keys" ON public.activation_keys FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE id = activation_keys.business_id AND owner_id = auth.uid())) WITH CHECK (is_used = true);

-- 9. Insert dummy data for immediate dashboard population
INSERT INTO public.orders (order_no, customer_name, products, amount, status)
SELECT '#PXO-1042', 'Rajesh Kumar', 'NFC Tag (5)', 2450.00, 'Processing'
WHERE NOT EXISTS (SELECT 1 FROM public.orders LIMIT 1);

INSERT INTO public.orders (order_no, customer_name, products, amount, status)
SELECT '#PXO-1041', 'Priya Sharma', 'Table Stand (2)', 3199.00, 'Dispatched'
WHERE NOT EXISTS (SELECT 1 FROM public.orders WHERE order_no = '#PXO-1041');

INSERT INTO public.orders (order_no, customer_name, products, amount, status)
SELECT '#PXO-1040', 'Amit Mehta', 'NFC Tag (10)', 4899.00, 'Delivered'
WHERE NOT EXISTS (SELECT 1 FROM public.orders WHERE order_no = '#PXO-1040');

INSERT INTO public.support_tickets (subject, status, priority)
SELECT 'Dashboard Login Issue', 'Open', 'High Priority'
WHERE NOT EXISTS (SELECT 1 FROM public.support_tickets LIMIT 1);

INSERT INTO public.support_tickets (subject, status, priority)
SELECT 'Billing Enquiry', 'Pending Reply', 'Normal'
WHERE NOT EXISTS (SELECT 1 FROM public.support_tickets WHERE subject = 'Billing Enquiry');
