# Deploy em produção

Passo a passo do que precisa existir fora do repositório para a aplicação ir ao ar, e em que
ordem. O que já está feito está marcado.

## 1. Supabase de produção

- [ ] Projeto criado (ou decisão consciente de reusar o de desenvolvimento)
- [ ] Migrations aplicadas:
      `npx supabase db push --db-url "postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres"`
- [x] SMTP próprio configurado — Resend, em Authentication → Emails → SMTP Settings
- [ ] **Confirm email ligado** em Authentication → Sign In / Providers → Email
- [ ] URL Configuration apontando para o domínio de produção: - Site URL: `https://<dominio>` - Redirect URLs: `https://<dominio>/**`

> Reusar o projeto de desenvolvimento em produção funciona e cabe no plano gratuito, mas
> qualquer teste passa a mexer em dados reais.

## 2. Vercel

- [ ] Repositório `denisfnavarro/Pipe-Flow-CRM` importado em <https://vercel.com/new>
      (o framework é detectado sozinho; não há configuração de build a fazer)
- [ ] Variáveis de ambiente cadastradas — a lista está na seção 5
- [ ] Deployment Protection ligada nos previews, se o repositório for público

## 3. Domínio

- [ ] Domínio adicionado em Settings → Domains na Vercel
- [ ] DNS apontado conforme a instrução que a Vercel mostrar
- [ ] HTTPS confirmado (a Vercel emite o certificado sozinha)
- [ ] `NEXT_PUBLIC_APP_URL` atualizada para o domínio final

## 4. Stripe

- [ ] Endpoint de webhook criado em <https://dashboard.stripe.com/webhooks>
      apontando para `https://<dominio>/api/stripe/webhook`
- [ ] Eventos assinados: `checkout.session.completed`, `customer.subscription.created`,
      `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] `STRIPE_WEBHOOK_SECRET` do endpoint copiado para a Vercel
- [ ] Produto e preço recriados em modo **live**, e `STRIPE_PRICE_ID_PRO` atualizado

> As chaves de teste (`sk_test_`, `pk_test_`) e as de produção (`sk_live_`, `pk_live_`) são
> independentes, assim como os produtos. O `price_` de teste não existe em live.

## 5. Variáveis de ambiente na Vercel

| Variável                                            | Onde obter                                         |
| --------------------------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                               | o domínio final, com `https://`                    |
| `NEXT_PUBLIC_SUPABASE_URL`                          | Supabase → Settings → API                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                     | idem, chave publishable                            |
| `SUPABASE_SERVICE_ROLE_KEY`                         | idem, aba Secret keys                              |
| `STRIPE_SECRET_KEY`                                 | Stripe → Developers → API keys                     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                | idem                                               |
| `STRIPE_PRICE_ID_PRO`                               | o `price_` do plano Pro                            |
| `STRIPE_WEBHOOK_SECRET`                             | do endpoint criado no passo 4                      |
| `RESEND_API_KEY`                                    | <https://resend.com/api-keys>                      |
| `RESEND_FROM_EMAIL`                                 | `PipeFlow <convites@seudominio>`                   |
| `NEXT_PUBLIC_SENTRY_DSN`                            | opcional — Sentry → Project Settings → Client Keys |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | opcional, só para subir source maps                |

## 6. Smoke test em produção

Na ordem, no domínio público:

- [ ] Criar conta e receber o e-mail de confirmação
- [ ] Confirmar e cair no onboarding
- [ ] Criar o primeiro workspace
- [ ] Cadastrar um lead e registrar uma atividade
- [ ] Criar um negócio e arrastar entre etapas; recarregar e conferir que a ordem persistiu
- [ ] Convidar um segundo e-mail e aceitar o convite numa janela anônima
- [ ] Fazer upgrade com um cartão de teste e conferir que o plano virou Pro
- [ ] Cancelar pelo Customer Portal e conferir que voltou para Free

## 7. Depois do deploy

- [ ] Rodar `npm run seed` contra produção? **Não.** Os dados de demonstração são para
      desenvolvimento.
- [ ] Conferir o primeiro deploy no painel da Vercel e as métricas em Analytics
