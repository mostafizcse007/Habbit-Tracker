import { Skeleton } from "@/components/ui/skeleton"

export default function HabitLoading() {
  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px] space-y-6">
      <div>
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Skeleton className="size-[14px] rounded-[4px]" />
            <Skeleton className="h-[40px] md:h-[56px] w-64 md:w-80" />
          </div>
          <Skeleton className="size-[36px] rounded-lg" />
        </div>
        <Skeleton className="h-5 w-72 mt-3" />
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

      <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-[120px] w-full" />
      </div>

      <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <Skeleton className="h-[280px] w-full md:w-[350px] rounded-lg" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-3 h-28 items-end">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-11 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
