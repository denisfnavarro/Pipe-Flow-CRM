"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function PipelineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Não foi possível carregar o pipeline"
      description="Algo falhou ao buscar os negócios do workspace. Tente novamente em instantes."
      action={<Button onClick={reset}>Tentar de novo</Button>}
    />
  );
}
