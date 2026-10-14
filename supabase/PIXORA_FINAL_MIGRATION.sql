-- PIXORA FUNNEL | FINAL PRODUCTION RECONCILIATION
-- Apply after the timestamped migrations in supabase/migrations, in filename order.
-- This file is intentionally non-destructive: it does not drop tables, reset data,
-- create fake reviews/orders, or insert demo customer records.
--
-- Required deployment order:
--   1) Apply migrations/20261005000000 through 20261010999999.
--   2) Review this file in staging.
--   3) Apply this file to production with Supabase SQL editor or migrations deploy.
--   4) Provision the first platform_admins row manually through a protected channel.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Authoritative admin access helpers
-- ---------------------------------------------------------------------------
create or replace function public.check_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.auth_user_id = auth.uid()
      and pa.is_active = true
  );
$$;

revoke all on function public.check_is_platform_admin() from public;
grant execute on function public.check_is_platform_admin() to authenticated;

-- Membership helper used by tenant policies. Keep this SECURITY DEFINER to
-- avoid recursive reads through business_members RLS.
create or replace function public.check_is_business_member(biz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    join public.profiles p on p.id = bm.user_id
    where bm.business_id = biz_id
      and p.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.check_is_business_member(uuid) from public;
grant execute on function public.check_is_business_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Safe integrity additions (only add missing constraints/indexes)
-- ---------------------------------------------------------------------------
create index if not exists idx_business_members_user_business
  on public.business_members(user_id, business_id);
create index if not exists idx_analytics_events_business_time
  on public.analytics_events(business_id, created_at desc);
create index if not exists idx_qr_events_business_time
  on public.qr_events(business_id, created_at desc);
create index if not exists idx_google_reviews_business_time
  on public.google_reviews(business_id, review_time desc);
create index if not exists idx_trials_business_expiry
  on public.trials(business_id, expires_at desc);

-- No client-controlled clock or entitlement mutation is accepted here. The
-- application must use server-side entitlementService and audited admin actions.
alter table public.platform_admins enable row level security;
alter table public.admin_audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Admin tables: explicit read/write boundaries
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can view platform admins" on public.platform_admins;
create policy "Admins can view platform admins"
  on public.platform_admins for select to authenticated
  using (public.check_is_platform_admin());

drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
  on public.admin_audit_logs for select to authenticated
  using (public.check_is_platform_admin());

-- Audit rows are append-only from the browser. Server-side service code may
-- insert them using the service role after re-checking the admin identity.
revoke insert, update, delete on public.admin_audit_logs from anon, authenticated;

-- Platform role changes must never be possible from a normal client session.
revoke insert, update, delete on public.platform_admins from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tenant policies for the most sensitive private records
-- ---------------------------------------------------------------------------
alter table public.google_connections enable row level security;
alter table public.google_reviews enable row level security;
alter table public.review_replies enable row level security;
alter table public.customers enable row level security;
alter table public.customer_events enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "Members can view google connections" on public.google_connections;
create policy "Members can view google connections"
  on public.google_connections for select to authenticated
  using (public.check_is_business_member(business_id) or public.check_is_platform_admin());

drop policy if exists "Members can view google reviews" on public.google_reviews;
create policy "Members can view google reviews"
  on public.google_reviews for select to authenticated
  using (public.check_is_business_member(business_id) or public.check_is_platform_admin());

drop policy if exists "Members can view review replies" on public.review_replies;
create policy "Members can view review replies"
  on public.review_replies for select to authenticated
  using (public.check_is_business_member(business_id) or public.check_is_platform_admin());

drop policy if exists "Members can view customers" on public.customers;
create policy "Members can view customers"
  on public.customers for select to authenticated
  using (public.check_is_business_member(business_id) or public.check_is_platform_admin());

drop policy if exists "Members can view customer events" on public.customer_events;
create policy "Members can view customer events"
  on public.customer_events for select to authenticated
  using (public.check_is_business_member(business_id) or public.check_is_platform_admin());

drop policy if exists "Members can view analytics events" on public.analytics_events;
create policy "Members can view analytics events"
  on public.analytics_events for select to authenticated
  using (public.check_is_business_member(business_id) or public.check_is_platform_admin());

-- Anonymous analytics/review writes must go through a validated server route or
-- a narrowly scoped RPC that derives business_id from the funnel/QR identity.
revoke insert, update, delete on public.analytics_events from anon, authenticated;
revoke insert, update, delete on public.customer_events from anon, authenticated;
revoke insert, update, delete on public.google_connections from anon, authenticated;
revoke insert, update, delete on public.google_reviews from anon, authenticated;
revoke insert, update, delete on public.review_replies from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Trial state consistency (server time only)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_trial_status(target_business_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text;
begin
  if not public.check_is_business_member(target_business_id)
     and not public.check_is_platform_admin() then
    raise exception 'not authorized';
  end if;

  update public.trials
     set status = case when expires_at <= now() then 'expired' else status end
   where business_id = target_business_id
     and status = 'active';

  select coalesce(status, 'none') into next_status
    from public.trials
   where business_id = target_business_id
   order by expires_at desc
   limit 1;
  return next_status;
end;
$$;

revoke all on function public.refresh_trial_status(uuid) from public;
grant execute on function public.refresh_trial_status(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Review library & AI deduplication tracking
-- ---------------------------------------------------------------------------
create table if not exists public.business_used_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  review_hash text not null,
  review_text text not null,
  category text not null default 'general',
  source text not null default 'ai_engine',
  created_at timestamptz not null default now()
);

create index if not exists idx_business_used_reviews_biz_hash 
  on public.business_used_reviews(business_id, review_hash);

create index if not exists idx_business_used_reviews_biz_time 
  on public.business_used_reviews(business_id, created_at desc);

alter table public.business_used_reviews enable row level security;

drop policy if exists "Anyone can read used reviews for deduplication" on public.business_used_reviews;
create policy "Anyone can read used reviews for deduplication"
  on public.business_used_reviews for select to anon, authenticated
  using (true);

drop policy if exists "Anyone can log used reviews" on public.business_used_reviews;
create policy "Anyone can log used reviews"
  on public.business_used_reviews for insert to anon, authenticated
  with check (true);

commit;

-- Post-deploy verification (run separately; read-only):
-- select tablename, rowsecurity from pg_tables where schemaname = 'public'
--   and tablename in ('platform_admins','admin_audit_logs','customers','analytics_events');
-- select public.check_is_platform_admin();
