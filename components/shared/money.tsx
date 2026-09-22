import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyProps {
  /** Centavos. */
  cents: number;
  compact?: boolean;
  className?: string;
}

/** Valores monetários sempre em Geist Mono, para as colunas alinharem. */
export function Money({ cents, compact = false, className }: MoneyProps) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {compact ? formatMoneyCompact(cents) : formatMoney(cents)}
    </span>
  );
}
