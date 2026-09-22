import { CalendarCheck2 } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { StageBadge } from "@/components/shared/stage-badge";
import { dueState, formatRelative, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DealWithRelations } from "@/types/domain";

const DUE_TONES = {
  overdue: "text-danger",
  soon: "text-warning",
  normal: "text-muted-foreground",
} as const;

export function UpcomingDeals({ deals }: { deals: DealWithRelations[] }) {
  if (deals.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck2}
        title="Nenhum prazo à vista"
        description="Você não tem negócios seus vencendo nos próximos sete dias."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {deals.map((deal) => {
        const due = dueState(deal.dueDate);
        return (
          <li key={deal.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-medium">{deal.title}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <StageBadge stage={deal.stage} />
                {deal.lead ? (
                  <Link
                    href={`/leads/${deal.lead.id}`}
                    className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {deal.lead.name}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <Money cents={deal.value} className="text-sm" />
              {deal.dueDate ? (
                <p className={cn("text-xs", DUE_TONES[due])}>
                  <time dateTime={deal.dueDate} title={formatShortDate(deal.dueDate)}>
                    {formatRelative(deal.dueDate)}
                  </time>
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
