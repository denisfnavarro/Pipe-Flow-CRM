import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Pipeline"
        description="Arraste os cards entre as etapas para atualizar o funil."
      />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, column) => (
          <div
            key={column}
            className="w-[17rem] shrink-0 space-y-2 rounded-lg border border-border p-2"
          >
            <Skeleton className="h-6 w-full" />
            {Array.from({ length: 3 }).map((_, card) => (
              <Skeleton key={card} className="h-24 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
