import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pipeline" description="Negócios por etapa do funil." />
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </div>
  );
}
