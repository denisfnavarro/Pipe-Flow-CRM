import * as Sentry from "@sentry/nextjs";
import { SENTRY_ENABLED, sentryBaseOptions } from "@/lib/sentry";

if (SENTRY_ENABLED) {
  Sentry.init({
    ...sentryBaseOptions,
    // Session Replay desligado: grava interação do usuário com dados de CRM
    // na tela, e isso não entra sem uma decisão consciente de privacidade.
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
  });
}

/** Instrumenta as transições de rota no cliente. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
