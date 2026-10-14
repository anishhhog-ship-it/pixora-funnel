-- ============================================================================
-- Migration: 20261016000000_sales_client_user_generation.sql
-- Description: Enables sales staff to generate client user accounts with
--              pre-set email and initial password, linking businesses to
--              new auth users so clients can log in directly and later change
--              their password in their dashboard profile section.
-- ============================================================================

BEGIN;

-- 1. Ensure business_members has unique constraint on (business_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'business_members_business_id_user_id_key'
  ) THEN
    ALTER TABLE public.business_members 
    ADD CONSTRAINT business_members_business_id_user_id_key UNIQUE (business_id, user_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Ensure index on businesses.owner_id
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);

-- 3. Secure RPC function: link_client_user_account
-- Callable by service_role (backend API) when salesperson provisions client credentials
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
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    lower(trim(p_email)),
    COALESCE(trim(p_full_name), v_biz.name, 'Business Owner'),
    'business_owner',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
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

  -- 4. Activate funnels and QR codes for immediate client readiness
  UPDATE public.funnels
  SET status = 'active', updated_at = now()
  WHERE business_id = p_business_id;

  UPDATE public.qr_codes
  SET status = 'active', updated_at = now()
  WHERE business_id = p_business_id;

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'user_id', p_user_id,
    'email', lower(trim(p_email)),
    'slug', v_biz.slug
  );
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.link_client_user_account(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_client_user_account(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.link_client_user_account(UUID, UUID, TEXT, TEXT) TO authenticated;

-- 4. Ensure RLS policies allow authenticated owners to manage their businesses
DO $$
BEGIN
  -- Businesses policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'businesses' AND policyname = 'Owner can view own business'
  ) THEN
    CREATE POLICY "Owner can view own business"
      ON public.businesses FOR SELECT
      TO authenticated
      USING (owner_id = auth.uid() OR id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'businesses' AND policyname = 'Owner can update own business'
  ) THEN
    CREATE POLICY "Owner can update own business"
      ON public.businesses FOR UPDATE
      TO authenticated
      USING (owner_id = auth.uid() OR id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

COMMIT;
