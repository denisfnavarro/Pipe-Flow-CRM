"use client";

import { RotateCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { resendInviteAction, revokeInviteAction } from "@/app/(app)/settings/members/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function InviteActions({ inviteId, active }: { inviteId: string; active: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        toast({ variant: "destructive", title: "Algo deu errado", description: result.error });
        return;
      }

      toast({ title: result.message ?? "Pronto" });
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs"
        disabled={pending}
        onClick={() => run(() => resendInviteAction(inviteId))}
      >
        <RotateCw className="h-3 w-3" aria-hidden />
        Reenviar
      </Button>

      {active ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-danger hover:text-danger"
          disabled={pending}
          onClick={() => run(() => revokeInviteAction(inviteId))}
        >
          <X className="h-3 w-3" aria-hidden />
          Revogar
        </Button>
      ) : null}
    </div>
  );
}
