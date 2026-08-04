-- Промокод может выдавать доступ как подписка до фиксированной даты
-- или на N дней с момента активации.

alter table promo_codes
  add column if not exists grant_mode text not null default 'until_date'
    check (grant_mode in ('until_date', 'days')),
  add column if not exists grant_until date,
  add column if not exists grant_days integer
    check (grant_days is null or grant_days > 0);

comment on column promo_codes.grant_mode is
  'until_date = доступ до grant_until (как подписка); days = grant_days дней с активации';
comment on column promo_codes.grant_until is
  'Дата окончания доступа при grant_mode=until_date (независимо от дня активации)';
comment on column promo_codes.grant_days is
  'Число дней доступа с момента активации при grant_mode=days';
comment on column promo_codes.starts_at is
  'С какого момента код можно активировать (окно погашения, не срок доступа)';
comment on column promo_codes.expires_at is
  'До какого момента код можно активировать (окно погашения, не срок доступа)';
