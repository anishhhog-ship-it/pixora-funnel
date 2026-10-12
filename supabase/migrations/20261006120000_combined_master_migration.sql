-- ============================================================================
-- PIXORA FUNNEL — COMPLETE COMBINED MASTER DATABASE MIGRATION
-- ============================================================================
-- Compatible with Supabase SQL Editor
-- Completely Idempotent (Safe to run multiple times)
-- Includes:
--   1. Extensions
--   2. Base Tables & Schema Updates (First 100 Accounts Engine, Visual Categories)
--   3. Private Feedback Resolution Shield (1-3 Stars)
--   4. Live Platform Numbers / Telemetry Table (581 Demos, 499 Funnels, etc.)
--   5. Full Performance Indexes
--   6. Row Level Security (RLS) & Policies
--   7. Stored Procedures & Auth Triggers
--   8. Storage Buckets Configuration
--   9. Initial Seed Data (Phone: +91 92573 78047)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. BASE TABLES (Created in Dependency Order)
-- ----------------------------------------------------------------------------

-- PROFILES (Maps 1:1 to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BUSINESSES (Tenants with Brand, Category Theme & Lifetime Plan details)
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
  font_style TEXT DEFAULT 'Modern',
  overlay_type TEXT DEFAULT 'gradient',
  overlay_opacity NUMERIC DEFAULT 0.65,
  headline TEXT,
  subheadline TEXT,
  suggested_cta TEXT,
  post_completion_cta TEXT,
  default_language TEXT DEFAULT 'English',
  menu_enabled BOOLEAN DEFAULT true,
  services_enabled BOOLEAN DEFAULT false,
  products_enabled BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  plan_status TEXT NOT NULL DEFAULT 'trial',
  plan_price NUMERIC DEFAULT 2599,
  trial_expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 day'),
  lifetime_slot_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- In case public.businesses was created earlier without newer columns:
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+91 92573 78047';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS custom_cover_image TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS visual_theme_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS overlay_type TEXT DEFAULT 'gradient';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS overlay_opacity NUMERIC DEFAULT 0.65;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subheadline TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS suggested_cta TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS post_completion_cta TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS products_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'trial';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS plan_price NUMERIC DEFAULT 2599;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 day');
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS lifetime_slot_number INTEGER;

-- BUSINESS MEMBERS (Multi-User Tenant RBAC)
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

-- TRIALS
CREATE TABLE IF NOT EXISTS public.trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 day'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- ONBOARDING PROGRESS
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT false,
  account_completed BOOLEAN NOT NULL DEFAULT false,
  business_completed BOOLEAN NOT NULL DEFAULT false,
  category_completed BOOLEAN NOT NULL DEFAULT false,
  branding_completed BOOLEAN NOT NULL DEFAULT false,
  funnel_completed BOOLEAN NOT NULL DEFAULT false,
  go_live_completed BOOLEAN NOT NULL DEFAULT false,
  step_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FUNNELS
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  review_enabled BOOLEAN NOT NULL DEFAULT true,
  smart_review_enabled BOOLEAN NOT NULL DEFAULT true,
  menu_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QR CODES
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  location_name TEXT,
  table_name TEXT,
  short_code TEXT UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  style TEXT NOT NULL DEFAULT 'classic',
  primary_color TEXT DEFAULT '#0B3D2E',
  secondary_color TEXT DEFAULT '#D4AF37',
  logo_url TEXT,
  cta_text TEXT DEFAULT 'Scan for Reviews & Menu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QR EVENTS (Scan Logging)
CREATE TABLE IF NOT EXISTS public.qr_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL DEFAULT 'scan',
  device_type TEXT,
  browser TEXT,
  language TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FUNNEL SESSIONS
CREATE TABLE IF NOT EXISTS public.funnel_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
  session_token TEXT UNIQUE NOT NULL,
  selected_rating INTEGER CHECK (selected_rating BETWEEN 1 AND 5),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- REVIEW SESSIONS
CREATE TABLE IF NOT EXISTS public.review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  funnel_session_id UUID REFERENCES public.funnel_sessions(id) ON DELETE CASCADE,
  customer_input TEXT,
  selected_rating INTEGER NOT NULL CHECK (selected_rating BETWEEN 1 AND 5),
  selected_topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REVIEW SUGGESTIONS
CREATE TABLE IF NOT EXISTS public.review_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  review_session_id UUID REFERENCES public.review_sessions(id) ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,
  suggestion_index INTEGER NOT NULL,
  selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRIVATE FEEDBACKS (1-3 Star Negative Resolution Shield)
CREATE TABLE IF NOT EXISTS public.private_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_slug TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  issue_types JSONB DEFAULT '[]'::jsonb,
  message TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GOOGLE CONNECTIONS
CREATE TABLE IF NOT EXISTS public.google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  google_account_id TEXT,
  google_location_id TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'expired')),
  scopes TEXT[] DEFAULT '{}'::text[],
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  encrypted_refresh_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GOOGLE REVIEWS
CREATE TABLE IF NOT EXISTS public.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  google_review_id TEXT NOT NULL,
  reviewer_name TEXT,
  reviewer_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  sentiment TEXT NOT NULL DEFAULT 'positive' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  topics JSONB DEFAULT '[]'::jsonb,
  reply_status TEXT NOT NULL DEFAULT 'unanswered' CHECK (reply_status IN ('unanswered', 'replied', 'draft')),
  reply_text TEXT,
  google_review_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, google_review_id)
);

-- REVIEW REPLIES
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  google_review_id UUID REFERENCES public.google_reviews(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'smart' CHECK (source IN ('manual', 'smart', 'auto')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REPLY TEMPLATES
CREATE TABLE IF NOT EXISTS public.reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT,
  rating_range TEXT,
  sentiment TEXT,
  topic TEXT,
  tone TEXT DEFAULT 'Warm & Professional',
  language TEXT DEFAULT 'English',
  template_text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REPLY RULES
CREATE TABLE IF NOT EXISTS public.reply_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  rating_min INTEGER NOT NULL DEFAULT 4 CHECK (rating_min BETWEEN 1 AND 5),
  rating_max INTEGER NOT NULL DEFAULT 5 CHECK (rating_max BETWEEN 1 AND 5),
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  approval_required BOOLEAN NOT NULL DEFAULT true,
  sensitive_issue_review BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MENUS
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main Menu',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MENU CATEGORIES
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

-- MENU ITEMS
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

-- MENU SAVES
CREATE TABLE IF NOT EXISTS public.menu_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'qr_scan',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CUSTOMER EVENTS
CREATE TABLE IF NOT EXISTS public.customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS public.business_settings (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_reply_tone TEXT DEFAULT 'Warm & Professional',
  auto_reply_language TEXT DEFAULT 'English',
  custom_reply_instructions TEXT,
  notifications_email BOOLEAN NOT NULL DEFAULT true,
  notifications_sms BOOLEAN NOT NULL DEFAULT false,
  notifications_whatsapp BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. LIVE PLATFORM NUMBERS / TELEMETRY TABLE
-- ----------------------------------------------------------------------------
-- Live metrics counter initialized with user requested starting references:
-- 581 demos provided, 499 active review funnels, 43,892 reviews, 37,640 replies
CREATE TABLE IF NOT EXISTS public.platform_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  demos_provided INTEGER NOT NULL DEFAULT 581,
  live_funnels INTEGER NOT NULL DEFAULT 499,
  reviews_delivered INTEGER NOT NULL DEFAULT 43892,
  auto_replies_sent INTEGER NOT NULL DEFAULT 37640,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_stats_single_row CHECK (id = 1)
);

INSERT INTO public.platform_stats (id, demos_provided, live_funnels, reviews_delivered, auto_replies_sent)
VALUES (1, 581, 499, 43892, 37640)
ON CONFLICT (id) DO UPDATE SET
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_plan_status ON public.businesses(plan_status);
CREATE INDEX IF NOT EXISTS idx_businesses_trial_expires ON public.businesses(trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_funnels_business_id ON public.funnels(business_id);
CREATE INDEX IF NOT EXISTS idx_funnels_slug ON public.funnels(slug);
CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON public.qr_codes(short_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business_id ON public.qr_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_events_qr_code_id ON public.qr_events(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_events_business_id ON public.qr_events(business_id);
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_token ON public.funnel_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_private_feedbacks_business ON public.private_feedbacks(business_id);
CREATE INDEX IF NOT EXISTS idx_private_feedbacks_status ON public.private_feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_google_reviews_business_rating ON public.google_reviews(business_id, rating);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_business_type ON public.analytics_events(business_id, event_type);

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) & IDEMPOTENT POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

-- Helper security definer function for tenant checks
CREATE OR REPLACE FUNCTION public.check_is_business_member(biz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members bm
    JOIN public.profiles p ON bm.user_id = p.id
    WHERE bm.business_id = biz_id AND p.auth_user_id = auth.uid()
  );
$$;

-- RLS Policies with Safe DROP IF EXISTS
-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth_user_id = auth.uid());

-- Businesses
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
CREATE POLICY "Public can view active businesses" ON public.businesses FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "Members can view their businesses" ON public.businesses;
CREATE POLICY "Members can view their businesses" ON public.businesses FOR SELECT TO authenticated USING (public.check_is_business_member(id));
DROP POLICY IF EXISTS "Members can update their businesses" ON public.businesses;
CREATE POLICY "Members can update their businesses" ON public.businesses FOR UPDATE TO authenticated USING (public.check_is_business_member(id));
DROP POLICY IF EXISTS "Authenticated can insert businesses" ON public.businesses;
CREATE POLICY "Authenticated can insert businesses" ON public.businesses FOR INSERT TO authenticated WITH CHECK (true);

-- Funnels & QR Codes (Public Read for Customer Mobile Scanning)
DROP POLICY IF EXISTS "Public can view active funnels" ON public.funnels;
CREATE POLICY "Public can view active funnels" ON public.funnels FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "Public can view active qr codes" ON public.qr_codes;
CREATE POLICY "Public can view active qr codes" ON public.qr_codes FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "Members can manage qr codes" ON public.qr_codes;
CREATE POLICY "Members can manage qr codes" ON public.qr_codes FOR ALL TO authenticated USING (public.check_is_business_member(business_id));

-- QR Events & Customer Sessions (Anon can write during table scan flow)
DROP POLICY IF EXISTS "Anyone can insert qr events" ON public.qr_events;
CREATE POLICY "Anyone can insert qr events" ON public.qr_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can manage funnel sessions" ON public.funnel_sessions;
CREATE POLICY "Anyone can manage funnel sessions" ON public.funnel_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can insert review sessions" ON public.review_sessions;
CREATE POLICY "Anyone can insert review sessions" ON public.review_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can read/write review suggestions" ON public.review_suggestions;
CREATE POLICY "Anyone can read/write review suggestions" ON public.review_suggestions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Private Feedbacks (Anon customers can submit 1-3 star feedback, business owners can manage)
DROP POLICY IF EXISTS "Anyone can submit private feedback" ON public.private_feedbacks;
CREATE POLICY "Anyone can submit private feedback" ON public.private_feedbacks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Members can view and resolve private feedback" ON public.private_feedbacks;
CREATE POLICY "Members can view and resolve private feedback" ON public.private_feedbacks FOR ALL TO authenticated USING (public.check_is_business_member(business_id));

-- Menus & Items (Public Read for Diners)
DROP POLICY IF EXISTS "Public can view menus" ON public.menus;
CREATE POLICY "Public can view menus" ON public.menus FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "Public can view menu categories" ON public.menu_categories;
CREATE POLICY "Public can view menu categories" ON public.menu_categories FOR SELECT TO anon, authenticated USING (active = true);
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
CREATE POLICY "Public can view menu items" ON public.menu_items FOR SELECT TO anon, authenticated USING (active = true);
DROP POLICY IF EXISTS "Anyone can save menus" ON public.menu_saves;
CREATE POLICY "Anyone can save menus" ON public.menu_saves FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Analytics & Events
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Members can view analytics events" ON public.analytics_events;
CREATE POLICY "Members can view analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (public.check_is_business_member(business_id));

-- Platform Stats (Public Read for Landing Page Counters)
DROP POLICY IF EXISTS "Public read platform stats" ON public.platform_stats;
CREATE POLICY "Public read platform stats" ON public.platform_stats FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can update platform stats" ON public.platform_stats;
CREATE POLICY "Authenticated can update platform stats" ON public.platform_stats FOR ALL TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 6. STORED PROCEDURES & AUTH TRIGGERS
-- ----------------------------------------------------------------------------

-- A. Automatically create user profile when user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', '+91 92573 78047')
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Atomically increment platform stats (Demos, Live Funnels, Reviews, Replies)
CREATE OR REPLACE FUNCTION public.increment_platform_stat(stat_name TEXT, increment_val INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_row public.platform_stats%ROWTYPE;
BEGIN
  IF stat_name = 'demos_provided' THEN
    UPDATE public.platform_stats 
    SET demos_provided = demos_provided + increment_val, updated_at = now() 
    WHERE id = 1 RETURNING * INTO result_row;
  ELSIF stat_name = 'live_funnels' THEN
    UPDATE public.platform_stats 
    SET live_funnels = live_funnels + increment_val, 
        reviews_delivered = reviews_delivered + (increment_val * 38),
        auto_replies_sent = auto_replies_sent + (increment_val * 32),
        updated_at = now() 
    WHERE id = 1 RETURNING * INTO result_row;
  ELSIF stat_name = 'reviews_delivered' THEN
    UPDATE public.platform_stats 
    SET reviews_delivered = reviews_delivered + increment_val, updated_at = now() 
    WHERE id = 1 RETURNING * INTO result_row;
  ELSIF stat_name = 'auto_replies_sent' THEN
    UPDATE public.platform_stats 
    SET auto_replies_sent = auto_replies_sent + increment_val, updated_at = now() 
    WHERE id = 1 RETURNING * INTO result_row;
  ELSE
    SELECT * INTO result_row FROM public.platform_stats WHERE id = 1;
  END IF;

  RETURN to_jsonb(result_row);
END;
$$;

-- C. Compute remaining lifetime discount slots (First 100 Accounts Engine)
CREATE OR REPLACE FUNCTION public.get_remaining_lifetime_slots()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_slots CONSTANT INTEGER := 100;
  claimed_count INTEGER;
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO claimed_count
  FROM public.businesses
  WHERE status = 'active' OR plan_status = 'active';

  claimed_count := GREATEST(claimed_count, 17);
  remaining_count := GREATEST(1, total_slots - claimed_count);

  RETURN jsonb_build_object(
    'total', total_slots,
    'claimed', claimed_count,
    'remaining', remaining_count
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. STORAGE BUCKETS (Safely created with exception suppression)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('business-assets', 'business-assets', true),
    ('menu-images', 'menu-images', true),
    ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if storage schema is not present in local test
  NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 8. INITIAL SEED DATA (Demo Business, QRs, Reviews & Live Metrics)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  demo_profile_id UUID := '11111111-1111-1111-1111-111111111111';
  demo_biz_id UUID := '22222222-2222-2222-2222-222222222222';
  demo_funnel_id UUID := '33333333-3333-3333-3333-333333333333';
  demo_menu_id UUID := '44444444-4444-4444-4444-444444444444';
  cat_starters_id UUID := '55555555-5555-5555-5555-555555555551';
  cat_mains_id UUID := '55555555-5555-5555-5555-555555555552';
  qr_counter_id UUID := '66666666-6666-6666-6666-666666666661';
  qr_table1_id UUID := '66666666-6666-6666-6666-666666666662';
BEGIN
  -- Profile
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    demo_profile_id,
    'Vikram Joshi',
    'vikram@yourbusiness.in',
    '+91 92573 78047',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Demo Business
  INSERT INTO public.businesses (
    id, owner_id, name, slug, category, description, tagline,
    phone, email, website, address, city, state, country,
    logo_url, cover_image_url, primary_color, secondary_color,
    font_style, default_language, menu_enabled, services_enabled, 
    status, plan_status, trial_expires_at
  )
  VALUES (
    demo_biz_id,
    demo_profile_id,
    'Your Business',
    'your-business',
    'Restaurant & Fine Dining',
    'Authentic Rajasthani & North Indian Royal Dining in the heart of the Pink City.',
    'Royal Flavours of Rajasthan & Traditional Hospitality',
    '+91 92573 78047',
    'hello@yourbusiness.in',
    'https://yourbusiness.in',
    '12, Hawa Mahal Road, Badi Choupad',
    'Jaipur',
    'Rajasthan',
    'India',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop',
    '#0B3D2E',
    '#D4AF37',
    'Modern',
    'English',
    true,
    false,
    'active',
    'active',
    now() + interval '30 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = '+91 92573 78047',
    updated_at = now();

  -- Membership
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (demo_biz_id, demo_profile_id, 'owner')
  ON CONFLICT (business_id, user_id) DO NOTHING;

  -- Funnel
  INSERT INTO public.funnels (id, business_id, slug, status, review_enabled, smart_review_enabled, menu_enabled)
  VALUES (demo_funnel_id, demo_biz_id, 'your-business', 'active', true, true, true)
  ON CONFLICT (id) DO NOTHING;

  -- QR Codes
  INSERT INTO public.qr_codes (
    id, business_id, funnel_id, name, location_name, table_name, short_code,
    destination_url, status, primary_color, secondary_color, cta_text
  )
  VALUES 
    (qr_counter_id, demo_biz_id, demo_funnel_id, 'Billing Counter QR', 'Reception / Billing Desk', 'Counter', 'bm-cntr', 'https://funnel.pixoraautomations.com/f/your-business?qr=bm-cntr', 'active', '#0B3D2E', '#D4AF37', 'Tap or Scan for Menu & Review'),
    (qr_table1_id, demo_biz_id, demo_funnel_id, 'Courtyard Table 01', 'Heritage Courtyard', 'Table 01', 'bm-t01', 'https://funnel.pixoraautomations.com/f/your-business?qr=bm-t01', 'active', '#0B3D2E', '#D4AF37', 'Scan to View Royal Menu')
  ON CONFLICT (id) DO NOTHING;

  -- Menu
  INSERT INTO public.menus (id, business_id, name, description, status)
  VALUES (demo_menu_id, demo_biz_id, 'Royal Heritage Dining Menu', 'Curated royal Rajasthani recipes cooked with cold-pressed ghee and clay ovens.', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- Categories
  INSERT INTO public.menu_categories (id, menu_id, name, description, sort_order, active)
  VALUES
    (cat_starters_id, demo_menu_id, 'Royal Starters & Kebabs', 'Clay oven tandoor skewers and traditional royal snacks', 1, true),
    (cat_mains_id, demo_menu_id, 'Heritage Curries & Dal', 'Slow-cooked royal curries and rich gravies', 2, true)
  ON CONFLICT (id) DO NOTHING;

  -- Sample Google Review
  INSERT INTO public.google_reviews (
    business_id, google_review_id, reviewer_name, reviewer_photo_url,
    rating, review_text, review_time, sentiment, reply_status, reply_text
  )
  VALUES (
    demo_biz_id,
    'g_rev_master_001',
    'Aarav Sharma',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    5,
    'Exceptional dining experience! The Dal Your Business was so rich and flavorful, easily the best Dal in Jaipur. The courtyard ambiance and royal treatment made our visit unforgettable.',
    now() - interval '1 day',
    'positive',
    'replied',
    'Thank you so much Aarav! It was an absolute pleasure hosting you. We look forward to welcoming you back for another royal feast soon!'
  )
  ON CONFLICT (business_id, google_review_id) DO NOTHING;

END $$;

-- ============================================================================
-- MIGRATION COMPLETE!
-- All tables, columns, indexes, RLS policies, live platform stats, and 
-- helper functions are ready for production deployment.
-- ============================================================================
