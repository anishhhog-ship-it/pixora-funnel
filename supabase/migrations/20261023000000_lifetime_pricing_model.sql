-- Canonical Pixora commercial pricing model.
--
-- Active paid plans after this migration:
--   lifetime_software       = INR 2,599, lifetime, no NFC, no cap
--   lifetime_software_nfc   = INR 2,999, lifetime, NFC delivery, no cap
--
-- This version intentionally uses plain SQL statements rather than a DO block
-- so it can be pasted directly into the Supabase SQL editor.

BEGIN;

-- Rename the old commercial rows first so their historical records can be
-- retained without colliding with the canonical slugs below.
UPDATE public.commercial_plans
SET slug = '__legacy_lifetime_software', updated_at = now()
WHERE slug = 'lifetime_launch_100';

UPDATE public.commercial_plans
SET slug = '__legacy_software_2_year', updated_at = now()
WHERE slug = 'standard_2year_software';

UPDATE public.commercial_plans
SET slug = '__legacy_nfc_2_year', updated_at = now()
WHERE slug = 'standard_2year_nfc';

-- Preserve historical orders while normalizing their plan references.
UPDATE public.sales_orders
SET plan_slug = 'lifetime_software', updated_at = now()
WHERE plan_slug IN ('lifetime_launch_100', 'standard_2year_software');

UPDATE public.sales_orders
SET plan_slug = 'lifetime_software_nfc', updated_at = now()
WHERE plan_slug = 'standard_2year_nfc';

-- Rebuild the canonical software-only plan.
UPDATE public.commercial_plans
SET
  name = 'Lifetime Software',
  description = 'Lifetime Pixora Review Funnel software access without NFC hardware.',
  slug = 'lifetime_software',
  price_paise = 259900,
  billing_interval = 'lifetime',
  duration_years = 0,
  is_lifetime = true,
  includes_nfc = false,
  max_slots = NULL,
  is_active = true,
  display_order = 1,
  features = '["Lifetime Review Funnel Software", "Unlimited Google Reviews Routing", "Smart AI Review Wizard", "Custom QR Stand Asset", "No account cap"]'::jsonb,
  updated_at = now()
WHERE slug = '__legacy_lifetime_software';

-- Rebuild the canonical NFC plan.
UPDATE public.commercial_plans
SET
  name = 'Lifetime Software + NFC doorstep delivery',
  description = 'Lifetime Pixora Review Funnel software access with NFC hardware delivered to your doorstep.',
  slug = 'lifetime_software_nfc',
  price_paise = 299900,
  billing_interval = 'lifetime',
  duration_years = 0,
  is_lifetime = true,
  includes_nfc = true,
  max_slots = NULL,
  is_active = true,
  display_order = 2,
  features = '["Lifetime Review Funnel Software", "Unlimited Google Reviews Routing", "Smart AI Review Wizard", "Custom NFC Review Card + Stand", "Doorstep delivery in India", "No account cap"]'::jsonb,
  updated_at = now()
WHERE slug = '__legacy_nfc_2_year';

-- If the legacy rows were absent, create the canonical rows.
INSERT INTO public.commercial_plans
  (name, slug, description, price_paise, billing_interval, duration_years,
   is_lifetime, includes_nfc, max_slots, slots_used, is_active, display_order, features)
VALUES
  ('Lifetime Software', 'lifetime_software', 'Lifetime Pixora Review Funnel software access without NFC hardware.', 259900, 'lifetime', 0, true, false, NULL, 0, true, 1, '["Lifetime Review Funnel Software", "Unlimited Google Reviews Routing", "Smart AI Review Wizard", "Custom QR Stand Asset", "No account cap"]'::jsonb),
  ('Lifetime Software + NFC doorstep delivery', 'lifetime_software_nfc', 'Lifetime Pixora Review Funnel software access with NFC hardware delivered to your doorstep.', 299900, 'lifetime', 0, true, true, NULL, 0, true, 2, '["Lifetime Review Funnel Software", "Unlimited Google Reviews Routing", "Smart AI Review Wizard", "Custom NFC Review Card + Stand", "Doorstep delivery in India", "No account cap"]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_paise = EXCLUDED.price_paise,
  billing_interval = EXCLUDED.billing_interval,
  duration_years = EXCLUDED.duration_years,
  is_lifetime = EXCLUDED.is_lifetime,
  includes_nfc = EXCLUDED.includes_nfc,
  max_slots = EXCLUDED.max_slots,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  features = EXCLUDED.features,
  updated_at = now();

-- Deactivate every other commercial paid catalog entry without deleting
-- historical orders.
UPDATE public.commercial_plans
SET is_active = false, updated_at = now()
WHERE is_active = true
  AND slug NOT IN ('lifetime_software', 'lifetime_software_nfc');

COMMIT;
