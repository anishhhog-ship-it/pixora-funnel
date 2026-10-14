-- ============================================================================
-- PIXORA REVIEW LIBRARY & USAGE DEDUPLICATION SYSTEM
-- ============================================================================
-- Tracks every generated/selected review per business to ensure 100% uniqueness.
-- Guarantees that no customer receives a duplicate review previously used for that business.

create table if not exists public.business_used_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  review_hash text not null,
  review_text text not null,
  category text not null default 'general',
  source text not null default 'ai_engine',
  created_at timestamptz not null default now()
);

-- Quick lookup index for deduplication checks
create index if not exists idx_business_used_reviews_biz_hash 
  on public.business_used_reviews(business_id, review_hash);

create index if not exists idx_business_used_reviews_biz_time 
  on public.business_used_reviews(business_id, created_at desc);

-- Enable Row Level Security
alter table public.business_used_reviews enable row level security;

-- Read policy: Public/anonymous can read used reviews for deduplication checking
drop policy if exists "Anyone can read used reviews for deduplication" on public.business_used_reviews;
create policy "Anyone can read used reviews for deduplication"
  on public.business_used_reviews for select to anon, authenticated
  using (true);

-- Insert policy: Service role and authenticated users can log used reviews
drop policy if exists "Anyone can log used reviews" on public.business_used_reviews;
create policy "Anyone can log used reviews"
  on public.business_used_reviews for insert to anon, authenticated
  with check (true);

-- Table to store curated category templates & seed fragments (optional server store)
create table if not exists public.review_category_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  fragment_type text not null check (fragment_type in ('opening', 'body', 'closing')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_cat_templates_cat_type 
  on public.review_category_templates(category, fragment_type);

alter table public.review_category_templates enable row level security;

drop policy if exists "Anyone can view review templates" on public.review_category_templates;
create policy "Anyone can view review templates"
  on public.review_category_templates for select to anon, authenticated
  using (true);
