-- Учётные записи панели restodocks-admin (не сотрудники заведений).
-- RLS включён без политик: доступ только через service_role.

create table if not exists admin_panel_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  is_owner boolean not null default false,
  pages text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_panel_users_email_idx on admin_panel_users (lower(email));

alter table admin_panel_users enable row level security;

comment on table admin_panel_users is
  'Логины админки Restodocks. Владелец создаёт сотрудников и выдаёт страницы.';
comment on column admin_panel_users.pages is
  'Ключи разделов: establishments, promo. Новые страницы добавляются в код ADMIN_PAGES.';
