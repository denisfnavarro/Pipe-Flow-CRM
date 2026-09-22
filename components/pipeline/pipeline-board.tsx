"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { moveDealAction } from "@/app/(app)/pipeline/actions";
import { DealCardBody } from "@/components/pipeline/deal-card";
import { DealFormDialog } from "@/components/pipeline/deal-form-dialog";
import { PipelineColumn } from "@/components/pipeline/pipeline-column";
import { useToast } from "@/hooks/use-toast";
import { STAGE_LABELS } from "@/lib/stages";
import {
  DEAL_STAGES,
  type DealStage,
  type DealWithRelations,
  type Lead,
  type Member,
} from "@/types/domain";

interface PipelineBoardProps {
  deals: DealWithRelations[];
  members: Member[];
  leads: Pick<Lead, "id" | "name" | "company">[];
}

function byStage(deals: DealWithRelations[], stage: DealStage) {
  return deals.filter((deal) => deal.stage === stage).sort((a, b) => a.position - b.position);
}

/**
 * Reproduz, em memória, exatamente o que `moveDeal` faz no servidor: remove o
 * card da coluna, insere na posição alvo e reindexa origem e destino. Espelhar
 * o algoritmo é o que evita o card piscar de volta quando a action confirma.
 */
function applyMove(
  items: DealWithRelations[],
  deal: DealWithRelations,
  targetStage: DealStage,
  position: number,
): DealWithRelations[] {
  const column = byStage(items, targetStage).filter((item) => item.id !== deal.id);
  column.splice(Math.max(0, Math.min(position, column.length)), 0, deal);

  const positions = new Map<string, number>();
  column.forEach((item, index) => positions.set(item.id, index));

  if (deal.stage !== targetStage) {
    byStage(items, deal.stage)
      .filter((item) => item.id !== deal.id)
      .forEach((item, index) => positions.set(item.id, index));
  }

  return items.map((item) => {
    const next = positions.get(item.id);
    if (next === undefined) return item;
    return item.id === deal.id
      ? { ...item, stage: targetStage, position: next }
      : { ...item, position: next };
  });
}

export function PipelineBoard({ deals, members, leads }: PipelineBoardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState(deals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogDeal, setDialogDeal] = useState<DealWithRelations | null>(null);
  const [dialogStage, setDialogStage] = useState<DealStage | null>(null);

  // O servidor é a fonte de verdade: qualquer revalidate sobrescreve o otimismo.
  useEffect(() => setItems(deals), [deals]);

  const sensors = useSensors(
    // Uma pequena distância evita que um clique no card vire um drag de 1px.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeDeal = activeId ? (items.find((deal) => deal.id === activeId) ?? null) : null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const deal = items.find((item) => item.id === active.id);
    if (!deal) return;

    const overData = over.data.current as { type?: string; stage?: DealStage } | undefined;
    const overDeal = items.find((item) => item.id === over.id);
    const targetStage = overData?.stage ?? overDeal?.stage;
    if (!targetStage) return;

    const column = byStage(items, targetStage).filter((item) => item.id !== deal.id);
    const targetIndex = overDeal
      ? column.findIndex((item) => item.id === overDeal.id)
      : column.length;
    const position = targetIndex === -1 ? column.length : targetIndex;

    if (deal.stage === targetStage && deal.position === position) return;

    const previous = items;
    setItems(applyMove(items, deal, targetStage, position));

    const result = await moveDealAction(deal.id, targetStage, position);

    if (!result.ok) {
      setItems(previous);
      toast({ variant: "destructive", title: "Não foi possível mover", description: result.error });
      return;
    }

    if (targetStage !== deal.stage) {
      toast({
        title: "Negócio movido",
        description: `${deal.title} → ${STAGE_LABELS[targetStage]}`,
      });
    }

    router.refresh();
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Movendo o negócio ${active.id}.`,
            onDragOver: ({ over }) => (over ? `Sobre ${over.id}.` : "Fora de uma coluna."),
            onDragEnd: ({ over }) =>
              over ? `Negócio solto sobre ${over.id}.` : "Movimento cancelado.",
            onDragCancel: () => "Movimento cancelado.",
          },
        }}
      >
        <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-3">
          {DEAL_STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              deals={byStage(items, stage)}
              onOpenDeal={(deal) => {
                setDialogStage(null);
                setDialogDeal(deal);
              }}
              onCreateInStage={(target) => {
                setDialogDeal(null);
                setDialogStage(target);
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="w-[15.5rem]">
              <DealCardBody deal={activeDeal} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealFormDialog
        members={members}
        leads={leads}
        deal={dialogDeal ?? undefined}
        defaultStage={dialogStage ?? undefined}
        open={dialogDeal !== null || dialogStage !== null}
        onOpenChange={(next) => {
          if (!next) {
            setDialogDeal(null);
            setDialogStage(null);
          }
        }}
      />
    </>
  );
}
