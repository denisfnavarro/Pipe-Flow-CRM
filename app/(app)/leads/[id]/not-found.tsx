import { UserX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function LeadNotFound() {
  return (
    <EmptyState
      icon={UserX}
      title="Lead não encontrado"
      description="Este contato não existe ou foi excluído do workspace."
      action={
        <Button asChild>
          <Link href="/leads">Voltar para leads</Link>
        </Button>
      }
    />
  );
}
