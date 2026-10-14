import { Skeleton } from "@/components/ui/skeleton"

export default function HabitsLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border p-4 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <Skeleton className="size-3.5 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="size-8 rounded-md" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
