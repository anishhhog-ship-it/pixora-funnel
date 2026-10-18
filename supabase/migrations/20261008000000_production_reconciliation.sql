-- ============================================================================
-- PIXORA FUNNEL — PRODUCTION RECONCILIATION MIGRATION
-- Migration: 20261008000000_production_reconciliation.sql
-- ============================================================================
-- Fully Idempotent schema reconciliation for multi-tenant production launch.
-- Supports:
--   1. Plans & Entitlements (1-Day Trial, Lifetime ₹2,599)
--   2. Review Language Patterns (Deterministic smart review engine)
--   3. Menu Views & Analytics telemetry
--   4. Category Visuals repository
--   5. Physical Product Catalog & Orders (NFC Tags, Acrylic Stands)
--   6. Platform Admins & Audit Logging
--   7. System Logs & Webhook Idempotency Events
--   8. Strict Row Level Security (RLS) & Multi-Tenant Isolation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PLANS & ENTITLEMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_inr NUMERIC NOT NULL,
  billing_interval TEXT NOT NULL DEFAULT 'lifetime' CHECK (billing_interval IN ('lifetime', 'one_time', 'monthly', 'yearly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_value TEXT NOT NULL DEFAULT 'true',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(plan_id, feature_key)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expiring', 'expired', 'cancelled')),
  is_lifetime BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  payment_reference TEXT,
  payment_amount_inr NUMERIC,
  activated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed production standard plans (idempotent)
INSERT INTO public.plans (id, name, slug, description, price_inr, billing_interval, is_active)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '1-Day Free Trial', 'trial', 'Full access for 24 hours to test live table scans and review routing.', 0, 'one_time', true),
  ('a2222222-2222-2222-2222-222222222222', 'Lifetime Software', 'lifetime_software', 'Lifetime Pixora Review Funnel software access without NFC hardware.', 2599, 'lifetime', true),
  ('a3333333-3333-3333-3333-333333333333', 'Lifetime Software + NFC doorstep delivery', 'lifetime_software_nfc', 'Lifetime Pixora Review Funnel software access with NFC hardware delivered to your doorstep.', 2999, 'lifetime', true)
ON CONFLICT (slug) DO UPDATE SET
  price_inr = EXCLUDED.price_inr,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 2. REVIEW LANGUAGE PATTERNS (Source of truth for local suggestion engine)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_language_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'constructive')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'hinglish')),
  pattern_template TEXT NOT NULL,
  topic_tag TEXT NOT NULL,
  formality_tone TEXT NOT NULL DEFAULT 'warm',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. MENU VIEWS & ENGAGEMENT TELEMETRY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
  item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. CATEGORY VISUALS (Curated high-res backdrops per industry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.category_visuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug TEXT UNIQUE NOT NULL,
  category_name TEXT NOT NULL,
  desktop_image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  quality_score INTEGER NOT NULL DEFAULT 95,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  theme_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. PHYSICAL PRODUCT CATALOG & ORDERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_inr NUMERIC NOT NULL,
  compare_price_inr NUMERIC,
  image_url TEXT NOT NULL,
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed physical merchandise (NFC card, table stands)
INSERT INTO public.product_catalog (product_name, slug, description, price_inr, compare_price_inr, image_url, badge, sort_order)
VALUES
  ('Pixora Smart NFC Review Card', 'nfc-card', 'Pocket-sized matte NFC tap card for cash counters and valets.', 499, 999, '/products/nfc-card.jpg', 'Popular', 1),
  ('Premium Acrylic QR Table Stand (Pack of 5)', 'table-stand-5', 'Laser-cut crystal-clear acrylic stands with water-resistant QR code.', 1299, 1999, '/products/acrylic-stand.jpg', 'Best Value', 2),
  ('NFC + QR Smart Table Stand Combo', 'nfc-qr-combo', 'Dual tap & scan standing display for dining tables and billing counters.', 1499, 2499, 'Bestseller', 3),
  ('Complete Multi-Table Pack (15 Stands + 2 NFC Cards)', 'multi-table-pack', 'Full setup for high-capacity restaurants, cafes, and hotels.', 3499, 5999, 'Commercial', 4)
ON CONFLICT (slug) DO UPDATE SET
  price_inr = EXCLUDED.price_inr,
  updated_at = now();

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  total_amount_inr NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number TEXT,
  courier_partner TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.product_catalog(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_inr NUMERIC NOT NULL,
  custom_business_name TEXT,
  custom_logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  updated_by_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. SUPPORT TICKETS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_client', 'resolved', 'closed')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. PLATFORM ADMINS & AUDIT LOGS (Strict Internal Control)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support_agent')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_state JSONB,
  after_state JSONB,
  request_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'ignored')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. INDEXES FOR HIGH-THROUGHPUT TENANT QUERIES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subscriptions_biz ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_menu_views_biz ON public.menu_views(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_biz ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_biz ON public.support_tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_time ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_time ON public.system_logs(level, created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. SECURITY FUNCTIONS & RLS POLICIES
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins pa
    WHERE pa.auth_user_id = auth.uid() AND pa.is_active = true
  );
$$;

-- Enable RLS on new tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_language_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_visuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Plans & Features: Public can read active plans
DROP POLICY IF EXISTS "Public can view active plans" ON public.plans;
CREATE POLICY "Public can view active plans" ON public.plans FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public can view plan features" ON public.plan_features;
CREATE POLICY "Public can view plan features" ON public.plan_features FOR SELECT TO anon, authenticated USING (is_enabled = true);

-- Subscriptions: Members can view their business subscriptions
DROP POLICY IF EXISTS "Members can view subscriptions" ON public.subscriptions;
CREATE POLICY "Members can view subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.check_is_business_member(business_id));

-- Product Catalog: Public can view active products
DROP POLICY IF EXISTS "Public can view active products" ON public.product_catalog;
CREATE POLICY "Public can view active products" ON public.product_catalog FOR SELECT TO anon, authenticated USING (is_active = true);

-- Orders: Business members can view their own orders
DROP POLICY IF EXISTS "Members can view business orders" ON public.orders;
CREATE POLICY "Members can view business orders" ON public.orders FOR SELECT TO authenticated USING (public.check_is_business_member(business_id));

DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
CREATE POLICY "Users can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Support Tickets: Business members can create and view tickets
DROP POLICY IF EXISTS "Members can manage support tickets" ON public.support_tickets;
CREATE POLICY "Members can manage support tickets" ON public.support_tickets FOR ALL TO authenticated USING (public.check_is_business_member(business_id));

-- Category Visuals: Public can view active visuals
DROP POLICY IF EXISTS "Public can view category visuals" ON public.category_visuals;
CREATE POLICY "Public can view category visuals" ON public.category_visuals FOR SELECT TO anon, authenticated USING (is_active = true);

-- Review Language Patterns: Deterministic suggestion patterns
DROP POLICY IF EXISTS "Public can view review language patterns" ON public.review_language_patterns;
CREATE POLICY "Public can view review language patterns" ON public.review_language_patterns FOR SELECT TO anon, authenticated USING (is_active = true);

-- Menu Views: Anon diners can log views
DROP POLICY IF EXISTS "Anyone can record menu views" ON public.menu_views;
CREATE POLICY "Anyone can record menu views" ON public.menu_views FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin Security: ONLY verified platform admins have access to admin-only tables
DROP POLICY IF EXISTS "Admins can view platform admins" ON public.platform_admins;
CREATE POLICY "Admins can view platform admins" ON public.platform_admins FOR SELECT TO authenticated USING (public.check_is_platform_admin());

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated USING (public.check_is_platform_admin());

DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;
CREATE POLICY "Admins can view system logs" ON public.system_logs FOR SELECT TO authenticated USING (public.check_is_platform_admin());

DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL TO authenticated USING (public.check_is_platform_admin());

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO authenticated USING (public.check_is_platform_admin());
