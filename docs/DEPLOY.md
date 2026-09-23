# Deploy em produção

Registro do que foi provisionado fora do repositório e como verificar cada peça.
Concluído em 23/09/2026.

**Produção:** <https://pipe-flow-crm-jet.vercel.app>

> O domínio de produção é o que aparece em **Domains** no painel da Vercel, com o ícone de
> globo. O endereço que aparece em **Deployment** (`pipe-flow-<hash>-…`) identifica um build
> específico, muda a cada push e fica atrás da Deployment Protection — não serve para
> configurar webhook nem redirect de Auth.

## 1. Supabase

- [x] Projeto `pipeflow-crm` (ref `oxowfguhdhcfdzewzqla`) — o mesmo de desenvolvimento
- [x] Migrations aplicadas (9 arquivos em `supabase/migrations/`)
- [x] SMTP próprio: Resend, em Authentication → Emails → SMTP Settings
- [x] **Confirm email ligado** em Authentication → Sign In / Providers → Email
- [x] URL Configuration com o domínio de produção e `localhost:3000` para desenvolvimento

> Desenvolvimento e produção dividem o mesmo projeto. Funciona e cabe no plano gratuito, mas
> qualquer teste mexe em dados reais. Separar é o próximo passo se isto deixar de ser um
> projeto de treinamento.

Conferir a confirmação de e-mail sem abrir o painel:

```bash
curl -s "https://<ref>.supabase.co/auth/v1/settings" -H "apikey: <anon>" | grep autoconfirm
```

`mailer_autoconfirm: false` significa **confirmação exigida** — o nome do campo é invertido.

## 2. Vercel

- [x] Repositório `denisfnavarro/Pipe-Flow-CRM` importado, deploy automático a partir da `main`
- [x] Onze variáveis de ambiente cadastradas (seção 5)
- [x] Deployment Protection ativa nos previews e inativa na produção

> `NEXT_PUBLIC_*` precisa ser do tipo **Config**, não **Secret**. Esses valores são compilados
> dentro do JavaScript do navegador por design; marcá-los como Secret os torna write-only e
> impede correções depois.

## 3. Domínio

- [x] `pipe-flow-crm-jet.vercel.app`, com HTTPS emitido pela Vercel
- [ ] Domínio customizado — não configurado

## 4. Stripe

- [x] Endpoint `https://pipe-flow-crm-jet.vercel.app/api/stripe/webhook`, em modo teste
- [x] Quatro eventos: `checkout.session.completed`, `customer.subscription.created`,
      `customer.subscription.updated`, `customer.subscription.deleted`
- [x] `STRIPE_WEBHOOK_SECRET` cadastrado na Vercel
- [ ] Modo **live** — não configurado; o projeto opera em sandbox

> O endpoint foi criado com a versão de API padrão da conta (`2023-10-16`), mais antiga que a
> fixada no SDK. Até 2024 `current_period_start` e `current_period_end` viviam na assinatura;
> depois passaram para cada item. O webhook lê dos dois lugares — sem isso a data de renovação
> ficaria nula em silêncio.

Conferir que o segredo está em vigor:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://pipe-flow-crm-jet.vercel.app/api/stripe/webhook -d '{}'
```

`400` é o esperado: a verificação de assinatura rodou e recusou. `500` significa que a
variável não chegou — falta o redeploy.

## 5. Variáveis de ambiente na Vercel

| Variável                             | Tipo   | Onde obter                                                |
| ------------------------------------ | ------ | --------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                | Config | o domínio de produção, com `https://` e sem barra final   |
| `NEXT_PUBLIC_SUPABASE_URL`           | Config | Supabase → Settings → API                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Config | idem, chave publishable                                   |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Config | Stripe → Developers → API keys                            |
| `STRIPE_PRICE_ID_PRO`                | Config | o `price_` do plano Pro, não o `prod_`                    |
| `SUPABASE_SERVICE_ROLE_KEY`          | Secret | Supabase → Settings → API → Secret keys                   |
| `STRIPE_SECRET_KEY`                  | Secret | Stripe → Developers → API keys                            |
| `STRIPE_WEBHOOK_SECRET`              | Secret | tela do endpoint → Signing secret → Reveal                |
| `RESEND_API_KEY`                     | Secret | <https://resend.com/api-keys>                             |
| `RESEND_FROM_EMAIL`                  | Config | `PipeFlow <convites@dominio>`                             |
| `SEED_PASSWORD`                      | Secret | gerada localmente; sincroniza os usuários de demonstração |

Variável nova só entra em vigor no build seguinte: depois de cadastrar, **Deployments → ⋯ →
Redeploy**.

## 6. Smoke test em produção

Verificado em 23/09/2026, contra <https://pipe-flow-crm-jet.vercel.app>:

- [x] Rotas públicas respondem 200; protegidas redirecionam para o login
- [x] Login com sessão real abre dashboard, leads, pipeline e settings
- [x] Membro sem papel de admin é barrado em `/settings/members` e `/settings/billing`
- [x] Usuário de outro workspace não enxerga nenhum lead da Acme
- [x] Assinatura criada na Stripe → webhook → plano vira `pro`, com data de renovação
- [x] Cancelamento → webhook → plano volta para `free`
- [x] Eventos gravados em `stripe_events` sem duplicar
- [ ] **Cadastro com e-mail real e clique no link de confirmação** — depende de caixa de
      entrada, não verificável por automação
- [ ] **Convite aceito em sessão anônima, com duas caixas reais** — idem

## 7. O que ficou fora

- Domínio customizado
- Stripe em modo live
- Sentry: o código está instrumentado, mas sem `NEXT_PUBLIC_SENTRY_DSN` o SDK não inicializa
- Lighthouse da landing page nunca foi medido; o SDK do Sentry levou o JavaScript inicial de
  95 kB para 154 kB, e a M2 tinha ≥ 90 como critério. Mover o Sentry para só o servidor é uma
  linha de mudança, se o número não fechar.
