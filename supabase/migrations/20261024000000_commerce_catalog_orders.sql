-- ============================================================================
-- Commerce catalog, inventory, and client orders
--
-- This migration is intentionally additive. The existing product_catalog,
-- orders, order_items, and nfc_orders tables have appeared with incompatible
-- shapes in earlier migrations and contain historical records. New client
-- orders therefore use commerce_orders/commerce_order_items and never rewrite
-- the existing order history.
-- ============================================================================

BEGIN;

-- Optional delivery detail used by the web and mobile profile editors.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS pincode TEXT;

-- The catalog remains the source of truth for product identity and current
-- pricing. Inventory is separate so stock changes do not alter catalog data or
-- historical order rows.
ALTER TABLE public.product_catalog
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_catalog_sku
  ON public.product_catalog (sku)
  WHERE sku IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.product_inventory (
  product_id UUID PRIMARY KEY REFERENCES public.product_catalog(id) ON DELETE RESTRICT,
  available_qty INTEGER NOT NULL DEFAULT 0 CHECK (available_qty >= 0),
  reserved_qty INTEGER NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing products start at zero stock. An administrator must explicitly
-- enter stock; the catalog never implies inventory from a price or seed row.
INSERT INTO public.product_inventory (product_id, low_stock_threshold)
SELECT id, COALESCE(low_stock_threshold, 5)
FROM public.product_catalog
ON CONFLICT (product_id) DO NOTHING;

-- Keep inventory present for catalog rows created by older admin services or
-- direct SQL. The stock value is still explicitly zero until an admin sets it.
CREATE OR REPLACE FUNCTION public.ensure_product_inventory_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.product_inventory (product_id, low_stock_threshold)
  VALUES (NEW.id, COALESCE(NEW.low_stock_threshold, 5))
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_catalog_inventory_after_insert ON public.product_catalog;
CREATE TRIGGER product_catalog_inventory_after_insert
  AFTER INSERT ON public.product_catalog
  FOR EACH ROW EXECUTE FUNCTION public.ensure_product_inventory_row();

CREATE TABLE IF NOT EXISTS public.commerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  subtotal_inr NUMERIC(12,2) NOT NULL CHECK (subtotal_inr >= 0),
  total_amount_inr NUMERIC(12,2) NOT NULL CHECK (total_amount_inr >= 0),
  payment_method TEXT NOT NULL DEFAULT 'manual' CHECK (payment_method IN ('manual', 'cod', 'online')),
  payment_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (payment_status IN ('pending_review', 'paid', 'failed', 'refunded')),
  status TEXT NOT NULL DEFAULT 'pending_admin_review' CHECK (status IN ('pending_admin_review', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  idempotency_key TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, idempotency_key),
  CHECK (char_length(trim(customer_name)) BETWEEN 1 AND 160),
  CHECK (char_length(trim(customer_email)) BETWEEN 3 AND 320),
  CHECK (char_length(trim(customer_phone)) BETWEEN 5 AND 40),
  CHECK (char_length(trim(shipping_address)) BETWEEN 5 AND 1000),
  CHECK (char_length(trim(city)) BETWEEN 1 AND 120),
  CHECK (char_length(trim(state)) BETWEEN 1 AND 120),
  CHECK (char_length(trim(postal_code)) BETWEEN 3 AND 20),
  CHECK (idempotency_key IS NULL OR char_length(trim(idempotency_key)) BETWEEN 1 AND 128)
);

CREATE TABLE IF NOT EXISTS public.commerce_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.commerce_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.product_catalog(id) ON DELETE SET NULL,
  sku_snapshot TEXT,
  product_name_snapshot TEXT NOT NULL,
  description_snapshot TEXT,
  image_url_snapshot TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  unit_price_inr NUMERIC(12,2) NOT NULL CHECK (unit_price_inr >= 0),
  line_total_inr NUMERIC(12,2) NOT NULL CHECK (line_total_inr >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commerce_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.commerce_orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  updated_by_admin UUID REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_inventory_low_stock
  ON public.product_inventory (available_qty, low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_customer_created
  ON public.commerce_orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_status_created
  ON public.commerce_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_business_created
  ON public.commerce_orders (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_order_items_order
  ON public.commerce_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_commerce_order_status_history_order
  ON public.commerce_order_status_history (order_id, created_at DESC);

ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_order_status_history ENABLE ROW LEVEL SECURITY;

-- Product catalog policies are re-declared by name so this migration is safe
-- after the earlier public-read policy and adds the missing admin write path.
DROP POLICY IF EXISTS "Public can view active products" ON public.product_catalog;
CREATE POLICY "Public can view active products" ON public.product_catalog
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage product catalog" ON public.product_catalog;
CREATE POLICY "Admins can manage product catalog" ON public.product_catalog
  FOR ALL TO authenticated USING (public.check_is_platform_admin())
  WITH CHECK (public.check_is_platform_admin());

DROP POLICY IF EXISTS "Public can view available product inventory" ON public.product_inventory;
CREATE POLICY "Public can view available product inventory" ON public.product_inventory
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.product_catalog p
      WHERE p.id = product_inventory.product_id AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage product inventory" ON public.product_inventory;
CREATE POLICY "Admins can manage product inventory" ON public.product_inventory
  FOR ALL TO authenticated USING (public.check_is_platform_admin())
  WITH CHECK (public.check_is_platform_admin());

DROP POLICY IF EXISTS "Clients can read own commerce orders" ON public.commerce_orders;
CREATE POLICY "Clients can read own commerce orders" ON public.commerce_orders
  FOR SELECT TO authenticated USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage commerce orders" ON public.commerce_orders;
CREATE POLICY "Admins can manage commerce orders" ON public.commerce_orders
  FOR ALL TO authenticated USING (public.check_is_platform_admin())
  WITH CHECK (public.check_is_platform_admin());

DROP POLICY IF EXISTS "Clients can read own commerce order items" ON public.commerce_order_items;
CREATE POLICY "Clients can read own commerce order items" ON public.commerce_order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.commerce_orders o
      WHERE o.id = commerce_order_items.order_id AND o.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage commerce order items" ON public.commerce_order_items;
CREATE POLICY "Admins can manage commerce order items" ON public.commerce_order_items
  FOR ALL TO authenticated USING (public.check_is_platform_admin())
  WITH CHECK (public.check_is_platform_admin());

DROP POLICY IF EXISTS "Clients can read own commerce order status history" ON public.commerce_order_status_history;
CREATE POLICY "Clients can read own commerce order status history" ON public.commerce_order_status_history
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.commerce_orders o
      WHERE o.id = commerce_order_status_history.order_id AND o.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage commerce order status history" ON public.commerce_order_status_history;
CREATE POLICY "Admins can manage commerce order status history" ON public.commerce_order_status_history
  FOR ALL TO authenticated USING (public.check_is_platform_admin())
  WITH CHECK (public.check_is_platform_admin());

-- Only an authenticated user's own identity or the server-side API may invoke
-- the order RPC. All stock checks and snapshots happen in one transaction.
CREATE OR REPLACE FUNCTION public.create_commerce_order(
  p_customer_id UUID,
  p_business_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address TEXT,
  p_city TEXT,
  p_state TEXT,
  p_postal_code TEXT,
  p_country TEXT,
  p_items JSONB,
  p_payment_method TEXT DEFAULT 'manual',
  p_idempotency_key TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.commerce_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.commerce_orders;
  v_existing public.commerce_orders;
  v_item JSONB;
  v_snapshot JSONB;
  v_snapshots JSONB[] := ARRAY[]::JSONB[];
  v_product_id UUID;
  v_seen_ids UUID[] := ARRAY[]::UUID[];
  v_quantity INTEGER;
  v_available INTEGER;
  v_product_name TEXT;
  v_description TEXT;
  v_image_url TEXT;
  v_sku TEXT;
  v_price NUMERIC(12,2);
  v_line_total NUMERIC(12,2);
  v_total NUMERIC(12,2) := 0;
BEGIN
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Authenticated customer identity does not match order customer' USING ERRCODE = '42501';
  END IF;

  IF p_payment_method NOT IN ('manual', 'cod', 'online') THEN
    RAISE EXCEPTION 'Unsupported payment method';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Order must contain between 1 and 50 items';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.commerce_orders
    WHERE customer_id = p_customer_id AND idempotency_key = trim(p_idempotency_key)
    LIMIT 1;
    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

  IF p_business_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id) THEN
      RAISE EXCEPTION 'Business was not found';
    END IF;
    IF auth.role() <> 'service_role' AND NOT EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = p_business_id
        AND (
          b.owner_id = p_customer_id
          OR b.owner_id IN (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = p_customer_id)
          OR EXISTS (
            SELECT 1
            FROM public.business_members bm
            JOIN public.profiles member_profile ON member_profile.id = bm.user_id
            WHERE bm.business_id = b.id AND member_profile.auth_user_id = p_customer_id
          )
        )
    ) THEN
      RAISE EXCEPTION 'Customer is not a member of this business' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_customer_name IS NULL OR char_length(trim(p_customer_name)) NOT BETWEEN 1 AND 160
     OR p_customer_email IS NULL OR char_length(trim(p_customer_email)) NOT BETWEEN 3 AND 320
     OR p_customer_phone IS NULL OR char_length(trim(p_customer_phone)) NOT BETWEEN 5 AND 40
     OR p_shipping_address IS NULL OR char_length(trim(p_shipping_address)) NOT BETWEEN 5 AND 1000
     OR p_city IS NULL OR char_length(trim(p_city)) NOT BETWEEN 1 AND 120
     OR p_state IS NULL OR char_length(trim(p_state)) NOT BETWEEN 1 AND 120
     OR p_postal_code IS NULL OR char_length(trim(p_postal_code)) NOT BETWEEN 3 AND 20 THEN
    RAISE EXCEPTION 'Complete customer and shipping details are required';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := (v_item->>'productId')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Each item must include a valid productId';
    END;

    BEGIN
      v_quantity := (v_item->>'quantity')::INTEGER;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Each item must include an integer quantity';
    END;

    IF v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 99 THEN
      RAISE EXCEPTION 'Each item quantity must be between 1 and 99';
    END IF;
    IF v_product_id = ANY(v_seen_ids) THEN
      RAISE EXCEPTION 'Duplicate products must be combined into one item';
    END IF;
    v_seen_ids := array_append(v_seen_ids, v_product_id);

    SELECT p.product_name, p.description, p.image_url, p.sku, p.price_inr, i.available_qty
    INTO v_product_name, v_description, v_image_url, v_sku, v_price, v_available
    FROM public.product_catalog p
    JOIN public.product_inventory i ON i.product_id = p.id
    WHERE p.id = v_product_id AND p.is_active = true
    FOR UPDATE OF p, i;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is unavailable', v_product_id;
    END IF;
    IF v_available < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (available: %, requested: %)', v_product_name, v_available, v_quantity;
    END IF;

    v_line_total := round(v_price * v_quantity, 2);
    v_total := round(v_total + v_line_total, 2);
    v_snapshot := jsonb_build_object(
      'productId', v_product_id,
      'sku', v_sku,
      'productName', v_product_name,
      'description', v_description,
      'imageUrl', v_image_url,
      'quantity', v_quantity,
      'unitPriceInr', v_price,
      'lineTotalInr', v_line_total
    );
    v_snapshots := array_append(v_snapshots, v_snapshot);
  END LOOP;

  INSERT INTO public.commerce_orders (
    order_number, customer_id, business_id, customer_name, customer_email,
    customer_phone, shipping_address, city, state, postal_code, country,
    subtotal_inr, total_amount_inr, payment_method, payment_status, status,
    idempotency_key, notes
  ) VALUES (
    'COM-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' ||
      substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6),
    p_customer_id, p_business_id, trim(p_customer_name), lower(trim(p_customer_email)),
    trim(p_customer_phone), trim(p_shipping_address), trim(p_city), trim(p_state),
    trim(p_postal_code), COALESCE(NULLIF(trim(p_country), ''), 'India'),
    v_total, v_total, p_payment_method, 'pending_review', 'pending_admin_review',
    NULLIF(trim(p_idempotency_key), ''), NULLIF(trim(p_notes), '')
  ) RETURNING * INTO v_order;

  FOREACH v_snapshot IN ARRAY v_snapshots
  LOOP
    v_product_id := (v_snapshot->>'productId')::UUID;
    v_quantity := (v_snapshot->>'quantity')::INTEGER;

    UPDATE public.product_inventory
    SET available_qty = available_qty - v_quantity,
        reserved_qty = reserved_qty + v_quantity,
        updated_at = now()
    WHERE product_id = v_product_id AND available_qty >= v_quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock changed while creating the order; please retry';
    END IF;

    INSERT INTO public.commerce_order_items (
      order_id, product_id, sku_snapshot, product_name_snapshot,
      description_snapshot, image_url_snapshot, quantity, unit_price_inr,
      line_total_inr
    ) VALUES (
      v_order.id, v_product_id, v_snapshot->>'sku', v_snapshot->>'productName',
      v_snapshot->>'description', v_snapshot->>'imageUrl', v_quantity,
      (v_snapshot->>'unitPriceInr')::NUMERIC, (v_snapshot->>'lineTotalInr')::NUMERIC
    );
  END LOOP;

  INSERT INTO public.commerce_order_status_history (order_id, previous_status, new_status, notes)
  VALUES (v_order.id, NULL, 'pending_admin_review', 'Order created; payment remains pending review.');

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_commerce_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_admin_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.commerce_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.commerce_orders;
  v_previous_status TEXT;
  v_item RECORD;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.check_is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform administrators may update commerce orders' USING ERRCODE = '42501';
  END IF;
  IF p_new_status NOT IN ('pending_admin_review', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Unsupported commerce order status';
  END IF;

  SELECT * INTO v_order FROM public.commerce_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commerce order was not found';
  END IF;
  IF v_order.status = 'cancelled' AND p_new_status <> 'cancelled' THEN
    RAISE EXCEPTION 'A cancelled order cannot be reopened';
  END IF;
  IF v_order.status = 'refunded' AND p_new_status <> 'refunded' THEN
    RAISE EXCEPTION 'A refunded order cannot be reopened';
  END IF;
  IF v_order.status = p_new_status THEN
    RETURN v_order;
  END IF;

  v_previous_status := v_order.status;

  -- Cancellation before shipment releases the reservation. Shipment consumes
  -- the reservation without returning it to available stock.
  IF p_new_status = 'cancelled' AND v_previous_status NOT IN ('shipped', 'delivered', 'cancelled', 'refunded') THEN
    FOR v_item IN SELECT product_id, quantity FROM public.commerce_order_items WHERE order_id = p_order_id
    LOOP
      IF v_item.product_id IS NOT NULL THEN
        UPDATE public.product_inventory
        SET available_qty = available_qty + v_item.quantity,
            reserved_qty = GREATEST(reserved_qty - v_item.quantity, 0),
            updated_at = now()
        WHERE product_id = v_item.product_id;
      END IF;
    END LOOP;
  ELSIF p_new_status IN ('shipped', 'delivered') AND v_previous_status NOT IN ('shipped', 'delivered') THEN
    FOR v_item IN SELECT product_id, quantity FROM public.commerce_order_items WHERE order_id = p_order_id
    LOOP
      IF v_item.product_id IS NOT NULL THEN
        UPDATE public.product_inventory
        SET reserved_qty = GREATEST(reserved_qty - v_item.quantity, 0),
            updated_at = now()
        WHERE product_id = v_item.product_id;
      END IF;
    END LOOP;
  END IF;

  UPDATE public.commerce_orders
  SET status = p_new_status, updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  INSERT INTO public.commerce_order_status_history (order_id, previous_status, new_status, notes, updated_by_admin)
  VALUES (
    p_order_id,
    v_previous_status,
    p_new_status,
    NULLIF(trim(p_notes), ''),
    CASE WHEN EXISTS (SELECT 1 FROM public.platform_admins WHERE id = p_admin_id) THEN p_admin_id ELSE NULL END
  );

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.create_commerce_order(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_commerce_order(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.update_commerce_order_status(UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_commerce_order_status(UUID, TEXT, UUID, TEXT) TO authenticated, service_role;

COMMIT;
