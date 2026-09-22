# PipeFlow CRM

CRM SaaS multi-empresa para PMEs, freelancers e times de vendas: pipeline Kanban,
gestão de leads, timeline de atividades e planos de assinatura. Freemium, inspirado no
Pipedrive, mais simples que o HubSpot.

Escopo completo, personas e requisitos: [docs/PRD.md](docs/PRD.md). Este arquivo é o
briefing operacional — o PRD é a fonte de verdade sobre *o que* construir, o CLAUDE.md
sobre *como*.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, Tailwind CSS, shadcn/ui |
| Linguagem | TypeScript 5 (strict) |
| Banco + Auth | Supabase (PostgreSQL 15 + RLS + Auth) |
| Validação | Zod |
| Pagamento | Stripe (Checkout, Webhooks, Customer Portal) |
| E-mail | Resend |
| Drag-and-drop | @dnd-kit |
| Gráficos | Recharts |
| Deploy | Vercel (app) + Supabase (banco) |

## Estrutura de pastas

```
app/
  (marketing)/          landing page pública
  (auth)/               login, signup, callback
  (app)/                área autenticada (layout com sidebar + workspace switcher)
    dashboard/
    leads/              listagem e [id]/ detalhe
    pipeline/           Kanban
    calendar/
    reports/
    settings/           workspace, membros, billing
  api/
    stripe/webhook/     webhook Stripe (raw body, sem Server Action)
    invites/
components/
  ui/                   shadcn — gerado pelo CLI, não editar à mão
  leads/ pipeline/ dashboard/ shared/
lib/
  supabase/             client.ts (browser), server.ts (RSC/actions), middleware.ts
  stripe/               client.ts, plans.ts
  resend/               templates de e-mail
  validations/          schemas Zod por domínio
  utils.ts
types/
  database.types.ts     gerado: supabase gen types typescript
supabase/
  migrations/           SQL versionado — toda mudança de schema entra aqui
docs/
  PRD.md
  ROADMAP.md            milestones, branches e critérios de entrega
```

## Convenções

- **Server Components por padrão.** `"use client"` só onde há estado, efeito ou handler de
  evento — e o mais baixo possível na árvore.
- **Mutações via Server Actions.** API Routes apenas para webhooks e integrações externas
  (Stripe, API pública).
- **RLS é a fronteira de segurança.** Toda tabela filtra por `workspace_id` via policy no
  Postgres. Filtrar no cliente é conveniência de UX, nunca controle de acesso. Nunca usar a
  `service_role` key fora de webhooks/rotinas server-only.
- **Zod valida toda entrada** de Server Action e Route Handler antes de tocar o banco.
- Nomes: arquivos `kebab-case`, componentes `PascalCase`, hooks `use-*`, tabelas e colunas
  `snake_case`.
- Valores monetários em **centavos (integer)** no banco; formatar para BRL só na view.
- Toda mudança de schema é uma migration em `supabase/migrations/` + regenerar
  `types/database.types.ts`.
- Segredos só em `.env.local` e nas env vars da Vercel — nunca commitados, nunca em arquivo
  de config do repo.
- Antes de considerar um milestone pronto: `npm run lint` e `npx tsc --noEmit` limpos.

## Modelo de dados (resumo)

| Tabela | Notas |
|--------|-------|
| `workspaces` | nome, slug, owner, plano (`free` \| `pro`) |
| `workspace_members` | user_id, workspace_id, `role`: `admin` \| `member` |
| `invites` | e-mail, role, token, expiração, status |
| `leads` | nome, email, telefone, empresa, cargo, status, `owner_id` |
| `deals` | título, `value` (centavos), `stage`, `lead_id`, `owner_id`, `due_date`, `position` |
| `activities` | `type`: `call` \| `email` \| `meeting` \| `note`; autor, descrição, data, `lead_id` |
| `subscriptions` | stripe_customer_id, stripe_subscription_id, status, período |

`deals.stage` é um enum: `new_lead`, `contacted`, `proposal_sent`, `negotiation`, `won`, `lost`.

Todas as tabelas de domínio carregam `workspace_id` + policy RLS de pertencimento
(`exists (select 1 from workspace_members where ...)`).

## Identidade visual

Profissional e denso como o Pipedrive: informação primeiro, cromatismo contido, a cor
carrega significado (etapa do funil, ganho/perda) em vez de decorar.

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#4F46E5` (indigo 600) | ações, links, estado ativo |
| `--accent` | `#06B6D4` (cyan 500) | destaques, gráficos secundários |
| `--success` | `#16A34A` | Fechado Ganho, deltas positivos |
| `--danger` | `#DC2626` | Fechado Perdido, erros, prazos vencidos |
| `--warning` | `#F59E0B` | prazos próximos |
| neutros | escala `slate` (50 → 950) | superfícies, bordas, texto |

Cor por etapa do pipeline (borda superior do card / chip da coluna):

`Novo Lead` slate-400 · `Contato Realizado` cyan-500 · `Proposta Enviada` indigo-500 ·
`Negociação` amber-500 · `Fechado Ganho` green-600 · `Fechado Perdido` red-600

- **Tipografia:** Inter para UI; Geist Mono para valores monetários e IDs.
- **Raio:** `--radius: 0.5rem` (cards e inputs), botões `0.375rem`.
- **Densidade:** linhas de tabela compactas (40px), cards de deal com no máximo 4 linhas.
- **Dark mode desde o início** — todo token definido em `:root` e redefinido em `.dark`;
  nunca hardcodar cor hex em componente.

## Milestones

Plano completo — branch, entregas com checkbox, verificação e commit final de cada etapa:
[docs/ROADMAP.md](docs/ROADMAP.md).

**Interface primeiro, backend depois.** As telas são construídas contra `lib/mock/`, que
expõe a mesma assinatura das funções reais de `lib/data/`. Trocar mock por Supabase é
substituir a implementação, não reescrever componente. Todo componente de tela é um
Server Component `async` que consome esse contrato.

| Fase | Milestones |
|------|-----------|
| Fundação | M0 setup · M1 design system e shell |
| Interface | M2 landing · M3 leads · M4 pipeline · M5 dashboard e settings |
| Backend | M6 schema + RLS · M7 auth · M8 leads · M9 pipeline · M10 convites · M11 Stripe |
| Entrega | M12 deploy |

Uma branch por milestone a partir de `main`, merge por PR com squash. Gate para fechar:
`npm run lint` e `npx tsc --noEmit` limpos + a verificação manual do bloco no roadmap.
