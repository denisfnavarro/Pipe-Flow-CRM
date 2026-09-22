import { LEAD_STATUS_LABELS, LEAD_STATUS_STYLES } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/domain";

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        LEAD_STATUS_STYLES[status],
        className,
      )}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
