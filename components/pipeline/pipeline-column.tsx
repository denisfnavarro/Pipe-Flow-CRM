"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { DealCard } from "@/components/pipeline/deal-card";
import { Button } from "@/components/ui/button";
import { formatMoneyCompact } from "@/lib/format";
import { STAGE_LABELS, STAGE_STYLES } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { DealStage, DealWithRelations } from "@/types/domain";

interface PipelineColumnProps {
  stage: DealStage;
  deals: DealWithRelations[];
  onOpenDeal: (deal: DealWithRelations) => void;
  onCreateInStage: (stage: DealStage) => void;
}

export function PipelineColumn({ stage, deals, onOpenDeal, onCreateInStage }: PipelineColumnProps) {
  // A coluna inteira é droppable para que soltar em área vazia também funcione.
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${stage}`,
    data: { type: "column", stage },
  });

  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <section
      className="flex w-[17rem] shrink-0 flex-col rounded-lg border border-border bg-muted/30"
      aria-label={`${STAGE_LABELS[stage]}, ${deals.length} negócios`}
    >
      <header className="flex items-center gap-2 border-b border-border px-2.5 py-2">
        <span
          className={cn("h-2 w-2 shrink-0 rounded-full", STAGE_STYLES[stage].bar)}
          aria-hidden
        />
        <h2 className="flex-1 truncate text-sm font-medium">{STAGE_LABELS[stage]}</h2>
        <span className="rounded-sm bg-background px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
          {deals.length}
        </span>
      </header>

      <div className="flex items-center justify-between border-b border-border px-2.5 py-1.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</span>
        <span className="font-mono text-xs font-medium tabular-nums">
          {formatMoneyCompact(total)}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "scrollbar-thin flex-1 space-y-2 overflow-y-auto p-2 transition-colors",
          isOver && "bg-primary/5",
        )}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onOpen={onOpenDeal} />
          ))}
        </SortableContext>

        {deals.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhum negócio nesta etapa
          </p>
        ) : null}
      </div>

      <footer className="border-t border-border p-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 text-xs text-muted-foreground"
          onClick={() => onCreateInStage(stage)}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Adicionar negócio
        </Button>
      </footer>
    </section>
  );
}
