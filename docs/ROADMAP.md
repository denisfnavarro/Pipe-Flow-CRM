# Plano de Execução — PipeFlow CRM

Roadmap de milestones do setup ao deploy. Base: [PRD.md](PRD.md) (o quê) e
[../CLAUDE.md](../CLAUDE.md) (como).

## Estratégia

**Interface primeiro, backend depois.** As telas foram construídas contra uma camada de dados
falsa (`lib/mock/`) que expunha exatamente a mesma assinatura das funções reais. Assim o
produto inteiro ficou navegável e validável antes de existir um único `select` no Postgres —
e a troca de mock para Supabase foi substituição de implementação, não reescrita de
componente.

> Concluído nas milestones M8 e M9: `lib/mock/` não existe mais e `lib/data/` ocupou o
> contrato. O gerador dos dados sobreviveu em `scripts/seed-data.ts`, que é o que mantém o
> banco idêntico ao que as telas mostravam na Fase 2.

O contrato dessa camada é definido na Milestone 1 e respeitado por todas as telas:

```ts
// lib/mock/leads.ts  →  depois  lib/data/leads.ts
export async function listLeads(filters: LeadFilters): Promise<Lead[]>;
export async function getLead(id: string): Promise<LeadWithActivities | null>;
```

Todo componente de tela é `async` Server Component que chama essas funções. Na fase de
backend, só o corpo delas muda.

## Convenções de trabalho

- Uma branch por milestone, criada a partir de `main`: `git switch -c <branch>`.
- Commits pequenos durante a milestone; o **commit final** listado em cada bloco é o que
  fecha a entrega e vai para o PR.
- Padrão Conventional Commits. Commits feitos pelo Claude Code terminam com a linha
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Gate para fechar qualquer milestone: `npm run lint` e `npx tsc --noEmit` limpos, mais a
  verificação manual descrita no bloco.
- Merge via PR em `main` (squash), branch deletada depois.

---

# FASE 1 — Fundação

## M0 — Setup do projeto

**Branch:** `chore/setup`
**Objetivo:** repositório e toolchain prontos, app rodando em branco sem erro de lint ou tipo.

- [x] `git init`, `.gitignore` (Next.js + `.env*.local`), commit inicial em `main`
- [x] `create-next-app`: App Router, TypeScript, Tailwind, ESLint, alias `@/*`
- [x] `tsconfig.json` em `strict: true`
- [x] Prettier + `prettier-plugin-tailwindcss`, scripts `lint`, `format`, `typecheck`
- [x] `npx shadcn@latest init`
- [x] Estrutura de pastas vazia conforme CLAUDE.md (`app/`, `components/`, `lib/`, `types/`)
- [x] `.env.example` com todas as chaves previstas (Supabase, Stripe, Resend) sem valores
- [x] GitHub Action de CI: `lint` + `typecheck` em push e PR _(workflow criado; roda no primeiro push)_
- [x] Repositório criado no GitHub e `main` publicada

**Verificar:** `npm run dev` sobe em `localhost:3000`; CI verde no primeiro push.
**Commit final:** `chore: bootstrap next.js 14 + typescript + tailwind + shadcn`

---

## M1 — Design system e shell da aplicação

**Branch:** `feat/design-system`
**Objetivo:** tokens visuais, componentes base e o layout autenticado navegável (sem dados
reais e sem login).

- [x] Tokens de cor em `globals.css` (`:root` + `.dark`) conforme a seção Identidade visual
      do CLAUDE.md; `tailwind.config.ts` mapeando os tokens
- [x] Fontes Inter e Geist Mono via `next/font`
- [x] Componentes shadcn instalados: button, input, select, dialog, dropdown-menu, table,
      card, badge, avatar, tabs, toast, skeleton, form
- [x] Toggle de dark mode (`next-themes`) no header
- [x] `components/shared/`: `page-header`, `empty-state`, `stage-badge`, `money` (formatador BRL)
- [x] Layout `app/(app)/layout.tsx`: sidebar com navegação, workspace switcher (estático),
      menu de usuário
- [x] Rotas placeholder: dashboard, leads, pipeline, calendar, reports, settings
- [x] Responsivo: sidebar vira drawer abaixo de `md`
- [x] **Contrato da camada de dados** definido em `lib/mock/` + tipos em `types/domain.ts`,
      com seed de ~30 leads, ~20 deals e ~60 atividades

**Verificar:** navegar por todas as rotas nos dois temas, em desktop e mobile, sem quebra.
**Commit final:** `feat: design tokens, ui primitives e shell autenticado`

---

# FASE 2 — Interface (dados mockados)

## M2 — Landing page

**Branch:** `feat/landing-page`
**Objetivo:** página pública de apresentação, pronta para produção.

- [x] `app/(marketing)/page.tsx` com hero (headline, subheadline, CTA, screenshot do produto)
- [x] Seção de funcionalidades (pipeline, leads, atividades, dashboard, multi-empresa)
- [x] Seção de planos: Free (2 colaboradores, 50 leads) e Pro (R$ 49/mês, ilimitado)
- [x] CTA final + footer
- [x] Header público com links e botões Entrar / Criar conta
- [x] SEO: metadata, Open Graph, `favicon`, `sitemap.ts`, `robots.ts`
- [x] Responsivo e acessível (contraste, foco visível, hierarquia de headings)

**Verificar:** Lighthouse ≥ 90 em performance e acessibilidade.
**Commit final:** `feat: landing page com hero, features, pricing e cta`

---

## M3 — Telas de leads

**Branch:** `feat/leads-ui`
**Objetivo:** listagem e detalhe de leads completos, lendo de `lib/mock/`.

- [x] Tabela de leads: nome, empresa, cargo, e-mail, telefone, status, responsável
- [x] Busca por texto e filtros por status, responsável e período (estado na URL via
      `searchParams`)
- [x] Paginação e ordenação por coluna
- [x] Dialog de criar/editar lead com React Hook Form + Zod
- [x] Confirmação de exclusão
- [x] Página de detalhe `leads/[id]`: cartão de perfil, negócios vinculados, timeline de
      atividades com ícone por tipo (ligação, e-mail, reunião, nota)
- [x] Composer de atividade na timeline
- [x] Estados de loading (skeleton), vazio e erro

**Verificar:** filtrar, criar, editar e excluir no mock; recarregar a página mantém os filtros.
**Commit final:** `feat: listagem, filtros e página de detalhe de leads`

---

## M4 — Pipeline Kanban

**Branch:** `feat/pipeline-ui`
**Objetivo:** quadro Kanban com drag-and-drop funcionando contra o mock.

- [x] Seis colunas na ordem do PRD, com cor e contador por etapa
- [x] Card de negócio: título, valor em BRL, lead vinculado, responsável (avatar), prazo
- [x] Destaque de prazo: âmbar para próximo, vermelho para vencido
- [x] Drag-and-drop com `@dnd-kit` entre colunas e reordenação dentro da coluna
- [x] Atualização otimista + rollback em caso de falha
- [x] Soma de valores no cabeçalho de cada coluna
- [x] Dialog de criar/editar negócio (título, valor, lead, responsável, prazo, etapa)
- [x] Acessibilidade do DnD: mover card por teclado
- [x] Scroll horizontal em telas estreitas

**Verificar:** arrastar entre todas as etapas, inclusive Ganho e Perdido; totais atualizam.
**Commit final:** `feat: pipeline kanban com drag-and-drop e cards de negócio`

---

## M5 — Dashboard e telas de gestão

**Branch:** `feat/dashboard-ui`
**Objetivo:** fechar a superfície de UI — métricas, configurações e billing.

- [x] Quatro cards: total de leads, negócios abertos, valor total do pipeline, taxa de conversão
- [x] Gráfico de funil em Recharts, usando as cores de etapa
- [x] Lista "meus negócios com prazo próximo"
- [x] `settings/workspace`: nome do workspace, renomear, excluir
- [x] `settings/members`: tabela de membros, papel, convidar por e-mail, remover
- [x] `settings/billing`: plano atual, uso vs. limites, CTA de upgrade
- [x] Onboarding: tela de criação do primeiro workspace + checklist inicial
- [x] Páginas de erro e `not-found`

**Verificar:** todas as rotas do CLAUDE.md navegáveis com conteúdo real de UI.
**Commit final:** `feat: dashboard de métricas, settings e onboarding`

---

# FASE 3 — Backend

## M6 — Banco de dados e RLS

**Branch:** `feat/database-schema`
**Objetivo:** schema completo no Supabase com isolamento por workspace comprovado.

- [x] Projeto Supabase criado; Supabase CLI e ambiente local
- [x] Migration com as tabelas do CLAUDE.md: `workspaces`, `workspace_members`, `invites`,
      `leads`, `deals`, `activities`, `subscriptions`
- [x] Enums `deal_stage`, `activity_type`, `member_role`, `plan`
- [x] Índices em `workspace_id`, `deals(stage, position)`, `leads(created_at)`
- [x] RLS habilitado em todas as tabelas + policies de pertencimento por `workspace_member`
- [x] Policies de escrita distinguindo `admin` de `member`
- [x] Função/trigger de criação de workspace com o criador como admin
- [x] Seed script com os mesmos dados do mock
- [x] `types/database.types.ts` gerado
- [x] Teste manual de isolamento: usuário A não enxerga dado do workspace de B

**Verificar:** rodar as queries de dois usuários distintos e conferir o isolamento.
**Commit final:** `feat: schema postgres, enums e policies rls por workspace`

---

## M7 — Autenticação e workspaces

**Branch:** `feat/auth`
**Objetivo:** sessão real, rotas protegidas e troca de workspace funcionando.

- [x] Clientes Supabase: `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- [x] Telas de signup, login, esqueci a senha e `auth/callback`
- [x] Middleware protegendo `(app)/` e redirecionando visitante para o login
- [x] Criação do primeiro workspace no onboarding (ligar a tela da M5)
- [x] Workspace switcher ligado a dados reais, workspace ativo em cookie
- [x] Menu de usuário com logout
- [x] Helper `requireSession()` / `requireWorkspace()` usado por toda Server Action

**Verificar:** signup → onboarding → dashboard; logout derruba a sessão; rota protegida
redireciona.
**Commit final:** `feat: autenticação supabase, rotas protegidas e workspace ativo`

---

## M8 — Leads e atividades reais

**Branch:** `feat/leads-backend`
**Objetivo:** substituir o mock de leads e atividades por Supabase, sem tocar nas telas.

- [x] `lib/data/leads.ts` e `lib/data/activities.ts` com a assinatura do contrato da M1
- [x] Server Actions de criar, editar e excluir lead, validadas com Zod
- [x] Busca e filtros executados no Postgres (`ilike`, filtros, paginação por range)
- [x] Server Action de registrar atividade, com autor vindo da sessão
- [x] `revalidatePath` nas mutações; toasts de sucesso e erro
- [x] Remover `lib/mock/leads.ts` e `activities.ts`

**Verificar:** CRUD completo persistindo; recarregar a página mantém os dados.
**Commit final:** `feat: persistência de leads e atividades no supabase`

---

## M9 — Pipeline real

**Branch:** `feat/pipeline-backend`
**Objetivo:** negócios persistidos, com a ordem do Kanban estável.

- [x] `lib/data/deals.ts` conforme o contrato
- [x] Server Actions de criar, editar e excluir negócio
- [x] Action `moveDeal(dealId, stage, position)` reordenando em transação
- [x] Otimismo da M4 ligado à action real, com rollback no erro
- [x] Agregados de dashboard calculados no banco (contagens, soma, taxa de conversão)
- [x] Remover `lib/mock/deals.ts`

**Verificar:** arrastar um card, recarregar: etapa e posição preservadas. Dois usuários no
mesmo workspace veem a mesma ordem.
**Commit final:** `feat: persistência de negócios e reordenação do pipeline`

---

## M10 — Colaboração e convites

**Branch:** `feat/invites`
**Objetivo:** time real dentro do workspace, com permissões aplicadas.

- [x] Integração Resend + template de convite
- [x] Server Action de convidar: cria `invite` com token e expiração, dispara e-mail
- [x] Rota de aceite `invite/[token]`: valida, expira, cria `workspace_member`
- [x] Reenviar e revogar convite
- [x] Papéis aplicados na UI (membro não vê billing nem gestão de membros) **e** nas policies
- [x] Remover membro; impedir remoção do último admin

**Verificar:** convidar um segundo e-mail, aceitar em sessão anônima, confirmar o papel
aplicado nos dois lados.
**Commit final:** `feat: convites por e-mail via resend e papéis admin/membro`

---

## M11 — Monetização

**Branch:** `feat/stripe-billing`
**Objetivo:** upgrade e downgrade automáticos, limites do Free aplicados.

- [x] Produto e preço no Stripe (R$ 49/mês); `lib/stripe/plans.ts`
- [x] Server Action criando sessão de Stripe Checkout
- [x] Webhook em `app/api/stripe/webhook/route.ts` (raw body, verificação de assinatura,
      idempotência) tratando `checkout.session.completed`,
      `customer.subscription.updated` e `deleted`
- [x] Sincronizar `subscriptions` e `workspaces.plan`
- [x] Customer Portal para gerenciar assinatura
- [x] Enforcement do Free: 2 colaboradores e 50 leads — checado no servidor, nunca só na UI
- [x] Paywall na UI com CTA de upgrade ao atingir o limite
- [x] Testado com `stripe listen` e cartões de teste

**Verificar:** assinar no modo teste → plano vira Pro e limites somem; cancelar no portal →
volta para Free.
**Commit final:** `feat: stripe checkout, webhook e limites do plano free`

---

# FASE 4 — Entrega

## M12 — Deploy em produção

**Branch:** `chore/deploy`
**Objetivo:** aplicação no ar, monitorada e com domínio configurado.

- [ ] Projeto na Vercel ligado ao GitHub; preview deploy por PR
- [ ] Env vars de produção na Vercel e no Supabase (URLs de redirect do Auth)
- [ ] Migrations aplicadas no Supabase de produção
- [ ] Endpoint do webhook Stripe apontado para produção, em modo live
- [ ] Domínio de envio verificado no Resend (SPF/DKIM)
- [ ] Domínio customizado + HTTPS
- [ ] Analytics e monitoramento de erro (Vercel Analytics + Sentry)
- [ ] Smoke test em produção: signup → workspace → lead → deal → upgrade
- [ ] `README.md` com setup local e variáveis de ambiente

**Verificar:** o fluxo completo funcionando no domínio público, com e-mail de convite
chegando e checkout real em modo teste.
**Commit final:** `chore: deploy de produção na vercel com supabase e stripe`

---

## Pós-MVP

Fora do caminho crítico até o deploy; cada um vira sua própria branch quando priorizado.

- `feat/calendar` — calendário de prazos e reuniões
- `feat/reports` — relatórios e exportação CSV/XLSX
- `feat/public-api` — API pública com chaves por workspace e rate limit
- `feat/notifications` — e-mails de resumo e alertas de prazo
