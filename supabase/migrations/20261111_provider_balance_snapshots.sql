-- Snapshots of provider wallet balances so admin can chart real deductions
-- (DeepSeek API only exposes current /user/balance, not usage history).
create table if not exists public.provider_balance_snapshots (
  id bigserial primary key,
  provider text not null,
  currency text not null default 'USD',
  captured_at timestamptz not null default now(),
  total_balance numeric(18, 6) not null,
  granted_balance numeric(18, 6) not null default 0,
  topped_up_balance numeric(18, 6) not null default 0,
  is_available boolean
);

create index if not exists provider_balance_snapshots_provider_captured_idx
  on public.provider_balance_snapshots (provider, captured_at desc);

alter table public.provider_balance_snapshots enable row level security;

revoke all on table public.provider_balance_snapshots from public;
grant select, insert on table public.provider_balance_snapshots to service_role;
grant usage, select on sequence public.provider_balance_snapshots_id_seq to service_role;
