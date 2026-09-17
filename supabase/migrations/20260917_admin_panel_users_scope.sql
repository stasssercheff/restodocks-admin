-- Узкий доступ партнёра: промокоды + глубина реферальной цепочки (1–5).

alter table admin_panel_users
  add column if not exists promo_codes text[] not null default '{}'::text[],
  add column if not exists referral_depth integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admin_panel_users_referral_depth_chk'
  ) then
    alter table admin_panel_users
      add constraint admin_panel_users_referral_depth_chk
      check (referral_depth >= 1 and referral_depth <= 5);
  end if;
end $$;

comment on column admin_panel_users.promo_codes is
  'Промокоды, по которым партнёр видит регистрации (уровень 1).';
comment on column admin_panel_users.referral_depth is
  'Сколько уровней реферальной цепочки показывать: 1 = только промокод, до 5 = рефералы рефералов.';
