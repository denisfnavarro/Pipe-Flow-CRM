"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { DealFormDialog } from "@/components/pipeline/deal-form-dialog";
import { Button } from "@/components/ui/button";
import type { Lead, Member } from "@/types/domain";

export function NewDealButton({
  members,
  leads,
}: {
  members: Member[];
  leads: Pick<Lead, "id" | "name" | "company">[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" aria-hidden />
        Novo negócio
      </Button>
      <DealFormDialog members={members} leads={leads} open={open} onOpenChange={setOpen} />
    </>
  );
}
