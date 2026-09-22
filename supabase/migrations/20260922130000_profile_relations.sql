-- Reaponta as referências de usuário de `auth.users` para `public.profiles`.
--
-- Motivo: o PostgREST só embute uma tabela na outra quando existe chave
-- estrangeira direta entre as duas. Sem isso, `leads` não consegue trazer o
-- responsável junto e cada listagem viraria duas viagens ao banco mais um join
-- em JavaScript.
--
-- A integridade não afrouxa: `profiles.id` referencia `auth.users(id)` com
-- `on delete cascade`, então continua impossível apontar para um usuário que
-- não existe.

alter table public.leads
  drop constraint leads_owner_id_fkey,
  add constraint leads_owner_id_fkey
    foreign key (owner_id) references public.profiles (id) on delete restrict;

alter table public.deals
  drop constraint deals_owner_id_fkey,
  add constraint deals_owner_id_fkey
    foreign key (owner_id) references public.profiles (id) on delete restrict;

alter table public.activities
  drop constraint activities_author_id_fkey,
  add constraint activities_author_id_fkey
    foreign key (author_id) references public.profiles (id) on delete restrict;

alter table public.workspace_members
  drop constraint workspace_members_user_id_fkey,
  add constraint workspace_members_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade;
