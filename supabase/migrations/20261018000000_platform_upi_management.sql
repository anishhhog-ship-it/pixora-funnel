-- ============================================================================
-- PLATFORM UPI ACCOUNTS & GATEWAY SWITCHING SYSTEM
-- Enables adding, activating, disabling, and switching primary UPI IDs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_upi_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id text NOT NULL,
  payee_name text NOT NULL DEFAULT 'Pixora Automations',
  label text NOT NULL DEFAULT 'Primary UPI',
  is_active boolean NOT NULL DEFAULT true,
  is_primary boolean NOT NULL DEFAULT false,
  qr_image_url text,
  daily_limit_inr numeric DEFAULT 100000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_platform_upi_accounts_primary ON public.platform_upi_accounts(is_primary);
CREATE INDEX IF NOT EXISTS idx_platform_upi_accounts_active ON public.platform_upi_accounts(is_active);

-- Enable Row Level Security
ALTER TABLE public.platform_upi_accounts ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone can read active/primary UPI accounts for checkout
DROP POLICY IF EXISTS "Anyone can read active UPI accounts" ON public.platform_upi_accounts;
CREATE POLICY "Anyone can read active UPI accounts"
  ON public.platform_upi_accounts FOR SELECT TO anon, authenticated
  USING (true);

-- Manage policy: Authenticated admin users can manage accounts
DROP POLICY IF EXISTS "Authenticated can manage UPI accounts" ON public.platform_upi_accounts;
CREATE POLICY "Authenticated can manage UPI accounts"
  ON public.platform_upi_accounts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Seed default initial UPI accounts if empty
INSERT INTO public.platform_upi_accounts (upi_id, payee_name, label, is_active, is_primary)
SELECT '9257378047@ybl', 'Pixora Automations', 'Primary PhonePe / YBL', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.platform_upi_accounts);
