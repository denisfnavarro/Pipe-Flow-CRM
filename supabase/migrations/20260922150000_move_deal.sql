-- Reordenação do Kanban em transação.
--
-- Arrastar um card mexe em duas colunas: o destino abre espaço e a origem fecha
-- o buraco. Fazer isso em várias chamadas do cliente deixaria janelas com
-- posições duplicadas ou com furos, visíveis para quem estivesse olhando o
-- mesmo board. Aqui é uma transação só, com as duas colunas travadas.
--
-- `security invoker`: a função roda sob o RLS de quem chama. Mover um negócio de
-- outro workspace simplesmente não encontra a linha.

create or replace function public.move_deal(
  p_deal_id uuid,
  p_stage public.deal_stage,
  p_position integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_workspace uuid;
  v_from public.deal_stage;
  v_count integer;
  v_pos integer;
begin
  select workspace_id, stage
    into v_workspace, v_from
    from public.deals
   where id = p_deal_id
   for update;

  if not found then
    raise exception 'Negócio não encontrado' using errcode = 'P0002';
  end if;

  -- Trava as duas colunas antes de contar: sem isso, dois arrastes simultâneos
  -- poderiam calcular a mesma posição alvo.
  perform 1
     from public.deals
    where workspace_id = v_workspace
      and stage in (v_from, p_stage)
    for update;

  select count(*)
    into v_count
    from public.deals
   where workspace_id = v_workspace
     and stage = p_stage
     and id <> p_deal_id;

  v_pos := least(greatest(coalesce(p_position, 0), 0), v_count);

  update public.deals set stage = p_stage where id = p_deal_id;

  -- Destino: o card entra imediatamente antes de quem ocupa a posição alvo.
  -- O `- 0.5` é o truque que faz o row_number posicioná-lo no lugar certo sem
  -- precisar de um passo separado de "abrir espaço".
  update public.deals d
     set position = o.idx
    from (
      select id,
             (row_number() over (
                order by case
                           when id = p_deal_id then v_pos - 0.5
                           else position::numeric
                         end,
                         created_at
              ))::int - 1 as idx
        from public.deals
       where workspace_id = v_workspace
         and stage = p_stage
    ) o
   where d.id = o.id
     and d.position is distinct from o.idx;

  -- Origem: renumera para fechar o buraco.
  if v_from is distinct from p_stage then
    update public.deals d
       set position = o.idx
      from (
        select id, (row_number() over (order by position, created_at))::int - 1 as idx
          from public.deals
         where workspace_id = v_workspace
           and stage = v_from
      ) o
     where d.id = o.id
       and d.position is distinct from o.idx;
  end if;
end;
$$;

revoke execute on function public.move_deal(uuid, public.deal_stage, integer) from public;
grant execute on function public.move_deal(uuid, public.deal_stage, integer) to authenticated;
