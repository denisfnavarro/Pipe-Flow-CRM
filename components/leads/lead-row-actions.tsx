"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { DeleteLeadDialog } from "@/components/leads/delete-lead-dialog";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LeadWithRelations, Member } from "@/types/domain";

/**
 * Os dialogs vivem fora do dropdown: aninhar um `Dialog` dentro de um
 * `DropdownMenuItem` faz o menu fechar antes do dialog montar. O menu apenas
 * dispara o clique nos gatilhos escondidos.
 */
export function LeadRowActions({ lead, members }: { lead: LeadWithRelations; members: Member[] }) {
  return (
    <div className="flex justify-end">
      <LeadFormDialog
        members={members}
        lead={lead}
        trigger={<button type="button" id={`edit-${lead.id}`} className="hidden" />}
      />
      <DeleteLeadDialog
        leadId={lead.id}
        leadName={lead.name}
        trigger={<button type="button" id={`delete-${lead.id}`} className="hidden" />}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={`Ações de ${lead.name}`}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild>
            <Link href={`/leads/${lead.id}`}>Ver detalhe</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onSelect={() => document.getElementById(`edit-${lead.id}`)?.click()}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-danger focus:text-danger"
            onSelect={() => document.getElementById(`delete-${lead.id}`)?.click()}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
