-- Track venue wipes so admin can list orphan owners and show 30-day cooling-off.

CREATE TABLE IF NOT EXISTS public.admin_owner_venue_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_auth_id uuid NOT NULL,
  owner_email text NOT NULL,
  establishment_id uuid NOT NULL,
  establishment_name text,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_owner_venue_deletions_owner_deleted_idx
  ON public.admin_owner_venue_deletions (owner_auth_id, deleted_at DESC);

CREATE INDEX IF NOT EXISTS admin_owner_venue_deletions_email_idx
  ON public.admin_owner_venue_deletions (lower(owner_email));

COMMENT ON TABLE public.admin_owner_venue_deletions IS
  'Admin log: venue deleted for this owner_auth_id. Used to list orphan owners and 30-day warnings.';

ALTER TABLE public.admin_owner_venue_deletions ENABLE ROW LEVEL SECURITY;
-- service_role only; no policies for authenticated clients.
