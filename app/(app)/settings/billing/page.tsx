import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Plano e cobrança" };

export default function SettingsBillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Plano e cobrança" description="Plano atual, uso e upgrade." />
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </div>
  );
}
