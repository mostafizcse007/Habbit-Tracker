import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px] space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Skeleton className="h-[44px] md:h-[56px] w-64" />
          <Skeleton className="h-5 w-80 mt-3" />
        </div>
        <Skeleton className="h-11 w-64 rounded-[10px]" />
      </div>

      <div className="mt-8 bg-card border border-border rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card p-5 md:p-6 space-y-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-full max-w-[480px]" />
        <Skeleton className="h-5 w-full max-w-[420px]" />
      </div>

      <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-[260px] w-full rounded-lg mt-4" />
      </div>

      <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-3 h-28 items-end">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-11 rounded-md" />
          ))}
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-[120px] w-full" />
      </div>
    </div>
  )
}
