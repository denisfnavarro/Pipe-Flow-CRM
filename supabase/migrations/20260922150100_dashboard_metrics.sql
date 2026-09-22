-- Agregados do dashboard calculados no banco.
--
-- Trazer os negócios todos para somar em JavaScript funciona com 20 registros e
-- deixa de funcionar com 20 mil. Uma chamada, uma resposta, e o Postgres faz o
-- que ele faz bem.
--
-- `security invoker`: lê `deals` e `leads` sob o RLS do chamador, então pedir os
-- números de um workspace alheio devolve zeros.

create or replace function public.dashboard_metrics(p_workspace uuid)
returns json
language sql
stable
security invoker
set search_path = public
as $$
  with open_stages as (
    select array['new_lead', 'contacted', 'proposal_sent', 'negotiation']::public.deal_stage[] as v
  ),
  d as (
    select * from public.deals where workspace_id = p_workspace
  ),
  closed as (
    select
      count(*) filter (where stage = 'won') as won,
      count(*) filter (where stage in ('won', 'lost')) as total
    from d
  )
  select json_build_object(
    'totalLeads', (select count(*) from public.leads where workspace_id = p_workspace),
    'openDeals', (select count(*) from d, open_stages where d.stage = any(open_stages.v)),
    'pipelineValue', (
      select coalesce(sum(d.value), 0) from d, open_stages where d.stage = any(open_stages.v)
    ),
    'conversionRate', (
      select case when total = 0 then 0 else won::numeric / total end from closed
    ),
    -- `enum_range` garante as seis etapas mesmo quando alguma está vazia: o
    -- gráfico de funil precisa da coluna zerada, não da ausência dela.
    'funnel', (
      select json_agg(
        json_build_object(
          'stage', s.stage,
          'count', coalesce(agg.count, 0),
          'value', coalesce(agg.value, 0)
        )
        order by s.ord
      )
      from (
        select stage, row_number() over () as ord
          from unnest(enum_range(null::public.deal_stage)) as stage
      ) s
      left join (
        select stage, count(*) as count, sum(value) as value from d group by stage
      ) agg on agg.stage = s.stage
    )
  );
$$;

revoke execute on function public.dashboard_metrics(uuid) from public;
grant execute on function public.dashboard_metrics(uuid) to authenticated;
