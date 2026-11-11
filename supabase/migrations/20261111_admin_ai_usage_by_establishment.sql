-- Add byEstablishment to admin_ai_usage_stats + cron every 5 min for DeepSeek balance snapshots.

create or replace function public.admin_ai_usage_stats(
  p_from timestamptz,
  p_to timestamptz,
  p_provider text default null,
  p_context text default null,
  p_tz text default 'UTC',
  p_recent_limit int default 200
)
returns jsonb
language plpgsql
security definer
set search_path = public
set statement_timeout = '90s'
as $$
declare
  v_provider text := nullif(lower(trim(coalesce(p_provider, ''))), '');
  v_context text := nullif(lower(trim(coalesce(p_context, ''))), '');
  v_tz text := coalesce(nullif(trim(p_tz), ''), 'UTC');
  v_limit int := greatest(1, least(coalesce(p_recent_limit, 200), 2000));
  v_want_hour boolean := (p_to - p_from) <= interval '48 hours';
  v_summary jsonb;
  v_by_provider jsonb;
  v_by_context jsonb;
  v_by_day jsonb;
  v_by_hour jsonb := '[]'::jsonb;
  v_by_model jsonb;
  v_by_establishment jsonb;
  v_recent jsonb;
begin
  select jsonb_build_object(
    'requests', count(*)::bigint,
    'successRequests', count(*) filter (
      where lower(coalesce(status, 'ok')) in ('ok', 'success')
    )::bigint,
    'failedRequests', count(*) filter (
      where lower(coalesce(status, 'ok')) not in ('ok', 'success')
    )::bigint,
    'inputTokens', coalesce(sum(coalesce(input_tokens, 0)), 0)::bigint,
    'outputTokens', coalesce(sum(coalesce(output_tokens, 0)), 0)::bigint,
    'totalTokens', coalesce(sum(coalesce(total_tokens, 0)), 0)::bigint,
    'estimatedCostUsd', round(coalesce(sum(coalesce(estimated_cost_usd, 0)), 0)::numeric, 6)
  )
  into v_summary
  from public.ai_usage_logs
  where created_at >= p_from
    and created_at <= p_to
    and (v_provider is null or lower(coalesce(provider, '')) = v_provider)
    and (v_context is null or lower(coalesce(context, '')) = v_context);

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.requests desc), '[]'::jsonb)
  into v_by_provider
  from (
    select
      coalesce(nullif(provider, ''), '(empty)') as provider,
      count(*)::bigint as requests,
      coalesce(sum(coalesce(total_tokens, 0)), 0)::bigint as "totalTokens",
      round(coalesce(sum(coalesce(estimated_cost_usd, 0)), 0)::numeric, 6) as "estimatedCostUsd"
    from public.ai_usage_logs
    where created_at >= p_from
      and created_at <= p_to
      and (v_provider is null or lower(coalesce(provider, '')) = v_provider)
      and (v_context is null or lower(coalesce(context, '')) = v_context)
    group by 1
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.requests desc), '[]'::jsonb)
  into v_by_context
  from (
    select
      coalesce(nullif(context, ''), '(empty)') as context,
      count(*)::bigint as requests,
      coalesce(sum(coalesce(total_tokens, 0)), 0)::bigint as "totalTokens",
      round(coalesce(sum(coalesce(estimated_cost_usd, 0)), 0)::numeric, 6) as "estimatedCostUsd"
    from public.ai_usage_logs
    where created_at >= p_from
      and created_at <= p_to
      and (v_provider is null or lower(coalesce(provider, '')) = v_provider)
      and (v_context is null or lower(coalesce(context, '')) = v_context)
    group by 1
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.date), '[]'::jsonb)
  into v_by_day
  from (
    select
      to_char(timezone(v_tz, created_at), 'YYYY-MM-DD') as date,
      count(*)::bigint as requests,
      coalesce(sum(coalesce(total_tokens, 0)), 0)::bigint as "totalTokens",
      round(coalesce(sum(coalesce(estimated_cost_usd, 0)), 0)::numeric, 6) as "estimatedCostUsd"
    from public.ai_usage_logs
    where created_at >= p_from
      and created_at <= p_to
      and (v_provider is null or lower(coalesce(provider, '')) = v_provider)
      and (v_context is null or lower(coalesce(context, '')) = v_context)
    group by 1
  ) t;

  if v_want_hour then
    select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.date), '[]'::jsonb)
    into v_by_hour
    from (
      select
        to_char(date_trunc('hour', timezone(v_tz, created_at)), 'YYYY-MM-DD HH24:00') as date,
        count(*)::bigint as requests,
        coalesce(sum(coalesce(total_tokens, 0)), 0)::bigint as "totalTokens",
        round(coalesce(sum(coalesce(estimated_cost_usd, 0)), 0)::numeric, 6) as "estimatedCostUsd"
      from public.ai_usage_logs
      where created_at >= p_from
        and created_at <= p_to
        and (v_provider is null or lower(coalesce(provider, '')) = v_provider)
        and (v_context is null or lower(coalesce(context, '')) = v_context)
      group by 1
    ) t;
  end if;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t."estimatedCostUsd" desc, t.requests desc), '[]'::jsonb)
  into v_by_model
  from (
    select
      coalesce(nullif(trim(model), ''), '(empty)') as model,
      count(*)::bigint as requests,
      coalesce(sum(coalesce(total_tokens, 0)), 0)::bigint as "totalTokens",
      round(coalesce(sum(coalesce(estimated_cost_usd, 0)), 0)::numeric, 6) as "estimatedCostUsd"
    from public.ai_usage_logs
    where created_at >= p_from
      and created_at <= p_to
      and (v_provider is null or lower(coalesce(provider, '')) = v_provider)
      and (v_context is null or lower(coalesce(context, '')) = v_context)
    group by 1
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t."estimatedCostUsd" desc, t.requests desc), '[]'::jsonb)
  into v_by_establishment
  from (
    select
      l.establishment_id::text as "establishmentId",
      case
        when l.establishment_id is null then '(none)'
        when l.establishment_id = '00000000-0000-0000-0000-000000000001'::uuid then '(system)'
        else coalesce(nullif(trim(e.name), ''), '(unnamed)')
      end as name,
      count(*)::bigint as requests,
      coalesce(sum(coalesce(l.total_tokens, 0)), 0)::bigint as "totalTokens",
      round(coalesce(sum(coalesce(l.estimated_cost_usd, 0)), 0)::numeric, 6) as "estimatedCostUsd"
    from public.ai_usage_logs l
    left join public.establishments e on e.id = l.establishment_id
    where l.created_at >= p_from
      and l.created_at <= p_to
      and (v_provider is null or lower(coalesce(l.provider, '')) = v_provider)
      and (v_context is null or lower(coalesce(l.context, '')) = v_context)
    group by 1, 2
    order by 5 desc, 3 desc
    limit 40
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_recent
  from (
    select
      created_at,
      provider,
      model,
      context,
      function_name,
      input_tokens,
      output_tokens,
      total_tokens,
      estimated_cost_usd,
      status
    from public.ai_usage_logs
    where created_at >= p_from
      and created_at <= p_to
      and (v_provider is null or lower(coalesce(provider, '')) = v_provider)
      and (v_context is null or lower(coalesce(context, '')) = v_context)
    order by created_at desc
    limit v_limit
  ) t;

  return jsonb_build_object(
    'summary', v_summary,
    'byProvider', v_by_provider,
    'byContext', v_by_context,
    'byDay', v_by_day,
    'byHour', v_by_hour,
    'byModel', v_by_model,
    'byEstablishment', v_by_establishment,
    'recent', v_recent
  );
end;
$$;

revoke all on function public.admin_ai_usage_stats(timestamptz, timestamptz, text, text, text, int) from public;
grant execute on function public.admin_ai_usage_stats(timestamptz, timestamptz, text, text, text, int) to service_role;

-- Cron: snapshot DeepSeek balance every 5 minutes (independent of admin UI).
do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname = 'deepseek-balance-snapshot' limit 1;
  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;

  perform cron.schedule(
    'deepseek-balance-snapshot',
    '*/5 * * * *',
    $cron$
    select net.http_post(
      url := coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url' limit 1),
        'https://osglfptwbuqqmqunttha.supabase.co'
      ) || '/functions/v1/admin-provider-quotas',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(
          (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key' limit 1),
          ''
        ),
        'apikey', coalesce(
          (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key' limit 1),
          ''
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
    $cron$
  );
end;
$$;
