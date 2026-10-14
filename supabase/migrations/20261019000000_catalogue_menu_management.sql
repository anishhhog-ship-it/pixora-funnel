-- ============================================================================
-- Migration: 20261019000000_catalogue_menu_management.sql
-- Description: Comprehensive schema, performance indexes, and RLS policies 
--              for Digital Menu & Product Catalogue Management
-- ============================================================================

-- 1. Ensure Tables Exist
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

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_menus_business_status ON public.menus(business_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_active ON public.menu_categories(menu_id, active, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_active ON public.menu_items(menu_id, active, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_saves_business_id ON public.menu_saves(business_id, created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_saves ENABLE ROW LEVEL SECURITY;

-- 4. Public Read Policies (for diners and QR customer funnel)
DROP POLICY IF EXISTS "Public can view menus" ON public.menus;
CREATE POLICY "Public can view menus" ON public.menus 
  FOR SELECT TO anon, authenticated 
  USING (status = 'active');

DROP POLICY IF EXISTS "Public can view menu categories" ON public.menu_categories;
CREATE POLICY "Public can view menu categories" ON public.menu_categories 
  FOR SELECT TO anon, authenticated 
  USING (active = true);

DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
CREATE POLICY "Public can view menu items" ON public.menu_items 
  FOR SELECT TO anon, authenticated 
  USING (active = true);

DROP POLICY IF EXISTS "Anyone can save menus" ON public.menu_saves;
CREATE POLICY "Anyone can save menus" ON public.menu_saves 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

-- 5. Business Member Management Policies (for client portal dashboard)
DROP POLICY IF EXISTS "Members can manage business menus" ON public.menus;
CREATE POLICY "Members can manage business menus" ON public.menus
  FOR ALL TO authenticated
  USING (public.check_is_business_member(business_id))
  WITH CHECK (public.check_is_business_member(business_id));

DROP POLICY IF EXISTS "Members can manage menu categories" ON public.menu_categories;
CREATE POLICY "Members can manage menu categories" ON public.menu_categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.menus m 
    WHERE m.id = menu_categories.menu_id 
      AND public.check_is_business_member(m.business_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.menus m 
    WHERE m.id = menu_categories.menu_id 
      AND public.check_is_business_member(m.business_id)
  ));

DROP POLICY IF EXISTS "Members can manage menu items" ON public.menu_items;
CREATE POLICY "Members can manage menu items" ON public.menu_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.menus m 
    WHERE m.id = menu_items.menu_id 
      AND public.check_is_business_member(m.business_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.menus m 
    WHERE m.id = menu_items.menu_id 
      AND public.check_is_business_member(m.business_id)
  ));

DROP POLICY IF EXISTS "Members can view menu saves" ON public.menu_saves;
CREATE POLICY "Members can view menu saves" ON public.menu_saves
  FOR SELECT TO authenticated
  USING (public.check_is_business_member(business_id));
