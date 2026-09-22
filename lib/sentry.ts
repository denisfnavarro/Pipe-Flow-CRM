/**
 * Configuração compartilhada do Sentry.
 *
 * Sem `NEXT_PUBLIC_SENTRY_DSN` o SDK não é inicializado: o projeto roda igual
 * em desenvolvimento e em qualquer ambiente onde o monitoramento não tenha sido
 * provisionado, sem erro e sem tráfego de rede inútil.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const SENTRY_ENABLED = Boolean(SENTRY_DSN);

export const sentryBaseOptions = {
  dsn: SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // Amostragem baixa por padrão: rastreamento completo estoura a cota grátis
  // rápido e não acrescenta nada num produto deste tamanho.
  tracesSampleRate: 0.1,
  // Erro em produção interessa; ruído de desenvolvimento, não.
  enabled: Boolean(SENTRY_DSN),
};
