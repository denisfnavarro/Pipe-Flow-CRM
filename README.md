# PipeFlow CRM

CRM SaaS multi-empresa para PMEs, freelancers e times de vendas: pipeline Kanban, gestão de
leads, timeline de atividades e planos de assinatura.

- **O quê:** [docs/PRD.md](docs/PRD.md)
- **Como:** [CLAUDE.md](CLAUDE.md)
- **Em que ordem:** [docs/ROADMAP.md](docs/ROADMAP.md)
- **Deploy:** [docs/DEPLOY.md](docs/DEPLOY.md)

## Stack

Next.js 14 (App Router) · React 18 · TypeScript strict · Tailwind + shadcn/ui ·
Supabase (Postgres + RLS + Auth) · Stripe · Resend · @dnd-kit · Recharts

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves do Supabase
npm run dev
```

Sobe em <http://localhost:3000>. A porta é fixa de propósito: sem `-p`, o Next migra em
silêncio para 3001 quando a 3000 está ocupada, e aí as URLs de redirect do Supabase deixam
de bater.

| Script              | O que faz                                   |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | servidor de desenvolvimento na porta 3000   |
| `npm run build`     | build de produção                           |
| `npm run lint`      | ESLint (gate de milestone)                  |
| `npm run typecheck` | `tsc --noEmit` (gate de milestone)          |
| `npm run format`    | Prettier com ordenação de classes Tailwind  |
| `npm run seed`      | popula o banco com os dados de demonstração |
| `npm run test:rls`  | prova o isolamento entre workspaces         |

> Não rode `npm run build` com o `npm run dev` no ar: os dois disputam a pasta `.next` e o
> dev server passa a servir referências para arquivos que o build apagou. O sintoma é a
> página carregar sem JavaScript nenhum.

## Arquitetura

### A camada de dados

`types/domain.ts` define o contrato e `lib/data/` o implementa contra o Postgres. Todo
componente de tela é um Server Component `async` que consome essas funções:

```ts
listLeads(filters): Promise<Paginated<LeadWithRelations>>
getLead(id): Promise<LeadDetail | null>
moveDeal(dealId, stage, position): Promise<void>
```

O produto foi construído interface-primeiro: as telas nasceram contra `lib/mock/`, que expunha
essa mesma assinatura. A troca para o Supabase substituiu o corpo das funções sem reescrever
um componente. O gerador dos dados de demonstração sobreviveu em
[scripts/seed-data.ts](scripts/seed-data.ts) e é o que mantém o banco idêntico ao que as
telas mostravam antes do backend existir.

### Onde ficam as regras

| Regra                     | Onde é imposta             | Por quê                                                                 |
| ------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| Isolamento por workspace  | policies de RLS            | filtro no cliente é UX, não controle de acesso                          |
| Limites do plano Free     | triggers no Postgres       | vale para qualquer caminho de escrita, inclusive a API pública prevista |
| Último admin do workspace | trigger                    | dois admins saindo juntos deixariam o workspace órfão                   |
| Ordem do Kanban           | função `move_deal`         | origem e destino renumerados na mesma transação                         |
| Autoria de atividade      | policy `activities_insert` | o autor vem da sessão, nunca do corpo da requisição                     |

`npm run test:rls` exercita o isolamento pela API, com o JWT de cada usuário — o mesmo
caminho que o navegador percorre.

### A service_role

Ignora RLS por completo. Aparece em exatamente dois lugares: o webhook do Stripe, que chega
sem sessão de usuário, e o script de seed. Nunca é importada por um componente.

## Variáveis de ambiente

Todas em [.env.example](.env.example), sem valores. Segredos vivem apenas em `.env.local` e
nas env vars da Vercel — nunca no repositório.

| Variável                                                                         | Necessária para                    |
| -------------------------------------------------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                      | tudo                               |
| `SUPABASE_SERVICE_ROLE_KEY`                                                      | webhook do Stripe e `npm run seed` |
| `SEED_PASSWORD`                                                                  | senha dos usuários de demonstração |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID_PRO` | checkout                           |
| `STRIPE_WEBHOOK_SECRET`                                                          | webhook                            |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`                                            | convites por e-mail                |
| `NEXT_PUBLIC_SENTRY_DSN`                                                         | monitoramento de erro (opcional)   |

## Banco de dados

Migrations versionadas em [supabase/migrations/](supabase/migrations/). Para aplicar:

```bash
npx supabase db push --db-url "postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres"
npx supabase gen types typescript --project-id <ref> > types/database.types.ts
```

Toda mudança de schema é uma migration nova mais a regeneração dos tipos — nunca uma alteração
manual pelo painel.
