-- PIXORA FUNNEL - Production Database Schema
-- Multi-Tenant Architecture with Row Level Security (RLS)
-- Version: 20261005000000 (Idempotent & Dependency-Ordered)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. BASE TABLES (Created in Dependency Order)
-- ============================================================================

-- PROFILES
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

-- BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  description TEXT,
  tagline TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  logo_url TEXT,
  cover_image_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  secondary_color TEXT DEFAULT '#F59E0B',
  accent_color TEXT,
  font_style TEXT DEFAULT 'Modern',
  default_language TEXT DEFAULT 'English',
  menu_enabled BOOLEAN DEFAULT true,
  services_enabled BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  primary_color TEXT DEFAULT '#0F172A',
  secondary_color TEXT DEFAULT '#2563EB',
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
  encrypted_refresh_token TEXT, -- server-side only
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
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE, -- NULL = global template
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_reply_tone TEXT NOT NULL DEFAULT 'Warm & Professional',
  auto_reply_language TEXT NOT NULL DEFAULT 'English',
  custom_reply_instructions TEXT,
  business_hours JSONB DEFAULT '[]'::jsonb,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb,
  appearance_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- Defined AFTER profiles and business_members exist
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_business_member(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.user_id
    WHERE bm.business_id = target_business_id
      AND p.auth_user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner_or_admin(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.user_id
    WHERE bm.business_id = target_business_id
      AND p.auth_user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
  );
END;
$$;

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- All policies use DROP IF EXISTS for clean idempotency
-- ============================================================================

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = auth_user_id);

-- BUSINESSES RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
CREATE POLICY "Public can view active businesses" 
  ON public.businesses FOR SELECT 
  TO anon, authenticated 
  USING (status = 'active');

DROP POLICY IF EXISTS "Members can view their business" ON public.businesses;
CREATE POLICY "Members can view their business" 
  ON public.businesses FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(id));

DROP POLICY IF EXISTS "Authenticated users can create business" ON public.businesses;
CREATE POLICY "Authenticated users can create business" 
  ON public.businesses FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update their business" ON public.businesses;
CREATE POLICY "Admins can update their business" 
  ON public.businesses FOR UPDATE 
  TO authenticated 
  USING (public.is_business_owner_or_admin(id));

-- BUSINESS MEMBERS RLS
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view fellow business members" ON public.business_members;
CREATE POLICY "Members can view fellow business members" 
  ON public.business_members FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Owners can manage business members" ON public.business_members;
CREATE POLICY "Owners can manage business members" 
  ON public.business_members FOR ALL 
  TO authenticated 
  USING (public.is_business_owner_or_admin(business_id));

DROP POLICY IF EXISTS "Users can insert membership during creation" ON public.business_members;
CREATE POLICY "Users can insert membership during creation" 
  ON public.business_members FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- TRIALS RLS
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own trials" ON public.trials;
CREATE POLICY "Users can view own trials" 
  ON public.trials FOR SELECT 
  TO authenticated 
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR (business_id IS NOT NULL AND public.is_business_member(business_id))
  );

DROP POLICY IF EXISTS "Users can create trial on signup" ON public.trials;
CREATE POLICY "Users can create trial on signup" 
  ON public.trials FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own trial" ON public.trials;
CREATE POLICY "Users can update own trial" 
  ON public.trials FOR UPDATE 
  TO authenticated 
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- ONBOARDING PROGRESS RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can manage own onboarding progress" 
  ON public.onboarding_progress FOR ALL 
  TO authenticated 
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR (business_id IS NOT NULL AND public.is_business_member(business_id))
  );

-- FUNNELS RLS
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active funnels by slug" ON public.funnels;
CREATE POLICY "Public can view active funnels by slug" 
  ON public.funnels FOR SELECT 
  TO anon, authenticated 
  USING (status = 'active');

DROP POLICY IF EXISTS "Members can manage business funnels" ON public.funnels;
CREATE POLICY "Members can manage business funnels" 
  ON public.funnels FOR ALL 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- QR CODES RLS
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can resolve active QR codes by short_code" ON public.qr_codes;
CREATE POLICY "Public can resolve active QR codes by short_code" 
  ON public.qr_codes FOR SELECT 
  TO anon, authenticated 
  USING (status = 'active');

DROP POLICY IF EXISTS "Members can manage business QR codes" ON public.qr_codes;
CREATE POLICY "Members can manage business QR codes" 
  ON public.qr_codes FOR ALL 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- QR EVENTS RLS
ALTER TABLE public.qr_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can log QR events anonymously" ON public.qr_events;
CREATE POLICY "Public can log QR events anonymously" 
  ON public.qr_events FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view their QR analytics events" ON public.qr_events;
CREATE POLICY "Members can view their QR analytics events" 
  ON public.qr_events FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- FUNNEL SESSIONS RLS
ALTER TABLE public.funnel_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can create and update funnel sessions" ON public.funnel_sessions;
CREATE POLICY "Public can create and update funnel sessions" 
  ON public.funnel_sessions FOR ALL 
  TO anon, authenticated 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view funnel sessions" ON public.funnel_sessions;
CREATE POLICY "Members can view funnel sessions" 
  ON public.funnel_sessions FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- REVIEW SESSIONS RLS
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert review sessions" ON public.review_sessions;
CREATE POLICY "Public can insert review sessions" 
  ON public.review_sessions FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can select review session by id" ON public.review_sessions;
CREATE POLICY "Public can select review session by id" 
  ON public.review_sessions FOR SELECT 
  TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Members can view review sessions" ON public.review_sessions;
CREATE POLICY "Members can view review sessions" 
  ON public.review_sessions FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- REVIEW SUGGESTIONS RLS
ALTER TABLE public.review_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view and select review suggestions for session" ON public.review_suggestions;
CREATE POLICY "Public can view and select review suggestions for session" 
  ON public.review_suggestions FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view review suggestions" ON public.review_suggestions;
CREATE POLICY "Members can view review suggestions" 
  ON public.review_suggestions FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- GOOGLE CONNECTIONS RLS
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view connection status" ON public.google_connections;
CREATE POLICY "Members can view connection status" 
  ON public.google_connections FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Admins can manage google connections" ON public.google_connections;
CREATE POLICY "Admins can manage google connections" 
  ON public.google_connections FOR ALL 
  TO authenticated 
  USING (public.is_business_owner_or_admin(business_id));

-- GOOGLE REVIEWS RLS
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view google reviews" ON public.google_reviews;
CREATE POLICY "Members can view google reviews" 
  ON public.google_reviews FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members can manage google reviews" ON public.google_reviews;
CREATE POLICY "Members can manage google reviews" 
  ON public.google_reviews FOR ALL 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- REVIEW REPLIES RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view review replies" ON public.review_replies;
CREATE POLICY "Members can view review replies" 
  ON public.review_replies FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members can manage review replies" ON public.review_replies;
CREATE POLICY "Members can manage review replies" 
  ON public.review_replies FOR ALL 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- REPLY TEMPLATES RLS
ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view global and business templates" ON public.reply_templates;
CREATE POLICY "Members can view global and business templates" 
  ON public.reply_templates FOR SELECT 
  TO authenticated 
  USING (business_id IS NULL OR public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members can manage own business templates" ON public.reply_templates;
CREATE POLICY "Members can manage own business templates" 
  ON public.reply_templates FOR ALL 
  TO authenticated 
  USING (business_id IS NOT NULL AND public.is_business_owner_or_admin(business_id));

-- REPLY RULES RLS
ALTER TABLE public.reply_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view reply rules" ON public.reply_rules;
CREATE POLICY "Members can view reply rules" 
  ON public.reply_rules FOR SELECT 
  TO authenticated 
  USING (business_id IS NULL OR public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members can manage reply rules" ON public.reply_rules;
CREATE POLICY "Members can manage reply rules" 
  ON public.reply_rules FOR ALL 
  TO authenticated 
  USING (business_id IS NOT NULL AND public.is_business_owner_or_admin(business_id));

-- MENUS RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active menus" ON public.menus;
CREATE POLICY "Public can view active menus" 
  ON public.menus FOR SELECT 
  TO anon, authenticated 
  USING (status = 'active');

DROP POLICY IF EXISTS "Members can manage business menus" ON public.menus;
CREATE POLICY "Members can manage business menus" 
  ON public.menus FOR ALL 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- MENU CATEGORIES RLS
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active menu categories" ON public.menu_categories;
CREATE POLICY "Public can view active menu categories" 
  ON public.menu_categories FOR SELECT 
  TO anon, authenticated 
  USING (active = true);

DROP POLICY IF EXISTS "Members can manage menu categories" ON public.menu_categories;
CREATE POLICY "Members can manage menu categories" 
  ON public.menu_categories FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.menus m 
    WHERE m.id = menu_id AND public.is_business_member(m.business_id)
  ));

-- MENU ITEMS RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active menu items" ON public.menu_items;
CREATE POLICY "Public can view active menu items" 
  ON public.menu_items FOR SELECT 
  TO anon, authenticated 
  USING (active = true);

DROP POLICY IF EXISTS "Members can manage menu items" ON public.menu_items;
CREATE POLICY "Members can manage menu items" 
  ON public.menu_items FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.menus m 
    WHERE m.id = menu_id AND public.is_business_member(m.business_id)
  ));

-- MENU SAVES RLS
ALTER TABLE public.menu_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can save menu anonymously" ON public.menu_saves;
CREATE POLICY "Public can save menu anonymously" 
  ON public.menu_saves FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view menu saves" ON public.menu_saves;
CREATE POLICY "Members can view menu saves" 
  ON public.menu_saves FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- CUSTOMERS RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view customers" ON public.customers;
CREATE POLICY "Members can view customers" 
  ON public.customers FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members can manage customers" ON public.customers;
CREATE POLICY "Members can manage customers" 
  ON public.customers FOR ALL 
  TO authenticated 
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Public can insert or update customer during flow" ON public.customers;
CREATE POLICY "Public can insert or update customer during flow" 
  ON public.customers FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- CUSTOMER EVENTS RLS
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can log customer events" ON public.customer_events;
CREATE POLICY "Public can log customer events" 
  ON public.customer_events FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view customer events" ON public.customer_events;
CREATE POLICY "Members can view customer events" 
  ON public.customer_events FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- ANALYTICS EVENTS RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can record analytics events" ON public.analytics_events;
CREATE POLICY "Public can record analytics events" 
  ON public.analytics_events FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view business analytics events" ON public.analytics_events;
CREATE POLICY "Members can view business analytics events" 
  ON public.analytics_events FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

-- NOTIFICATIONS RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and update own notifications" ON public.notifications;
CREATE POLICY "Users can view and update own notifications" 
  ON public.notifications FOR ALL 
  TO authenticated 
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- BUSINESS SETTINGS RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view business settings" ON public.business_settings;
CREATE POLICY "Members can view business settings" 
  ON public.business_settings FOR SELECT 
  TO authenticated 
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Admins can update business settings" ON public.business_settings;
CREATE POLICY "Admins can update business settings" 
  ON public.business_settings FOR ALL 
  TO authenticated 
  USING (public.is_business_owner_or_admin(business_id));

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_funnels_slug ON public.funnels(slug);
CREATE INDEX IF NOT EXISTS idx_funnels_business ON public.funnels(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON public.qr_codes(short_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business ON public.qr_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_events_business_date ON public.qr_events(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_events_qr_code ON public.qr_events(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_token ON public.funnel_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_business ON public.funnel_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_business ON public.review_sessions(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_reviews_business_time ON public.google_reviews(business_id, review_time DESC);
CREATE INDEX IF NOT EXISTS idx_google_reviews_ext_id ON public.google_reviews(google_review_id);
CREATE INDEX IF NOT EXISTS idx_google_conn_business ON public.google_connections(business_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_review ON public.review_replies(google_review_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu ON public.menu_categories(menu_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu ON public.menu_items(menu_id, active);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_business_date ON public.analytics_events(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

-- ============================================================================
-- 5. AUTH SYNC TRIGGER
-- Automatically creates a profile when a new user signs up in auth.users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, email, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    NEW.raw_user_meta_data->>'avatar_url'
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

-- ============================================================================
-- 6. STORAGE BUCKETS (Metadata configuration)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('business-assets', 'business-assets', true),
  ('menu-images', 'menu-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies with idempotent DROP IF EXISTS
DROP POLICY IF EXISTS "Public read for business-assets" ON storage.objects;
CREATE POLICY "Public read for business-assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "Authenticated users can upload business-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload business-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "Public read for menu-images" ON storage.objects;
CREATE POLICY "Public read for menu-images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated users can upload menu-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload menu-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Public read for avatars" ON storage.objects;
CREATE POLICY "Public read for avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');
