import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Calendário" };

// Pós-MVP: vira a branch `feat/calendar` quando priorizado (ver ROADMAP).
export default function CalendarPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Calendário" description="Prazos de negócios e reuniões agendadas." />
      <EmptyState
        icon={CalendarDays}
        title="Calendário em breve"
        description="Os prazos dos negócios já aparecem nos cards do pipeline e no bloco de prazos próximos do dashboard."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/pipeline">Ver prazos no pipeline</Link>
          </Button>
        }
      />
    </div>
  );
}
