import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Calendário" };

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calendário" description="Prazos de negócios e reuniões agendadas." />
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </div>
  );
}
