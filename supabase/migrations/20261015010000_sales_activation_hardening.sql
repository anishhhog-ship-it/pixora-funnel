-- Sales launch hardening. Additive and intentionally not applied remotely.
-- The guarded blocks refuse to install an activation function unless every
-- referenced base table exists; the API has no non-transactional fallback.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.sales_demos') IS NOT NULL AND to_regclass('public.businesses') IS NOT NULL THEN
    ALTER TABLE public.sales_demos ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_sales_demos_business ON public.sales_demos(business_id);
  END IF;
  IF to_regclass('public.sales_orders') IS NOT NULL THEN
    ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS verification_reason text;
    ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS activated_at timestamptz;
  END IF;
END $$;

-- A manager may read staff rows but cannot mutate role/status/manager_id. The
-- service-role API remains the only write path and applies the same boundary.
DO $$
BEGIN
  IF to_regclass('public.sales_staff') IS NOT NULL THEN
    CREATE OR REPLACE FUNCTION public.sales_current_staff_id() RETURNS uuid
      LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
      AS 'SELECT id FROM public.sales_staff WHERE auth_user_id = auth.uid() AND status = ''active'' LIMIT 1';
    CREATE OR REPLACE FUNCTION public.sales_current_is_admin() RETURNS boolean
      LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
      AS 'SELECT EXISTS (SELECT 1 FROM public.sales_staff WHERE auth_user_id = auth.uid() AND status = ''active'' AND role = ''admin'')';
    REVOKE ALL ON FUNCTION public.sales_current_staff_id() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.sales_current_is_admin() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.sales_current_staff_id() TO authenticated;
    GRANT EXECUTE ON FUNCTION public.sales_current_is_admin() TO authenticated;
    DROP POLICY IF EXISTS "Admins full access sales_staff" ON public.sales_staff;
    DROP POLICY IF EXISTS "Staff read own record" ON public.sales_staff;
    DROP POLICY IF EXISTS "Sales admins manage staff" ON public.sales_staff;
    DROP POLICY IF EXISTS "Sales staff read scoped records" ON public.sales_staff;
    IF to_regclass('public.platform_admins') IS NOT NULL THEN
      CREATE POLICY "Sales admins manage staff" ON public.sales_staff FOR ALL TO authenticated
        USING (public.sales_current_is_admin()
               OR EXISTS (SELECT 1 FROM public.platform_admins p WHERE p.auth_user_id = auth.uid() AND p.role = 'super_admin' AND p.is_active))
        WITH CHECK (public.sales_current_is_admin()
               OR EXISTS (SELECT 1 FROM public.platform_admins p WHERE p.auth_user_id = auth.uid() AND p.role = 'super_admin' AND p.is_active));
    ELSE
      CREATE POLICY "Sales admins manage staff" ON public.sales_staff FOR ALL TO authenticated
        USING (public.sales_current_is_admin())
        WITH CHECK (public.sales_current_is_admin());
    END IF;
    CREATE POLICY "Sales staff read scoped records" ON public.sales_staff FOR SELECT TO authenticated
      USING (auth_user_id = auth.uid() OR manager_id = public.sales_current_staff_id());
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.sales_orders') IS NOT NULL AND to_regclass('public.sales_demos') IS NOT NULL
     AND to_regclass('public.businesses') IS NOT NULL AND to_regclass('public.profiles') IS NOT NULL
     AND to_regclass('public.business_members') IS NOT NULL AND to_regclass('public.funnels') IS NOT NULL
     AND to_regclass('public.qr_codes') IS NOT NULL AND to_regclass('public.subscriptions') IS NOT NULL
       AND to_regclass('public.prospects') IS NOT NULL AND to_regclass('public.sales_staff') IS NOT NULL
       AND to_regclass('public.sales_audit_logs') IS NOT NULL AND to_regclass('public.commercial_plans') IS NOT NULL
       -- These columns are added by the production reconciliation migration;
       -- refuse to install a function that would compile but fail at runtime
       -- against an older businesses/subscriptions schema.
       AND (SELECT count(*) FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'businesses'
              AND column_name IN ('plan_status', 'trial_expires_at')) = 2
       AND (SELECT count(*) FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'subscriptions'
              AND column_name IN ('payment_reference', 'payment_amount_inr')) = 2 THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.activate_sales_order(
        p_order_id uuid, p_verifier uuid, p_reason text
      ) RETURNS jsonb
      LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
      AS $body$
      DECLARE
        v_order public.sales_orders%ROWTYPE;
        v_demo public.sales_demos%ROWTYPE;
        v_business public.businesses%ROWTYPE;
        v_staff public.sales_staff%ROWTYPE;
        v_profile public.profiles%ROWTYPE;
        v_snapshot jsonb;
        v_expires timestamptz;
        v_slot_count integer;
      BEGIN
        IF p_reason IS NULL OR length(btrim(p_reason)) < 3 OR length(p_reason) > 1000 THEN
          RAISE EXCEPTION 'A verification reason between 3 and 1000 characters is required';
        END IF;
        SELECT * INTO v_staff FROM public.sales_staff WHERE auth_user_id = p_verifier AND status = 'active' AND role IN ('admin','sales_manager') FOR SHARE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Verifier is not an active sales manager or admin'; END IF;
        SELECT * INTO v_order FROM public.sales_orders WHERE id = p_order_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
        IF v_order.payment_status = 'VERIFIED' AND v_order.conversion_status = 'converted' THEN
          RETURN jsonb_build_object('status','active','order_id',v_order.id,'business_id',v_order.business_id);
        END IF;
        IF v_order.payment_status NOT IN ('PENDING','PENDING_APPROVAL') THEN RAISE EXCEPTION 'Order is not awaiting approval'; END IF;
        SELECT * INTO v_demo FROM public.sales_demos WHERE id = v_order.demo_id FOR UPDATE;
        IF NOT FOUND OR v_demo.business_id IS NULL THEN RAISE EXCEPTION 'Order demo is not activation-ready'; END IF;
        SELECT * INTO v_business FROM public.businesses WHERE id = v_demo.business_id FOR UPDATE;
        IF NOT FOUND OR v_business.slug <> v_demo.slug OR v_business.status <> 'trial' OR v_business.plan_status <> 'trial' THEN
          RAISE EXCEPTION 'Demo business is not an unactivated trial';
        END IF;
        v_snapshot := COALESCE(v_order.plan_snapshot, '{}'::jsonb);

        -- Profiles deliberately do not create an auth identity. A profile with
        -- a nullable auth_user_id is sufficient for tenant ownership/membership;
        -- account linking/invitation is a separate customer-onboarding action.
        SELECT * INTO v_profile FROM public.profiles WHERE lower(email) = lower(v_snapshot->>'customerEmail') ORDER BY created_at LIMIT 1 FOR UPDATE;
        IF NOT FOUND THEN
          INSERT INTO public.profiles(full_name,email,phone) VALUES (v_snapshot->>'customerName', lower(v_snapshot->>'customerEmail'), v_snapshot->>'customerPhone') RETURNING * INTO v_profile;
        END IF;
        UPDATE public.businesses SET owner_id=v_profile.id,status='active',plan_status='active',trial_expires_at=NULL,updated_at=now() WHERE id=v_business.id;
        INSERT INTO public.business_members(business_id,user_id,role) VALUES (v_business.id,v_profile.id,'owner') ON CONFLICT (business_id,user_id) DO UPDATE SET role='owner',updated_at=now();
        UPDATE public.funnels SET status='active',updated_at=now() WHERE business_id=v_business.id;
        UPDATE public.qr_codes SET status='active',destination_url=CASE WHEN destination_url IS NULL OR destination_url='' THEN '/f/'||v_business.slug ELSE destination_url END,updated_at=now() WHERE business_id=v_business.id;
        v_expires := CASE WHEN COALESCE((v_snapshot->>'isLifetime')::boolean,false) THEN NULL ELSE now() + make_interval(years => GREATEST(1,COALESCE((v_snapshot->>'durationYears')::integer,2))) END;
        UPDATE public.subscriptions SET status='active',is_lifetime=COALESCE((v_snapshot->>'isLifetime')::boolean,false),starts_at=COALESCE(starts_at,now()),expires_at=v_expires,payment_reference=COALESCE(v_order.transaction_reference,v_order.order_no),payment_amount_inr=v_order.amount_paise/100.0,updated_at=now() WHERE business_id=v_business.id;
        IF NOT FOUND THEN INSERT INTO public.subscriptions(business_id,status,is_lifetime,starts_at,expires_at,payment_reference,payment_amount_inr) VALUES (v_business.id,'active',COALESCE((v_snapshot->>'isLifetime')::boolean,false),now(),v_expires,COALESCE(v_order.transaction_reference,v_order.order_no),v_order.amount_paise/100.0); END IF;
        IF COALESCE((v_snapshot->>'isLifetime')::boolean,false) THEN
          UPDATE public.commercial_plans SET slots_used=slots_used+1,updated_at=now() WHERE slug=v_order.plan_slug AND is_active AND (max_slots IS NULL OR slots_used < max_slots);
          GET DIAGNOSTICS v_slot_count = ROW_COUNT;
          IF v_slot_count <> 1 THEN RAISE EXCEPTION 'Lifetime plan has no available slot'; END IF;
        END IF;
        UPDATE public.prospects SET stage='Activated',is_converted=true,converted_business_id=v_business.id,updated_at=now() WHERE id=v_order.prospect_id;
        UPDATE public.sales_demos SET status='converted',updated_at=now() WHERE id=v_demo.id;
        UPDATE public.sales_orders SET payment_status='VERIFIED',verified_by=p_verifier,verified_at=now(),verification_reason=btrim(p_reason),conversion_status='converted',converted_at=now(),activated_at=now(),business_id=v_business.id,updated_at=now() WHERE id=v_order.id;
        INSERT INTO public.sales_audit_logs(staff_id,staff_email,action,target_type,target_id,details) VALUES (v_staff.id,v_staff.email,'SALES_ORDER_ACTIVATED','sales_orders',v_order.id,jsonb_build_object('reason',btrim(p_reason),'business_id',v_business.id,'order_no',v_order.order_no));
        RETURN jsonb_build_object('status','active','order_id',v_order.id,'business_id',v_business.id,'slug',v_business.slug);
      END;
      $body$;
    $fn$;
    REVOKE ALL ON FUNCTION public.activate_sales_order(uuid,uuid,text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.activate_sales_order(uuid,uuid,text) TO service_role;
  END IF;
END $$;

COMMIT;
