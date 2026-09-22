"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({
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
      title="Algo deu errado"
      description="Não foi possível carregar esta tela. Tente novamente ou volte para o dashboard."
      action={<Button onClick={reset}>Tentar de novo</Button>}
    />
  );
}
