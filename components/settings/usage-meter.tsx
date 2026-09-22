import { cn } from "@/lib/utils";
import { usageRatio } from "@/lib/plans";

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number | null;
}

export function UsageMeter({ label, used, limit }: UsageMeterProps) {
  const ratio = usageRatio(used, limit);
  const percent = ratio === null ? 0 : Math.round(ratio * 100);

  // A cor só muda quando há uma decisão a tomar: perto do teto, ou no teto.
  const tone =
    ratio === null
      ? "bg-primary"
      : ratio >= 1
        ? "bg-danger"
        : ratio >= 0.8
          ? "bg-warning"
          : "bg-primary";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{label}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {used}
          {limit === null ? " · ilimitado" : ` / ${limit}`}
        </span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: ratio === null ? "100%" : `${Math.max(percent, 2)}%` }}
        />
      </div>
    </div>
  );
}
