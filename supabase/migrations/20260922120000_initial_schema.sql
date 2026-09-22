-- PipeFlow CRM — schema inicial
--
-- Convenções:
--   * toda tabela de domínio carrega `workspace_id`, que é a fronteira de isolamento;
--   * valores monetários são inteiros em centavos;
--   * nomes de tabela e coluna em snake_case.
--
-- As policies de RLS ficam na migration seguinte.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.plan as enum ('free', 'pro');
create type public.member_role as enum ('admin', 'member');
create type public.lead_status as enum ('new', 'active', 'customer', 'lost');
create type public.activity_type as enum ('call', 'email', 'meeting', 'note');
create type public.invite_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- A ordem da declaração é a ordem das colunas do Kanban.
create type public.deal_stage as enum (
  'new_lead',
  'contacted',
  'proposal_sent',
  'negotiation',
  'won',
  'lost'
);

-- ---------------------------------------------------------------------------
-- profiles
--
-- `auth.users` não é legível pelo cliente, mas a UI precisa de nome e avatar do
-- responsável em toda listagem. Este espelho público resolve isso; é preenchido
-- por trigger no cadastro e nunca escrito pela aplicação.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- workspaces e membros
-- ---------------------------------------------------------------------------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  owner_id uuid not null references auth.users (id) on delete restrict,
  plan public.plan not null default 'free',
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  -- Uma pessoa entra uma vez só em cada workspace.
  unique (workspace_id, user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role public.member_role not null default 'member',
  token text not null unique,
  status public.invite_status not null default 'pending',
  invited_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Só um convite pendente por e-mail em cada workspace; os demais podem repetir.
create unique index invites_pending_unique
  on public.invites (workspace_id, lower(email))
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- Domínio comercial
-- ---------------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text,
  phone text,
  company text,
  title text,
  status public.lead_status not null default 'new',
  owner_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 140),
  -- Centavos. A formatação para BRL acontece só na view.
  value integer not null default 0 check (value >= 0),
  stage public.deal_stage not null default 'new_lead',
  lead_id uuid references public.leads (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete restrict,
  due_date timestamptz,
  -- Ordem dentro da coluna do Kanban; densa e começando em zero.
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  type public.activity_type not null,
  description text not null check (char_length(trim(description)) between 3 and 1000),
  author_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices
--
-- Toda leitura da aplicação filtra por workspace_id antes de qualquer outra
-- coisa, então ele encabeça os índices compostos.
-- ---------------------------------------------------------------------------

create index workspace_members_user_idx on public.workspace_members (user_id);
create index workspace_members_workspace_idx on public.workspace_members (workspace_id);
create index invites_workspace_idx on public.invites (workspace_id);
create index invites_token_idx on public.invites (token);

create index leads_workspace_created_idx on public.leads (workspace_id, created_at desc);
create index leads_workspace_owner_idx on public.leads (workspace_id, owner_id);
create index leads_workspace_status_idx on public.leads (workspace_id, status);

create index deals_workspace_stage_position_idx
  on public.deals (workspace_id, stage, position);
create index deals_workspace_owner_due_idx on public.deals (workspace_id, owner_id, due_date);
create index deals_lead_idx on public.deals (lead_id);

create index activities_lead_created_idx on public.activities (lead_id, created_at desc);
create index activities_workspace_idx on public.activities (workspace_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Espelha o cadastro do Auth em `profiles`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Quem cria o workspace entra nele como admin, na mesma transação.
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- Mantém `subscriptions.updated_at` honesto sem depender da aplicação.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();
