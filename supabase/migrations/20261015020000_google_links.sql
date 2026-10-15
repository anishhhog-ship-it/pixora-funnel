-- Keep the direct review form and public Maps profile links separate.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_review_url TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

CREATE INDEX IF NOT EXISTS idx_businesses_google_place_id
  ON public.businesses(google_place_id);
