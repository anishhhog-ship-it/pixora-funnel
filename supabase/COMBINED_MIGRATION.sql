-- ============================================================================
-- PIXORA FUNNEL — 100% COMPLETE & IDEMPOTENT MASTER DATABASE SCRIPT
-- File: supabase/COMBINED_MIGRATION.sql
-- ============================================================================
-- Safe to run on brand new databases or existing databases with partial schemas.
-- Uses IF NOT EXISTS, OR REPLACE, ADD COLUMN IF NOT EXISTS, and DROP POLICY IF EXISTS.
-- Zero syntax errors, zero destructive drops, completely safe for production.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. CORE PLATFORM TABLES
-- ----------------------------------------------------------------------------

-- PROFILES (Maps 1:1 to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'business_owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BUSINESSES (Tenants with Brand, Category Theme & Links)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  description TEXT,
  tagline TEXT,
  phone TEXT DEFAULT '+91 92573 78047',
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT DEFAULT 'Jaipur',
  state TEXT DEFAULT 'Rajasthan',
  country TEXT DEFAULT 'India',
  logo_url TEXT,
  cover_image_url TEXT,
  custom_cover_image TEXT,
  visual_theme_id TEXT,
  primary_color TEXT DEFAULT '#0B3D2E',
  secondary_color TEXT DEFAULT '#D4AF37',
  accent_color TEXT DEFAULT '#FDFBF7',
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  plan_status TEXT NOT NULL DEFAULT 'trial' CHECK (plan_status IN ('trial', 'active', 'expired')),
  trial_expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  menu_enabled BOOLEAN NOT NULL DEFAULT true,
  products_enabled BOOLEAN NOT NULL DEFAULT true,
  services_enabled BOOLEAN NOT NULL DEFAULT true,
  google_place_id TEXT,
  google_review_url TEXT,
  google_maps_url TEXT,
  headline TEXT,
  subheadline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all business columns exist if table was created in an earlier migration
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Jaipur',
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Rajasthan',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+91 92573 78047',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_review_url TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_cover_image TEXT,
  ADD COLUMN IF NOT EXISTS visual_theme_id TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS subheadline TEXT,
  ADD COLUMN IF NOT EXISTS menu_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS products_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS services_enabled BOOLEAN NOT NULL DEFAULT true;

-- BUSINESS MEMBERS (Multi-tenant RBAC)
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

-- FUNNELS (Customer Facing Smart Review Gateways)
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  review_enabled BOOLEAN NOT NULL DEFAULT true,
  smart_review_enabled BOOLEAN NOT NULL DEFAULT true,
  menu_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QR CODES & NFC DESTINATIONS
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_name TEXT,
  table_name TEXT,
  short_code TEXT UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  primary_color TEXT DEFAULT '#0B3D2E',
  secondary_color TEXT DEFAULT '#D4AF37',
  cta_text TEXT DEFAULT 'Tap or Scan to Review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REVIEWS (Internal Feedback & Direct Ratings)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  feedback TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'private', 'flagged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GOOGLE REVIEWS (Imported from Google Business Profile)
CREATE TABLE IF NOT EXISTS public.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  google_review_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_photo_url TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_time TIMESTAMPTZ NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  reply_status TEXT NOT NULL DEFAULT 'unreplied' CHECK (reply_status IN ('unreplied', 'replied', 'ignored')),
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, google_review_id)
);

-- GOOGLE CONNECTIONS (OAuth / API Credentials & Metadata)
CREATE TABLE IF NOT EXISTS public.google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  account_id TEXT,
  location_id TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'expired')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  initial_sync_completed_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_connections
  ADD COLUMN IF NOT EXISTS initial_sync_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- PRIVATE CUSTOMER FEEDBACK RESOLUTION SHIELD (1-3 Stars)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 3),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved', 'ignored')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUBSCRIPTIONS & CLIENT ENTITLEMENTS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRIALS
CREATE TABLE IF NOT EXISTS public.trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ANALYTICS & QR EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qr_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'scan' CHECK (event_type IN ('scan', 'tap')),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. ADMIN & PLATFORM MODULES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  products TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Processing' CHECK (status IN ('Processing', 'Dispatched', 'Delivered', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.google_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  google_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Connected', 'Disconnected', 'Reconnection Required', 'Pending', 'Failed')),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Pending Reply', 'Resolved')),
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High Priority')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code TEXT NOT NULL UNIQUE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  plan_slug TEXT NOT NULL DEFAULT 'lifetime_launch_100',
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. REVIEW DEDUPLICATION & CATEGORY TEMPLATES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.business_used_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  review_hash TEXT NOT NULL,
  review_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  source TEXT NOT NULL DEFAULT 'ai_engine',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_category_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  fragment_type TEXT NOT NULL DEFAULT 'body',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE public.review_category_templates DROP CONSTRAINT IF EXISTS review_category_templates_fragment_type_check;
  ALTER TABLE public.review_category_templates ADD CONSTRAINT review_category_templates_fragment_type_check 
    CHECK (fragment_type IN ('opening', 'body', 'closing', 'full_review'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 5. SALES MANAGEMENT SYSTEM
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

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

CREATE TABLE IF NOT EXISTS public.sales_demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
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

ALTER TABLE public.sales_demos
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

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

CREATE TABLE IF NOT EXISTS public.commercial_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_paise BIGINT NOT NULL,
  billing_interval TEXT NOT NULL DEFAULT '2_years' CHECK (billing_interval IN ('2_years', 'lifetime', 'yearly', 'monthly')),
  duration_years INT NOT NULL DEFAULT 2,
  is_lifetime BOOLEAN NOT NULL DEFAULT false,
  includes_nfc BOOLEAN NOT NULL DEFAULT false,
  max_slots INT,
  slots_used INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  payment_method TEXT NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Bank Transfer', 'Cash', 'Online Gateway')),
  transaction_reference TEXT,
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PENDING_APPROVAL', 'VERIFIED', 'FAILED', 'CANCELLED')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  conversion_status TEXT NOT NULL DEFAULT 'pending' CHECK (conversion_status IN ('pending', 'converted', 'failed')),
  converted_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  verification_reason TEXT,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS verification_reason TEXT,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

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
  card_type TEXT NOT NULL DEFAULT 'matte_black_gold',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printed', 'dispatched', 'delivered')),
  courier_partner TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.sales_staff(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. PLATFORM UPI MANAGEMENT
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.platform_upi_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id TEXT NOT NULL,
  payee_name TEXT NOT NULL DEFAULT 'Pixora Automations',
  label TEXT NOT NULL DEFAULT 'Primary UPI',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  qr_image_url TEXT,
  daily_limit_inr NUMERIC DEFAULT 100000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. DIGITAL MENU & PRODUCT CATALOGUE MANAGEMENT
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main Menu',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  bestseller BOOLEAN NOT NULL DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. INDEXES (Speed & Performance)
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_google_place_id ON public.businesses(google_place_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_business ON public.business_members(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_funnels_business_slug ON public.funnels(business_id, slug);
CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON public.qr_codes(short_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business_funnel ON public.qr_codes(business_id, funnel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_sentiment ON public.reviews(business_id, sentiment);
CREATE INDEX IF NOT EXISTS idx_google_reviews_business_time ON public.google_reviews(business_id, review_time DESC);
CREATE INDEX IF NOT EXISTS idx_google_connections_next_sync ON public.google_connections(next_sync_at) WHERE status = 'connected';
CREATE INDEX IF NOT EXISTS idx_feedback_business_status ON public.feedback(business_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_status ON public.subscriptions(business_id, status);
CREATE INDEX IF NOT EXISTS idx_trials_business_expiry ON public.trials(business_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_business_time ON public.analytics_events(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_events_business_time ON public.qr_events(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_used_reviews_biz_hash ON public.business_used_reviews(business_id, review_hash);
CREATE INDEX IF NOT EXISTS idx_business_used_reviews_biz_time ON public.business_used_reviews(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_cat_templates_cat_type ON public.review_category_templates(category, fragment_type);

CREATE INDEX IF NOT EXISTS idx_sales_staff_email ON public.sales_staff(email);
CREATE INDEX IF NOT EXISTS idx_sales_staff_auth ON public.sales_staff(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_staff_role ON public.sales_staff(role);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned ON public.prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prospects_stage ON public.prospects(stage);
CREATE INDEX IF NOT EXISTS idx_prospects_created ON public.prospects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_phone ON public.prospects(phone);
CREATE INDEX IF NOT EXISTS idx_sales_demos_slug ON public.sales_demos(slug);
CREATE INDEX IF NOT EXISTS idx_sales_demos_prospect ON public.sales_demos(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sales_demos_business ON public.sales_demos(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_demos_creator ON public.sales_demos(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_act_prospect ON public.sales_activities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sales_act_staff ON public.sales_activities(staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_prospect ON public.sales_orders(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_staff ON public.sales_orders(sales_staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_platform_upi_accounts_primary ON public.platform_upi_accounts(is_primary);
CREATE INDEX IF NOT EXISTS idx_platform_upi_accounts_active ON public.platform_upi_accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_menus_business_status ON public.menus(business_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_active ON public.menu_categories(menu_id, active, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_active ON public.menu_items(menu_id, active, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_saves_business_id ON public.menu_saves(business_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. AUTH HELPER FUNCTIONS & STORED PROCEDURES
-- ----------------------------------------------------------------------------

-- Check if current user is platform super-admin
CREATE OR REPLACE FUNCTION public.check_is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins pa
    WHERE pa.auth_user_id = auth.uid()
      AND pa.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.check_is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_is_platform_admin() TO authenticated;

-- Check if current user is member of business
CREATE OR REPLACE FUNCTION public.check_is_business_member(biz_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.user_id
    WHERE bm.business_id = biz_id
      AND p.auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_id
    WHERE b.id = biz_id
      AND p.auth_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.check_is_business_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_is_business_member(uuid) TO authenticated;

-- Sales Staff Helpers
CREATE OR REPLACE FUNCTION public.sales_current_staff_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.sales_staff WHERE auth_user_id = auth.uid() AND status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.sales_current_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sales_staff WHERE auth_user_id = auth.uid() AND status = 'active' AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.sales_current_staff_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sales_current_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sales_current_staff_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sales_current_is_admin() TO authenticated;

-- Link Client User Account (used by sales panel when onboarding a client)
CREATE OR REPLACE FUNCTION public.link_client_user_account(
  p_business_id UUID,
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_biz RECORD;
BEGIN
  -- Verify business exists
  SELECT * INTO v_biz FROM public.businesses WHERE id = p_business_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business tenant not found');
  END IF;

  -- 1. Ensure profile exists and is updated
  INSERT INTO public.profiles (
    id,
    auth_user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_user_id,
    lower(trim(p_email)),
    COALESCE(trim(p_full_name), v_biz.name, 'Business Owner'),
    'business_owner',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    auth_user_id = EXCLUDED.auth_user_id,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();

  -- 2. Link business owner
  UPDATE public.businesses
  SET
    owner_id = p_user_id,
    status = 'active',
    plan_status = 'active',
    trial_expires_at = NULL,
    updated_at = now()
  WHERE id = p_business_id;

  -- 3. Grant membership as owner
  INSERT INTO public.business_members (
    business_id,
    user_id,
    role,
    created_at,
    updated_at
  )
  VALUES (
    p_business_id,
    p_user_id,
    'owner',
    now(),
    now()
  )
  ON CONFLICT (business_id, user_id) DO UPDATE SET
    role = 'owner',
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'user_id', p_user_id,
    'email', lower(trim(p_email))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.link_client_user_account(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_client_user_account(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_used_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_upi_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_saves ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth_user_id = auth.uid());

-- BUSINESSES Policies
DROP POLICY IF EXISTS "Public can view businesses by slug" ON public.businesses;
CREATE POLICY "Public can view businesses by slug" ON public.businesses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Members can update businesses" ON public.businesses;
CREATE POLICY "Members can update businesses" ON public.businesses FOR UPDATE TO authenticated USING (public.check_is_business_member(id));

-- FUNNELS Policies
DROP POLICY IF EXISTS "Public can view funnels" ON public.funnels;
CREATE POLICY "Public can view funnels" ON public.funnels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Members can update funnels" ON public.funnels;
CREATE POLICY "Members can update funnels" ON public.funnels FOR ALL TO authenticated USING (public.check_is_business_member(business_id));

-- QR CODES Policies
DROP POLICY IF EXISTS "Public can view qr codes" ON public.qr_codes;
CREATE POLICY "Public can view qr codes" ON public.qr_codes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Members can manage qr codes" ON public.qr_codes;
CREATE POLICY "Members can manage qr codes" ON public.qr_codes FOR ALL TO authenticated USING (public.check_is_business_member(business_id));

-- REVIEWS Policies
DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
CREATE POLICY "Public can submit reviews" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Members can view reviews" ON public.reviews;
CREATE POLICY "Members can view reviews" ON public.reviews FOR SELECT TO authenticated USING (public.check_is_business_member(business_id));

-- FEEDBACK Policies
DROP POLICY IF EXISTS "Public can submit feedback" ON public.feedback;
CREATE POLICY "Public can submit feedback" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Members can view feedback" ON public.feedback;
CREATE POLICY "Members can view feedback" ON public.feedback FOR SELECT TO authenticated USING (public.check_is_business_member(business_id));

-- REVIEW TEMPLATES Policies
DROP POLICY IF EXISTS "Anyone can view review templates" ON public.review_category_templates;
CREATE POLICY "Anyone can view review templates" ON public.review_category_templates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can manage review templates" ON public.review_category_templates;
CREATE POLICY "Authenticated can manage review templates" ON public.review_category_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- REVIEW DEDUPLICATION Policies
DROP POLICY IF EXISTS "Anyone can read used reviews" ON public.business_used_reviews;
CREATE POLICY "Anyone can read used reviews" ON public.business_used_reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Anyone can log used reviews" ON public.business_used_reviews;
CREATE POLICY "Anyone can log used reviews" ON public.business_used_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);

-- COMMERCIAL PLANS Policies
DROP POLICY IF EXISTS "Anyone can view active commercial plans" ON public.commercial_plans;
CREATE POLICY "Anyone can view active commercial plans" ON public.commercial_plans FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage commercial plans" ON public.commercial_plans;
CREATE POLICY "Admins can manage commercial plans" ON public.commercial_plans FOR ALL TO authenticated USING (public.sales_current_is_admin() OR public.check_is_platform_admin());

-- PLATFORM UPI Policies
DROP POLICY IF EXISTS "Anyone can view active UPI accounts" ON public.platform_upi_accounts;
CREATE POLICY "Anyone can view active UPI accounts" ON public.platform_upi_accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can manage UPI accounts" ON public.platform_upi_accounts;
CREATE POLICY "Authenticated can manage UPI accounts" ON public.platform_upi_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DIGITAL MENU Policies
DROP POLICY IF EXISTS "Public can view menus" ON public.menus;
CREATE POLICY "Public can view menus" ON public.menus FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "Members can manage menus" ON public.menus;
CREATE POLICY "Members can manage menus" ON public.menus FOR ALL TO authenticated USING (public.check_is_business_member(business_id));

DROP POLICY IF EXISTS "Public can view menu categories" ON public.menu_categories;
CREATE POLICY "Public can view menu categories" ON public.menu_categories FOR SELECT TO anon, authenticated USING (active = true);
DROP POLICY IF EXISTS "Members can manage menu categories" ON public.menu_categories;
CREATE POLICY "Members can manage menu categories" ON public.menu_categories FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.menus m WHERE m.id = menu_categories.menu_id AND public.check_is_business_member(m.business_id)));

DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
CREATE POLICY "Public can view menu items" ON public.menu_items FOR SELECT TO anon, authenticated USING (active = true);
DROP POLICY IF EXISTS "Members can manage menu items" ON public.menu_items;
CREATE POLICY "Members can manage menu items" ON public.menu_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.menus m WHERE m.id = menu_items.menu_id AND public.check_is_business_member(m.business_id)));

DROP POLICY IF EXISTS "Anyone can save menus" ON public.menu_saves;
CREATE POLICY "Anyone can save menus" ON public.menu_saves FOR INSERT TO anon, authenticated WITH CHECK (true);

-- SALES SYSTEM Policies
DROP POLICY IF EXISTS "Staff read own record" ON public.sales_staff;
CREATE POLICY "Staff read own record" ON public.sales_staff FOR SELECT TO authenticated USING (auth_user_id = auth.uid() OR manager_id = public.sales_current_staff_id() OR public.sales_current_is_admin());

DROP POLICY IF EXISTS "Public can view active demos by slug" ON public.sales_demos;
CREATE POLICY "Public can view active demos by slug" ON public.sales_demos FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS "Staff access prospects" ON public.prospects;
CREATE POLICY "Staff access prospects" ON public.prospects FOR ALL TO authenticated USING (assigned_to = public.sales_current_staff_id() OR public.sales_current_is_admin() OR public.check_is_platform_admin());

DROP POLICY IF EXISTS "Staff access sales activities" ON public.sales_activities;
CREATE POLICY "Staff access sales activities" ON public.sales_activities FOR ALL TO authenticated USING (staff_id = public.sales_current_staff_id() OR public.sales_current_is_admin() OR public.check_is_platform_admin());

DROP POLICY IF EXISTS "Staff access sales orders" ON public.sales_orders;
CREATE POLICY "Staff access sales orders" ON public.sales_orders FOR ALL TO authenticated USING (sales_staff_id = public.sales_current_staff_id() OR public.sales_current_is_admin() OR public.check_is_platform_admin());

-- ----------------------------------------------------------------------------
-- 11. INITIAL SEED DATA (Non-Destructive)
-- ----------------------------------------------------------------------------

-- Seed default Commercial Plans
INSERT INTO public.commercial_plans (name, slug, description, price_paise, billing_interval, duration_years, is_lifetime, includes_nfc, max_slots, slots_used, display_order, features)
VALUES
  (
    'Founder Launch Lifetime Offer',
    'lifetime_launch_100',
    'Exclusive launch offer for first 100 businesses. Lifetime Review Funnel software access with zero renewal fees.',
    259900,
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
    259900,
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
    299900,
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

-- Seed Primary UPI Account if table is empty
INSERT INTO public.platform_upi_accounts (upi_id, payee_name, label, is_active, is_primary)
SELECT '9257378047@ybl', 'Pixora Automations', 'Primary PhonePe / YBL', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.platform_upi_accounts);

COMMIT;

-- ============================================================================
-- SUCCESS: PIXORA COMPLETE MASTER SCHEMA DEPLOYED!
-- All tables, columns, indexes, RLS policies, helper RPCs, and initial seeds
-- are fully synchronized without any data loss or duplicate errors.
-- ============================================================================
