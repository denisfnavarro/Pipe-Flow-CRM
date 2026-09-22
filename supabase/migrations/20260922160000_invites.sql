-- Aceite de convite e proteção do último admin.
--
-- Duas coisas que o RLS sozinho não resolve:
--
-- 1. Quem aceita um convite ainda não é membro, então nenhuma policy de
--    `workspace_members` o autorizaria a se inserir. A função abaixo roda como
--    definer e faz a validação que a policy faria — token existe, está
--    pendente, não expirou e é para o e-mail de quem está aceitando.
--
-- 2. "Não remover o último admin" é uma regra de integridade: se ficar só na
--    action, dois admins saindo ao mesmo tempo deixariam o workspace órfão.

create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    raise exception 'É preciso estar autenticado para aceitar um convite'
      using errcode = '42501';
  end if;

  select * into v_invite
    from public.invites
   where token = p_token
   for update;

  if not found then
    raise exception 'Convite não encontrado' using errcode = 'P0002';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Este convite já foi usado ou revogado' using errcode = 'P0002';
  end if;

  if v_invite.expires_at < now() then
    update public.invites set status = 'expired' where id = v_invite.id;
    raise exception 'Este convite expirou' using errcode = 'P0002';
  end if;

  -- O convite é nominal: aceitar com outra conta seria contornar o controle
  -- de quem o admin quis deixar entrar.
  if lower(v_invite.email) <> lower(v_email) then
    raise exception 'Este convite foi enviado para outro e-mail' using errcode = '42501';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, auth.uid(), v_invite.role)
  on conflict (workspace_id, user_id) do nothing;

  update public.invites
     set status = 'accepted'
   where id = v_invite.id;

  return v_invite.workspace_id;
end;
$$;

revoke execute on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

-- Lê um convite pelo token, sem exigir participação no workspace: a tela de
-- aceite precisa mostrar para onde a pessoa está sendo convidada antes de ela
-- decidir. Devolve só o que a tela usa, nunca a lista de convites.
create or replace function public.invite_preview(p_token text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'email', i.email,
    'role', i.role,
    'status', case when i.expires_at < now() and i.status = 'pending' then 'expired' else i.status end,
    'workspaceName', w.name,
    'invitedBy', coalesce(p.full_name, p.email)
  )
  from public.invites i
  join public.workspaces w on w.id = i.workspace_id
  left join public.profiles p on p.id = i.invited_by
  where i.token = p_token;
$$;

revoke execute on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to authenticated, anon;

-- Impede que o workspace fique sem nenhum admin.
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
as $$
declare
  v_remaining integer;
begin
  if old.role <> 'admin' then
    return coalesce(new, old);
  end if;

  -- Só interessa quando o admin está saindo: por remoção ou por rebaixamento.
  if tg_op = 'UPDATE' and new.role = 'admin' then
    return new;
  end if;

  select count(*) into v_remaining
    from public.workspace_members
   where workspace_id = old.workspace_id
     and role = 'admin'
     and id <> old.id;

  if v_remaining = 0 then
    raise exception 'O workspace precisa de pelo menos um administrador'
      using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger workspace_members_protect_last_admin
  before update or delete on public.workspace_members
  for each row execute function public.protect_last_admin();
