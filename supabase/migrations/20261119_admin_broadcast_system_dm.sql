-- Batch insert system self-DMs for admin broadcast (inbox channel).
create or replace function public.admin_broadcast_system_dm(
  p_employee_ids uuid[],
  p_content text,
  p_links jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
set statement_timeout = '120s'
as $$
declare
  v_content text := btrim(coalesce(p_content, ''));
  v_links jsonb := coalesce(p_links, '[]'::jsonb);
  v_inserted int := 0;
begin
  if v_content = '' or p_employee_ids is null or cardinality(p_employee_ids) = 0 then
    return jsonb_build_object('inserted', 0);
  end if;

  insert into public.employee_direct_messages (
    sender_employee_id,
    recipient_employee_id,
    content,
    system_generated,
    system_links
  )
  select e.id, e.id, v_content, true, v_links
  from unnest(p_employee_ids) as e(id)
  where e.id is not null;

  get diagnostics v_inserted = row_count;
  return jsonb_build_object('inserted', v_inserted);
end;
$$;

revoke all on function public.admin_broadcast_system_dm(uuid[], text, jsonb) from public;
grant execute on function public.admin_broadcast_system_dm(uuid[], text, jsonb) to service_role;
