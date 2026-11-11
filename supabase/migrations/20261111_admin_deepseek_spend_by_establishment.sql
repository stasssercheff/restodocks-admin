-- Map of DeepSeek spend per establishment for the admin Establishments tab.
-- Uses ai_spend_daily (fast); returns both all-time and last-30d rollups.

create or replace function public.admin_deepseek_spend_by_establishment()
returns jsonb
language plpgsql
security definer
set search_path = public
set statement_timeout = '60s'
as $$
declare
  v_from_30 date := ((timezone('utc', now()))::date - 30);
  v_result jsonb;
begin
  select coalesce(jsonb_object_agg(t.establishment_id::text, jsonb_build_object(
    'usdAll', t.usd_all,
    'usd30d', t.usd_30d,
    'tokensAll', t.tokens_all,
    'tokens30d', t.tokens_30d,
    'callsAll', t.calls_all,
    'calls30d', t.calls_30d
  )), '{}'::jsonb)
  into v_result
  from (
    select
      establishment_id,
      round(coalesce(sum(usd), 0)::numeric, 6) as usd_all,
      round(coalesce(sum(usd) filter (where day >= v_from_30), 0)::numeric, 6) as usd_30d,
      coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)), 0)::bigint as tokens_all,
      coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)) filter (where day >= v_from_30), 0)::bigint as tokens_30d,
      coalesce(sum(calls), 0)::bigint as calls_all,
      coalesce(sum(calls) filter (where day >= v_from_30), 0)::bigint as calls_30d
    from public.ai_spend_daily
    where lower(coalesce(provider, '')) = 'deepseek'
      and establishment_id is not null
      and establishment_id <> '00000000-0000-0000-0000-000000000001'::uuid
    group by 1
  ) t;

  return v_result;
end;
$$;

revoke all on function public.admin_deepseek_spend_by_establishment() from public;
grant execute on function public.admin_deepseek_spend_by_establishment() to service_role;
