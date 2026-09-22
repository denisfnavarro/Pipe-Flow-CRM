-- Limites do plano Free, aplicados pelo banco.
--
-- O CLAUDE.md é explícito: "checado no servidor, nunca só na UI". Um trigger é
-- mais forte do que uma checagem na Server Action — vale inclusive para
-- qualquer caminho que venha a existir depois (API pública, importação em
-- massa, um script de migração distraído).
--
-- A contagem roda só no plano Free. No Pro o trigger sai pela porta da frente
-- sem tocar em `count(*)`.

create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Sem policy nenhuma: só a service_role, que ignora RLS, escreve aqui.

comment on table public.stripe_events is
  'Idempotência do webhook: a Stripe reenvia eventos, e reprocessar uma assinatura duplicaria efeito.';

create or replace function public.enforce_lead_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.plan;
  v_count integer;
begin
  select plan into v_plan from public.workspaces where id = new.workspace_id;
  if v_plan <> 'free' then
    return new;
  end if;

  select count(*) into v_count from public.leads where workspace_id = new.workspace_id;

  if v_count >= 50 then
    raise exception 'O plano Free permite até 50 leads. Faça upgrade para cadastrar mais.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger leads_enforce_plan_limit
  before insert on public.leads
  for each row execute function public.enforce_lead_limit();

create or replace function public.enforce_seat_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.plan;
  v_members integer;
  v_pending integer;
begin
  select plan into v_plan from public.workspaces where id = new.workspace_id;
  if v_plan <> 'free' then
    return new;
  end if;

  select count(*) into v_members
    from public.workspace_members where workspace_id = new.workspace_id;

  -- Convite pendente já reserva a vaga: sem isso daria para convidar dez
  -- pessoas e estourar o limite no momento em que elas aceitassem.
  select count(*) into v_pending
    from public.invites
   where workspace_id = new.workspace_id
     and status = 'pending'
     and expires_at > now();

  if v_members + v_pending >= 2 then
    raise exception 'O plano Free permite até 2 colaboradores. Faça upgrade para convidar mais.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- Vale para o aceite de convite e para o convite em si.
create trigger workspace_members_enforce_plan_limit
  before insert on public.workspace_members
  for each row execute function public.enforce_seat_limit();

create trigger invites_enforce_plan_limit
  before insert on public.invites
  for each row execute function public.enforce_seat_limit();
