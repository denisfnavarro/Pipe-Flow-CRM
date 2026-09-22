# PipeFlow CRM

CRM SaaS multi-empresa para PMEs, freelancers e times de vendas: pipeline Kanban, gestão de
leads, timeline de atividades e planos de assinatura.

- **O quê:** [docs/PRD.md](docs/PRD.md)
- **Como:** [CLAUDE.md](CLAUDE.md)
- **Em que ordem:** [docs/ROADMAP.md](docs/ROADMAP.md)

## Estado

Fases 1 e 2 do roadmap concluídas (M0 → M5): toda a superfície de interface está construída e
navegável contra a camada de dados falsa em `lib/mock/`. A Fase 3 (Supabase, auth, Stripe,
Resend) troca a implementação dessas funções por `lib/data/` sem reescrever componente.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # ainda não é necessário preencher nada nas fases 1 e 2
npm run dev
```

A aplicação sobe em <http://localhost:3000>.

| Script              | O que faz                                  |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | servidor de desenvolvimento                |
| `npm run build`     | build de produção                          |
| `npm run lint`      | ESLint (gate de milestone)                 |
| `npm run typecheck` | `tsc --noEmit` (gate de milestone)         |
| `npm run format`    | Prettier com ordenação de classes Tailwind |

## Variáveis de ambiente

Todas as chaves previstas estão em [.env.example](.env.example), sem valores. Segredos vivem
apenas em `.env.local` e nas env vars da Vercel — nunca no repositório.

| Variável                                                                                                  | Quando passa a ser necessária       |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                               | M6 — schema e RLS                   |
| `SUPABASE_SERVICE_ROLE_KEY`                                                                               | M11 — apenas em rotinas server-only |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID_PRO` | M11 — monetização                   |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`                                                                     | M10 — convites por e-mail           |
| `NEXT_PUBLIC_APP_URL`                                                                                     | M12 — URLs absolutas em produção    |

## A camada de dados

`types/domain.ts` define o contrato; `lib/mock/` o implementa em memória com um seed
determinístico (30 leads, 20 negócios, 60 atividades). Todo componente de tela é um Server
Component `async` que consome essas funções:

```ts
listLeads(filters): Promise<Paginated<LeadWithRelations>>
getLead(id): Promise<LeadDetail | null>
moveDeal(dealId, stage, position): Promise<void>
```

Na Fase 3, `lib/data/` assume as mesmas assinaturas contra o Postgres e `lib/mock/` é removido.
