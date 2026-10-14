-- ============================================================================
-- PIXORA FUNNEL — PRODUCTION SALES MANAGEMENT SYSTEM MIGRATION
-- Migration: 20261015000000_sales_management_system.sql
-- ============================================================================
-- Additive, non-destructive migration supporting:
--   1. Sales Staff & Role RBAC (Salesperson, Sales Manager, Super Admin)
--   2. Prospects (Leads) & Activity Timelines
--   3. Review Funnel Demos & Public Previews
--   4. Configurable Commercial Plans & Atomic Lifetime Launch Slots
--   5. Sales Orders & Payment Verification Tracking
--   6. Idempotent Demo-to-Live Customer Conversion
--   7. NFC & QR Physical Asset Fulfillment
--   8. Sales Operations Audit Logs
--   9. Strict Row Level Security (RLS) & Tenant Isolation
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. SALES STAFF TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'salesperson' CHECK (role IN ('salesperson', 'sales_manager', 'admin')),
    manager_id UUID REFERENCES public.sales_staff(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'deactivated')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sales_staff_email ON public.sales_staff(email);
CREATE INDEX IF NOT EXISTS idx_sales_staff_auth ON public.sales_staff(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_staff_role ON public.sales_staff(role);

-- ----------------------------------------------------------------------------
-- 2. PROSPECTS (LEADS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    category TEXT NOT NULL DEFAULT 'General Business',
    city TEXT,
    address TEXT,
    website TEXT,
    google_maps_url TEXT,
    lead_source TEXT NOT NULL DEFAULT 'Field Sales' CHECK (lead_source IN ('Meta Ads', 'WhatsApp', 'Field Sales', 'Website', 'Referrals', 'Other')),
    assigned_to UUID REFERENCES public.sales_staff(id) ON DELETE SET NULL,
    stage TEXT NOT NULL DEFAULT 'New Lead' CHECK (stage IN (
        'New Lead', 'Contacted', 'Qualified', 'Demo In Progress',
        'Demo Shared', 'Follow-up', 'Payment Pending', 'Won', 'Activated', 'Lost'
    )),
    notes TEXT,
    next_followup_date TIMESTAMPTZ,
    last_contact_date TIMESTAMPTZ DEFAULT now(),
    is_converted BOOLEAN NOT NULL DEFAULT false,
    converted_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospects_assigned ON public.prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prospects_stage ON public.prospects(stage);
CREATE INDEX IF NOT EXISTS idx_prospects_created ON public.prospects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_phone ON public.prospects(phone);

-- ----------------------------------------------------------------------------
-- 3. REVIEW FUNNEL DEMOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_demos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    prospect_id UUID REFERENCES public.prospects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.sales_staff(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Business',
    review_destination_url TEXT NOT NULL,
    primary_color TEXT NOT NULL DEFAULT '#2563EB',
    logo_url TEXT,
    cover_url TEXT,
    template_slug TEXT NOT NULL DEFAULT 'classic',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    config_version INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'shared', 'converted', 'revoked')),
    shared_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    view_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_demos_slug ON public.sales_demos(slug);
CREATE INDEX IF NOT EXISTS idx_sales_demos_prospect ON public.sales_demos(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sales_demos_creator ON public.sales_demos(created_by);

-- ----------------------------------------------------------------------------
-- 4. PROSPECT ACTIVITIES & FOLLOW-UP TASKS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES public.prospects(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.sales_staff(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'call', 'visit', 'whatsapp', 'demo_created', 'demo_shared',
        'note', 'payment_pending', 'converted', 'stage_change', 'task'
    )),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_act_prospect ON public.sales_activities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sales_act_staff ON public.sales_activities(staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_act_due ON public.sales_activities(due_date);

-- ----------------------------------------------------------------------------
-- 5. COMMERCIAL PRICING PLANS & LAUNCH OFFERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commercial_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_paise BIGINT NOT NULL,
    price_inr NUMERIC GENERATED ALWAYS AS (price_paise / 100.0) STORED,
    billing_interval TEXT NOT NULL DEFAULT '2_years' CHECK (billing_interval IN ('2_years', 'lifetime', 'yearly', 'monthly')),
    duration_years INT NOT NULL DEFAULT 2,
    is_lifetime BOOLEAN NOT NULL DEFAULT false,
    includes_nfc BOOLEAN NOT NULL DEFAULT false,
    max_slots INT, -- e.g. 100 for launch offer
    slots_used INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_slots_not_exceeded CHECK (max_slots IS NULL OR slots_used <= max_slots)
);

-- Seed standard commercial plans (idempotent)
INSERT INTO public.commercial_plans (name, slug, description, price_paise, billing_interval, duration_years, is_lifetime, includes_nfc, max_slots, slots_used, display_order, features)
VALUES
  (
    'Founder Launch Lifetime Offer',
    'lifetime_launch_100',
    'Exclusive launch offer for first 100 businesses. Lifetime Review Funnel software access with zero renewal fees.',
    259900, -- ₹2,599 in paise
    'lifetime',
    99,
    true,
    false,
    100,
    0,
    1,
    '["Lifetime Review Funnel Software", "Unlimited Google Reviews Routing", "Smart AI Review Wizard", "Custom QR Stand Asset", "Zero Recurring Fees"]'::jsonb
  ),
  (
    'Standard 2-Year Plan',
    'standard_2year_software',
    'Full access for 2 full years to Pixora Review Funnel, smart routing, and QR assets.',
    259900, -- ₹2,599 in paise
    '2_years',
    2,
    false,
    false,
    NULL,
    0,
    2,
    '["2-Year Full Software License", "Unlimited Table & Counter Scans", "AI Auto-Reply Generator", "Dynamic Feedback Routing", "Priority Support"]'::jsonb
  ),
  (
    'Standard 2-Year Plan + NFC Delivery',
    'standard_2year_nfc',
    '2-Year Review Funnel access plus premium custom printed NFC Card & Stand delivered to doorstep.',
    299900, -- ₹2,999 in paise
    '2_years',
    2,
    false,
    true,
    NULL,
    0,
    3,
    '["2-Year Full Software License", "1x Custom NFC Business Card", "1x Acrylic Table Display Stand", "Doorstep Express Courier", "Ready to Tap & Collect Reviews"]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_paise = EXCLUDED.price_paise,
  includes_nfc = EXCLUDED.includes_nfc,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 6. SALES ORDERS & PAYMENT RECORDS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT UNIQUE NOT NULL,
    prospect_id UUID REFERENCES public.prospects(id) ON DELETE SET NULL,
    demo_id UUID REFERENCES public.sales_demos(id) ON DELETE SET NULL,
    sales_staff_id UUID REFERENCES public.sales_staff(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    plan_slug TEXT NOT NULL,
    plan_snapshot JSONB NOT NULL,
    amount_paise BIGINT NOT NULL,
    amount_inr NUMERIC GENERATED ALWAYS AS (amount_paise / 100.0) STORED,
    payment_method TEXT NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Bank Transfer', 'Cash', 'Online Gateway')),
    transaction_reference TEXT, -- UTR or Bank Ref
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PENDING_APPROVAL', 'VERIFIED', 'FAILED', 'CANCELLED')),
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    conversion_status TEXT NOT NULL DEFAULT 'pending' CHECK (conversion_status IN ('pending', 'converted', 'failed')),
    converted_at TIMESTAMPTZ,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_prospect ON public.sales_orders(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_staff ON public.sales_orders(sales_staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(payment_status);

-- ----------------------------------------------------------------------------
-- 7. NFC & PHYSICAL ASSET FULFILLMENT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nfc_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    nfc_asset_type TEXT NOT NULL DEFAULT 'Card + Stand' CHECK (nfc_asset_type IN ('Card', 'Stand', 'Card + Stand', 'Tag')),
    status TEXT NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'In Production', 'Dispatched', 'Delivered', 'Cancelled')),
    courier_name TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfc_orders_sales_order ON public.nfc_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_status ON public.nfc_orders(status);

-- ----------------------------------------------------------------------------
-- 8. SALES AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.sales_staff(id) ON DELETE SET NULL,
    staff_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_audit_staff ON public.sales_audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_audit_created ON public.sales_audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. ATOMIC HELPER: RESERVE LIFETIME SLOT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_lifetime_plan_slot(p_plan_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated INT;
BEGIN
    UPDATE public.commercial_plans
    SET slots_used = slots_used + 1,
        updated_at = now()
    WHERE slug = p_plan_slug
      AND is_active = true
      AND (max_slots IS NULL OR slots_used < max_slots);

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.sales_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to find sales staff id for currently authenticated user
CREATE OR REPLACE FUNCTION public.get_current_sales_staff_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.sales_staff WHERE auth_user_id = auth.uid() AND status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_sales_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.sales_staff WHERE auth_user_id = auth.uid() AND status = 'active' LIMIT 1;
$$;

-- Commercial Plans: readable by authenticated and service role
CREATE POLICY "Commercial plans read access" ON public.commercial_plans
    FOR SELECT TO authenticated USING (true);

-- Sales Staff policies
CREATE POLICY "Admins full access sales_staff" ON public.sales_staff
    FOR ALL TO authenticated
    USING (
        public.check_is_platform_admin() 
        OR public.get_current_sales_role() IN ('admin', 'sales_manager')
    );

CREATE POLICY "Staff read own record" ON public.sales_staff
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid());

-- Prospects policies
CREATE POLICY "Admins and Managers access all prospects" ON public.prospects
    FOR ALL TO authenticated
    USING (
        public.check_is_platform_admin() 
        OR public.get_current_sales_role() IN ('admin', 'sales_manager')
    );

CREATE POLICY "Salesperson access assigned prospects" ON public.prospects
    FOR ALL TO authenticated
    USING (assigned_to = public.get_current_sales_staff_id());

-- Sales Demos policies
CREATE POLICY "Admins and Managers access all demos" ON public.sales_demos
    FOR ALL TO authenticated
    USING (
        public.check_is_platform_admin() 
        OR public.get_current_sales_role() IN ('admin', 'sales_manager')
    );

CREATE POLICY "Salesperson access own demos" ON public.sales_demos
    FOR ALL TO authenticated
    USING (created_by = public.get_current_sales_staff_id());

-- Sales Activities policies
CREATE POLICY "Admins and Managers access all activities" ON public.sales_activities
    FOR ALL TO authenticated
    USING (
        public.check_is_platform_admin() 
        OR public.get_current_sales_role() IN ('admin', 'sales_manager')
    );

CREATE POLICY "Salesperson access own activities" ON public.sales_activities
    FOR ALL TO authenticated
    USING (staff_id = public.get_current_sales_staff_id());

-- Sales Orders policies
CREATE POLICY "Admins full access orders" ON public.sales_orders
    FOR ALL TO authenticated
    USING (
        public.check_is_platform_admin() 
        OR public.get_current_sales_role() IN ('admin', 'sales_manager')
    );

CREATE POLICY "Salesperson view own orders" ON public.sales_orders
    FOR SELECT TO authenticated
    USING (sales_staff_id = public.get_current_sales_staff_id());

-- NFC Orders policies
CREATE POLICY "Admins full access nfc orders" ON public.nfc_orders
    FOR ALL TO authenticated
    USING (
        public.check_is_platform_admin() 
        OR public.get_current_sales_role() IN ('admin', 'sales_manager')
    );

COMMIT;
