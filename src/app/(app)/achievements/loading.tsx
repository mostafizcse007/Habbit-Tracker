import { Skeleton } from "@/components/ui/skeleton"

export default function AchievementsLoading() {
  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
      <div>
        <Skeleton className="h-[44px] md:h-[56px] w-64" />
        <Skeleton className="h-5 w-80 mt-3" />
      </div>

      <div className="mt-10 bg-card border border-border rounded-[14px] p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[10px] p-5 border border-dashed border-line-strong flex gap-4 items-start"
            >
              <Skeleton className="size-6 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
