"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Member } from "@/types/domain";

export function UserMenu({ member }: { member: Member }) {
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
        {/* Sem sessão real até a M7; o link leva ao login público. */}
        <DropdownMenuItem asChild>
          <Link href="/login" className="gap-2 text-danger focus:text-danger">
            <LogOut className="h-4 w-4" aria-hidden />
            Sair
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
