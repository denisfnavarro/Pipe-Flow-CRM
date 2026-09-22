"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, GripVertical } from "lucide-react";
import { Money } from "@/components/shared/money";
import { UserAvatar } from "@/components/shared/user-avatar";
import { dueState, formatShortDate } from "@/lib/format";
import { STAGE_STYLES } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { DealWithRelations } from "@/types/domain";

const DUE_TONES = {
  overdue: "text-danger",
  soon: "text-warning",
  normal: "text-muted-foreground",
} as const;

interface DealCardProps {
  deal: DealWithRelations;
  onOpen: (deal: DealWithRelations) => void;
}

/** Corpo visual do card, compartilhado pelo item sortable e pelo DragOverlay. */
export function DealCardBody({
  deal,
  dragging = false,
  overlay = false,
}: {
  deal: DealWithRelations;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const due = dueState(deal.dueDate);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card transition-shadow",
        overlay ? "shadow-lg ring-1 ring-primary/30" : "hover:shadow-sm",
        dragging && "opacity-40",
      )}
    >
      <div className={cn("h-0.5 w-full", STAGE_STYLES[deal.stage].bar)} />
      <div className="space-y-2 p-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{deal.title}</p>

        {deal.lead ? (
          <p className="truncate text-xs text-muted-foreground">
            {deal.lead.company ? `${deal.lead.name} · ${deal.lead.company}` : deal.lead.name}
          </p>
        ) : (
          <p className="text-xs italic text-muted-foreground">Sem lead vinculado</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <Money cents={deal.value} className="text-sm font-medium" />
          <UserAvatar member={deal.owner} />
        </div>

        {deal.dueDate ? (
          <p className={cn("flex items-center gap-1 text-xs", DUE_TONES[due])}>
            <CalendarClock className="h-3 w-3" aria-hidden />
            {due === "overdue" ? "Vencido em " : "Prazo "}
            <span className="font-mono tabular-nums">{formatShortDate(deal.dueDate)}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DealCard({ deal, onOpen }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: "deal", stage: deal.stage },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="group relative"
    >
      {/* O card inteiro abre o dialog; arrastar fica no punho, para o clique
          continuar sendo clique. */}
      <button
        type="button"
        onClick={() => onOpen(deal)}
        className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <DealCardBody deal={deal} dragging={isDragging} />
      </button>

      <button
        type="button"
        aria-label={`Mover ${deal.title}`}
        className="absolute right-1 top-1.5 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
