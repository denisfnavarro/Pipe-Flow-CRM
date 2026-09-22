import type { Plan } from "@/types/domain";

/**
 * Limites do plano. A UI usa isto para mostrar uso e paywall; a partir da M11 o
 * servidor aplica os mesmos números — na UI é conveniência, no servidor é regra.
 */
export interface PlanLimits {
  label: string;
  /** `null` = ilimitado. */
  seats: number | null;
  leads: number | null;
  /** Centavos por mês. */
  priceCents: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { label: "Free", seats: 2, leads: 50, priceCents: 0 },
  pro: { label: "Pro", seats: null, leads: null, priceCents: 4900 },
};

/** Fração 0–1 de uso; `null` quando o limite é ilimitado. */
export function usageRatio(used: number, limit: number | null): number | null {
  if (limit === null) return null;
  return Math.min(1, used / limit);
}
