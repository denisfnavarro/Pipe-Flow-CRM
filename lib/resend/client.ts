import "server-only";

import { Resend } from "resend";

/**
 * Cliente da Resend.
 *
 * Preguiçoso de propósito: o build e as telas que não mandam e-mail não devem
 * quebrar só porque a chave ainda não foi configurada num ambiente.
 */
let client: Resend | null = null;

export function resend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurada");

  client ??= new Resend(key);
  return client;
}

export function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "PipeFlow <onboarding@resend.dev>";
}
