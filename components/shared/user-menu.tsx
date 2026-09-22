"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Member } from "@/types/domain";

export function UserMenu({ member }: { member: Pick<Member, "name" | "email" | "avatarUrl"> }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Abrir menu do usuário"
      >
        <UserAvatar member={member} className="h-8 w-8" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block text-sm font-medium">{member.name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {member.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings/workspace" className="gap-2">
            <UserRound className="h-4 w-4" aria-hidden />
            Minha conta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing" className="gap-2">
            <Settings className="h-4 w-4" aria-hidden />
            Plano e cobrança
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          className="gap-2 text-danger focus:text-danger"
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => {
              void logoutAction();
            });
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {pending ? "Saindo…" : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
