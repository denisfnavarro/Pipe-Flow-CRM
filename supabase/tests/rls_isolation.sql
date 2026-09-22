-- Teste de isolamento por workspace.
--
-- Não depende de login: assume a identidade de cada usuário trocando as claims
-- do JWT que o RLS lê via `auth.uid()`. É assim que dá para provar o isolamento
-- sem envolver o serviço de Auth.
--
-- O caminho preferido é `npm run test:rls`, que exercita o mesmo RLS pela API
-- que o navegador usa. Este arquivo é a versão em SQL puro, para rodar no SQL
-- Editor do dashboard quando não houver Node à mão.
--
-- Pré-requisito: `npm run seed` já rodou. Ele cria a Acme (dono: denis) e a
-- Nimbus Tech (dono: bruno, que não participa da Acme).

begin;

do $$
declare
  alice uuid;
  bruno uuid;
  acme uuid;
  nimbus uuid;
  visiveis integer;
  total integer;
begin
  select owner_id, id into alice, acme
    from public.workspaces where slug = 'acme-consultoria';
  select owner_id, id into bruno, nimbus
    from public.workspaces where slug = 'nimbus-tech';

  if alice is null or bruno is null then
    raise exception 'Seed ausente: rode o seed antes do teste de isolamento';
  end if;

  if alice = bruno then
    raise exception 'Os dois workspaces têm o mesmo dono; o teste não prova nada';
  end if;

  select count(*) into total from public.leads where workspace_id = acme;

  -- ---- Alice, dona da Acme, enxerga os leads da Acme ----------------------
  set local role authenticated;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', alice, 'role', 'authenticated')::text,
    true
  );

  select count(*) into visiveis from public.leads;
  if visiveis <> total then
    raise exception 'Alice deveria ver % leads da Acme, viu %', total, visiveis;
  end if;
  raise notice 'OK: Alice vê os % leads da Acme', visiveis;

  -- ---- Bruno, de outro workspace, não enxerga nada da Acme ---------------
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', bruno, 'role', 'authenticated')::text,
    true
  );

  select count(*) into visiveis from public.leads where workspace_id = acme;
  if visiveis <> 0 then
    raise exception 'VAZAMENTO: Bruno viu % leads da Acme', visiveis;
  end if;
  raise notice 'OK: Bruno não vê nenhum lead da Acme';

  select count(*) into visiveis from public.deals where workspace_id = acme;
  if visiveis <> 0 then
    raise exception 'VAZAMENTO: Bruno viu % negócios da Acme', visiveis;
  end if;

  select count(*) into visiveis from public.activities where workspace_id = acme;
  if visiveis <> 0 then
    raise exception 'VAZAMENTO: Bruno viu % atividades da Acme', visiveis;
  end if;

  select count(*) into visiveis from public.workspaces where id = acme;
  if visiveis <> 0 then
    raise exception 'VAZAMENTO: Bruno enxergou o workspace da Acme';
  end if;
  raise notice 'OK: negócios, atividades e o próprio workspace também ficam invisíveis';

  -- ---- Bruno não consegue escrever no workspace alheio --------------------
  begin
    insert into public.leads (workspace_id, name, owner_id, status)
    values (acme, 'Invasor', bruno, 'new');
    raise exception 'VAZAMENTO: Bruno inseriu um lead no workspace da Acme';
  exception
    when insufficient_privilege then
      raise notice 'OK: escrita de Bruno no workspace da Acme foi barrada pelo RLS';
  end;

  reset role;
  raise notice 'Isolamento por workspace: aprovado';
end $$;

-- Nada aqui deve sobreviver: é teste, não migration.
rollback;
