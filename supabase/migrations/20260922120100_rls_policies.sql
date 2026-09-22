-- PipeFlow CRM — Row Level Security
--
-- O RLS é a fronteira de segurança do produto: o filtro por workspace no
-- cliente é conveniência de UX, o isolamento de verdade acontece aqui.
--
-- Regra de papéis:
--   * member — trabalha leads, negócios e atividades do workspace;
--   * admin  — tudo isso, mais o workspace em si, o time, os convites e o plano.

-- ---------------------------------------------------------------------------
-- Helpers
--
-- São SECURITY DEFINER de propósito: uma policy de `workspace_members` que
-- consultasse `workspace_members` sob RLS entraria em recursão infinita. A
-- função roda fora do RLS e devolve só um booleano, sem vazar linha nenhuma.
-- ---------------------------------------------------------------------------

create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke execute on function public.is_workspace_member(uuid) from public;
revoke execute on function public.is_workspace_admin(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Habilita RLS em todas as tabelas. Sem exceção.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invites enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;
alter table public.subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

-- Você enxerga o seu perfil e o de quem divide algum workspace com você.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.workspace_members mine
      join public.workspace_members theirs
        on theirs.workspace_id = mine.workspace_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------

create policy workspaces_select on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

-- Qualquer pessoa autenticada cria o próprio workspace; o trigger a torna admin.
create policy workspaces_insert on public.workspaces
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy workspaces_update_admin on public.workspaces
  for update to authenticated
  using (public.is_workspace_admin(id))
  with check (public.is_workspace_admin(id));

create policy workspaces_delete_admin on public.workspaces
  for delete to authenticated
  using (public.is_workspace_admin(id));

-- ---------------------------------------------------------------------------
-- workspace_members
-- ---------------------------------------------------------------------------

create policy members_select on public.workspace_members
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy members_insert_admin on public.workspace_members
  for insert to authenticated
  with check (public.is_workspace_admin(workspace_id));

create policy members_update_admin on public.workspace_members
  for update to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

-- Admin remove qualquer um; membro só consegue sair sozinho.
create policy members_delete on public.workspace_members
  for delete to authenticated
  using (public.is_workspace_admin(workspace_id) or user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- invites — gestão do time é assunto de admin
-- ---------------------------------------------------------------------------

create policy invites_select_admin on public.invites
  for select to authenticated
  using (public.is_workspace_admin(workspace_id));

create policy invites_insert_admin on public.invites
  for insert to authenticated
  with check (public.is_workspace_admin(workspace_id) and invited_by = auth.uid());

create policy invites_update_admin on public.invites
  for update to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy invites_delete_admin on public.invites
  for delete to authenticated
  using (public.is_workspace_admin(workspace_id));

-- ---------------------------------------------------------------------------
-- leads, deals, activities — qualquer membro trabalha o funil
-- ---------------------------------------------------------------------------

create policy leads_select on public.leads
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy leads_insert on public.leads
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy leads_update on public.leads
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy leads_delete on public.leads
  for delete to authenticated
  using (public.is_workspace_member(workspace_id));

create policy deals_select on public.deals
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy deals_insert on public.deals
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy deals_update on public.deals
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy deals_delete on public.deals
  for delete to authenticated
  using (public.is_workspace_member(workspace_id));

create policy activities_select on public.activities
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- O autor vem da sessão, nunca do corpo da requisição.
create policy activities_insert on public.activities
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id) and author_id = auth.uid());

-- Histórico não se reescreve: só o autor apaga o que registrou.
create policy activities_delete_author on public.activities
  for delete to authenticated
  using (public.is_workspace_member(workspace_id) and author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- subscriptions — leitura para o time, escrita só pelo webhook
--
-- O webhook do Stripe usa a service_role, que ignora RLS. Nenhuma policy de
-- escrita aqui é justamente o ponto: o cliente não muda o próprio plano.
-- ---------------------------------------------------------------------------

create policy subscriptions_select_admin on public.subscriptions
  for select to authenticated
  using (public.is_workspace_admin(workspace_id));
