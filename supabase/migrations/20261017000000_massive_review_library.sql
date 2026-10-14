-- ============================================================================
-- MASSIVE REVIEW LIBRARY & CATEGORY TEMPLATES MIGRATION
-- Adds rich seeds for: Clothes Stores, Perfume Stores, Offices, Real Estate
-- ============================================================================

-- 1. Ensure review_category_templates exists and supports full reviews
create table if not exists public.review_category_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  fragment_type text not null default 'body',
  content text not null,
  created_at timestamptz not null default now()
);

-- Drop old check constraint if it strictly limited to opening/body/closing
do $$
begin
  alter table public.review_category_templates drop constraint if exists review_category_templates_fragment_type_check;
  alter table public.review_category_templates add constraint review_category_templates_fragment_type_check 
    check (fragment_type in ('opening', 'body', 'closing', 'full_review'));
exception
  when others then null;
end $$;

-- Enable RLS
alter table public.review_category_templates enable row level security;

drop policy if exists "Anyone can view review templates" on public.review_category_templates;
create policy "Anyone can view review templates"
  on public.review_category_templates for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can insert review templates" on public.review_category_templates;
create policy "Authenticated users can insert review templates"
  on public.review_category_templates for insert to authenticated
  with check (true);

drop policy if exists "Authenticated users can manage review templates" on public.review_category_templates;
create policy "Authenticated users can manage review templates"
  on public.review_category_templates for all to authenticated
  using (true) with check (true);

-- Index for speedy category queries
create index if not exists idx_review_cat_templates_cat_type 
  on public.review_category_templates(category, fragment_type);

-- 2. Seed initial batch for requested industry categories
insert into public.review_category_templates (category, fragment_type, content)
values
  -- CLOTHES STORES
  ('Clothes Stores', 'body', 'Outstanding collection of clothing! The fabric quality is top-notch, breathable, and stitches are done to perfection. The staff helped me pick the right size with so much patience.'),
  ('Clothes Stores', 'body', 'Loved shopping here for ethnic and modern wear. The trial rooms were spotless and the fitting was spot on without needing any alterations.'),
  ('Clothes Stores', 'body', 'A true hidden gem for fashion enthusiasts. Trendy designs, fair pricing, and excellent garment durability even after multiple washes.'),
  ('Clothes Stores', 'body', 'The sales team has a remarkable sense of style. They gave me great pairing advice and made the entire shopping experience enjoyable and quick.'),
  ('Clothes Stores', 'body', 'High-end boutique feel without the exorbitant price tags. The fabric feels luxurious against the skin and their seasonal drops are always on point.'),
  ('Clothes Stores', 'body', 'Purchased wedding outfits for the entire family. Every single piece fit impeccably and drew compliments throughout the celebrations.'),

  -- PERFUME STORES
  ('Perfume Stores', 'body', 'Incredible selection of long-lasting fragrances and artisanal attars! The projection and sillage are beastly — still smelling fresh on my clothes after 14 hours.'),
  ('Perfume Stores', 'body', 'The fragrance specialists here know their notes inside out. They guided me through woody, floral, and oriental accords until I found my exact signature scent.'),
  ('Perfume Stores', 'body', 'Authentic designer perfumes and rich alcohol-free attars. Generous tester experience without any pressure to buy. Beautiful packaging too!'),
  ('Perfume Stores', 'body', 'I am completely hooked on their oud and amber blends. Unique fragrances that you won''t easily find in mainstream department stores.'),
  ('Perfume Stores', 'body', 'The scent lingers gracefully throughout the entire day. Top marks for authenticity, bottle presentation, and genuine customer care.'),
  ('Perfume Stores', 'body', 'Best perfume boutique in town! The staff let me test multiple blends patiently on scent strips and explained the dry-down stages in detail.'),

  -- OFFICES & WORKSPACES
  ('Offices', 'body', 'Exceptional professional workspace with high-speed fiber internet, ergonomic chairs, and whisper-quiet work zones. Perfect environment for focused execution.'),
  ('Offices', 'body', 'The conference rooms and video booth facilities are equipped with state-of-the-art tech. Impressed our international clients during board meetings.'),
  ('Offices', 'body', 'Flawless building management, round-the-clock security, and pristine cleanliness. The cafeteria and fresh coffee amenities make workdays a pleasure.'),
  ('Offices', 'body', 'A prime business address that elevates our corporate brand identity. Prompt facility maintenance team that solves any requirement in minutes.'),
  ('Offices', 'body', 'Highly productive corporate environment with abundant natural light, ample basement parking, and smooth access control.'),
  ('Offices', 'body', 'The coworking culture and networking opportunities here are unmatched. Welcoming reception staff and seamless day-to-day operations.'),

  -- REAL ESTATES
  ('Real Estates', 'body', 'Most transparent and trustworthy real estate consultancy I have dealt with. Clear legal documentation, zero hidden charges, and realistic valuations.'),
  ('Real Estates', 'body', 'They showed us verified residential properties matching our exact budget and lifestyle. Smooth registry and bank loan assistance from start to finish.'),
  ('Real Estates', 'body', 'Honest advisory with genuine market insights. They never pushed a bad property and patiently organized site visits across multiple weekends.'),
  ('Real Estates', 'body', 'Helped us close a prime commercial space deal with favorable lease terms. Highly professional team that respects your time and investment goals.'),
  ('Real Estates', 'body', 'Flawless handover and verified title deeds. If you want peace of mind when buying property, this is the agency to trust completely.'),
  ('Real Estates', 'body', 'From initial site visit to final possession key handover, their executive guided us through every stamp duty and municipal approval step effortlessly.')
on conflict do nothing;
