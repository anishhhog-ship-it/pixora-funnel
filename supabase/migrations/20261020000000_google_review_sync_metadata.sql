-- Metadata for compliant, idempotent Google Business Profile review imports.
ALTER TABLE public.google_connections
  ADD COLUMN IF NOT EXISTS initial_sync_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_google_connections_next_sync
  ON public.google_connections (next_sync_at)
  WHERE status = 'connected';

COMMENT ON COLUMN public.google_connections.initial_sync_completed_at IS
  'Set after the first complete paginated import through the authorized Google Business Profile API.';
COMMENT ON COLUMN public.google_connections.next_sync_at IS
  'Expected next scheduled sync time; used for portal status and operational monitoring.';
COMMENT ON COLUMN public.google_connections.sync_error IS
  'Last non-secret sync error for client/admin diagnostics.';
