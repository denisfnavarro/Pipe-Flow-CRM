import { STAGE_LABELS, STAGE_STYLES } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { DealStage } from "@/types/domain";

interface StageBadgeProps {
  stage: DealStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium",
        STAGE_STYLES[stage].chip,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_STYLES[stage].bar)} aria-hidden />
      {STAGE_LABELS[stage]}
    </span>
  );
}
