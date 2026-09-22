-- Busca de leads sem sensibilidade a acento.
--
-- O mock normalizava o texto em JavaScript, então procurar "logistica" achava
-- "Vetor Logística". Um `ilike` cru no Postgres não faz isso, e perder esse
-- comportamento seria uma regressão de verdade para dados em português.
--
-- A solução é uma coluna gerada com o texto já normalizado. Como o `unaccent`
-- do Postgres não é immutable, uma coluna gerada não pode chamá-lo direto — daí
-- o wrapper, que fixa o dicionário e, com isso, passa a ser determinístico.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = extensions, public, pg_temp
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, input);
$$;

alter table public.leads
  add column search_text text
  generated always as (
    lower(
      public.immutable_unaccent(
        coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, '')
      )
    )
  ) stored;

-- Trigram: o padrão da busca é `%termo%`, que um índice btree não atenderia.
create index leads_search_trgm_idx
  on public.leads using gin (search_text extensions.gin_trgm_ops);
