/**
 * Formatação de saída. Valores monetários vivem em centavos no domínio inteiro
 * e só viram texto aqui.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(cents: number): string {
  return brl.format(cents / 100);
}

/** Para totais de coluna e eixos, onde o valor cheio não cabe. */
export function formatMoneyCompact(cents: number): string {
  return brlCompact.format(cents / 100);
}

/** Aceita "1.234,56", "1234.56" ou "1234" e devolve centavos. */
export function parseMoneyToCents(input: string): number {
  const cleaned = input.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "");
  const normalized = cleaned.replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** "há 3 dias", "em 2 semanas". Usa a API nativa, sem dependência extra. */
const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (Math.abs(days) < 1) {
    const hours = Math.round(diffMs / (60 * 60 * 1000));
    return relative.format(hours, "hour");
  }
  if (Math.abs(days) < 30) return relative.format(days, "day");
  if (Math.abs(days) < 365) return relative.format(Math.round(days / 30), "month");
  return relative.format(Math.round(days / 365), "year");
}

export type DueState = "overdue" | "soon" | "normal";

/** Classificação de prazo usada pelos cards do Kanban e pelo dashboard. */
export function dueState(iso: string | null): DueState {
  if (!iso) return "normal";
  const days = (new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  if (days < 0) return "overdue";
  if (days <= 5) return "soon";
  return "normal";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
