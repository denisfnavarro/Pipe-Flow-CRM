import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" description="Visão geral do funil, metas e prazos do time." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[4.75rem] w-full" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <Skeleton className="h-80 w-full lg:col-span-3" />
        <Skeleton className="h-80 w-full lg:col-span-2" />
      </div>
    </div>
  );
}
