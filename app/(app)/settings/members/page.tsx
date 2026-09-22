import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Membros" };

export default function SettingsMembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Membros"
        description="Quem tem acesso a este workspace e com qual papel."
      />
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </div>
  );
}
