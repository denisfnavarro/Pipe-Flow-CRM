import { Skeleton } from "@/components/ui/skeleton";

export default function LeadDetailLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2 border-b border-border pb-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-96 w-full lg:col-span-2" />
      </div>
    </div>
  );
}
