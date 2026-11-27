-- Enrich orphan-owner deletion log with registration geo + account created_at.

ALTER TABLE public.admin_owner_venue_deletions
  ADD COLUMN IF NOT EXISTS owner_registered_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_ip text,
  ADD COLUMN IF NOT EXISTS registration_country text,
  ADD COLUMN IF NOT EXISTS registration_city text;

CREATE INDEX IF NOT EXISTS admin_owner_venue_deletions_country_idx
  ON public.admin_owner_venue_deletions (lower(coalesce(registration_country, '')));
