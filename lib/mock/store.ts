import type { Activity, Deal, Lead } from "@/types/domain";
import { buildSeed } from "./seed";

/**
 * Store em memória da camada mock.
 *
 * Fica pendurado em `globalThis` porque o hot reload do Next recarrega os
 * módulos a cada edição — sem isso toda mutação feita na UI seria perdida.
 * Na Fase 3 este arquivo desaparece junto com `lib/mock/`.
 */
interface MockStore {
  leads: Lead[];
  deals: Deal[];
  activities: Activity[];
}

const globalStore = globalThis as unknown as { __pipeflowMock?: MockStore };

export const store: MockStore = (globalStore.__pipeflowMock ??= buildSeed());

/** Latência artificial: mantém os skeletons visíveis e honestos no dev. */
export function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function nextId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
