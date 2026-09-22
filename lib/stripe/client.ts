import "server-only";

import Stripe from "stripe";

/**
 * Cliente da Stripe. Preguiçoso pelo mesmo motivo do cliente da Resend: telas
 * que não tocam em cobrança não devem quebrar por falta de chave.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada");

  client ??= new Stripe(key, {
    // Fixar a versão evita que uma mudança na API da Stripe altere o
    // comportamento do webhook sem ninguém mexer no código.
    apiVersion: "2026-08-26.dahlia",
    typescript: true,
  });

  return client;
}
