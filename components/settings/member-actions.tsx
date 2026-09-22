"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/app/(app)/settings/members/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Member } from "@/types/domain";

export function MemberActions({ member, isSelf }: { member: Member; isSelf: boolean }) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={pending}
          aria-label={`Ações de ${member.name}`}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {member.role === "member" ? (
          <DropdownMenuItem onSelect={() => run(() => updateMemberRoleAction(member.id, "admin"))}>
            Tornar administrador
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => run(() => updateMemberRoleAction(member.id, "member"))}>
            Rebaixar para membro
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-danger focus:text-danger"
          onSelect={() => run(() => removeMemberAction(member.id))}
        >
          {isSelf ? "Sair do workspace" : "Remover do workspace"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
