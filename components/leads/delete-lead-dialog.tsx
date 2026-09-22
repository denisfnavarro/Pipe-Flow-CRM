"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { deleteLeadAction } from "@/app/(app)/leads/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DeleteLeadDialogProps {
  leadId: string;
  leadName: string;
  trigger: ReactNode;
  /** Após excluir a partir da página de detalhe, volta para a listagem. */
  redirectToList?: boolean;
}

export function DeleteLeadDialog({
  leadId,
  leadName,
  trigger,
  redirectToList = false,
}: DeleteLeadDialogProps) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function onConfirm() {
    setPending(true);
    const result = await deleteLeadAction(leadId);
    setPending(false);

    if (!result.ok) {
      toast({ variant: "destructive", title: "Algo deu errado", description: result.error });
      return;
    }

    toast({ title: "Lead excluído", description: leadName });
    if (redirectToList) router.push("/leads");
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {leadName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Os negócios e as atividades vinculados a este lead também serão removidos. Esta ação não
            pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className={cn("bg-danger text-danger-foreground hover:bg-danger/90")}
          >
            {pending ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
