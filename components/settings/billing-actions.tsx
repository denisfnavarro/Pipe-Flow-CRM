"use client";

import { ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { createCheckoutAction, createPortalAction } from "@/app/(app)/settings/billing/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Variant = "upgrade" | "portal";

export function BillingAction({ variant, className }: { variant: Variant; className?: string }) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function go() {
    setPending(true);
    const result =
      variant === "upgrade" ? await createCheckoutAction() : await createPortalAction();
    setPending(false);

    if (!result.ok) {
      toast({ variant: "destructive", title: "Algo deu errado", description: result.error });
      return;
    }

    // Sai do app para o domínio da Stripe: navegação do browser, não do router.
    window.location.href = result.url;
  }

  if (variant === "portal") {
    return (
      <Button variant="outline" size="sm" onClick={go} disabled={pending} className={className}>
        {pending ? "Abrindo…" : "Gerenciar assinatura"}
        <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
      </Button>
    );
  }

  return (
    <Button onClick={go} disabled={pending} className={className}>
      <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
      {pending ? "Abrindo checkout…" : "Fazer upgrade para o Pro"}
    </Button>
  );
}
