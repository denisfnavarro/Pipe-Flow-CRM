import type { Plan } from "@/types/domain";

export interface PlanDefinition {
  label: string;
  /** Centavos por mês. */
  priceCents: number;
  /** `null` = ilimitado. */
  seats: number | null;
  leads: number | null;
  features: string[];
}

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    label: "Free",
    priceCents: 0,
    seats: 2,
    leads: 50,
    features: ["Até 2 colaboradores", "Até 50 leads", "Pipeline Kanban completo"],
  },
  pro: {
    label: "Pro",
    priceCents: 4900,
    seats: null,
    leads: null,
    features: [
      "Colaboradores ilimitados",
      "Leads e negócios ilimitados",
      "Múltiplos workspaces",
      "Relatórios e exportação",
      "Suporte prioritário",
    ],
  },
};

export function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID_PRO;
  if (!id) throw new Error("STRIPE_PRICE_ID_PRO não configurado");
  return id;
}

/**
 * Status da Stripe que ainda dão direito ao Pro.
 *
 * `past_due` entra de propósito: cobrança falhada não derruba o acesso na hora
 * — a Stripe ainda vai tentar de novo, e cortar o cliente no primeiro tropeço
 * do cartão seria hostil. Quem sai do Pro é `canceled` e `unpaid`.
 */
export const ACTIVE_STATUSES = ["active", "trialing", "past_due"] as const;

export function planFromStatus(status: string): Plan {
  return (ACTIVE_STATUSES as readonly string[]).includes(status) ? "pro" : "free";
}
