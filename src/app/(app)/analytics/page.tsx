import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AnalyticsView } from "@/components/analytics/analytics-view"

export default async function AnalyticsPage() {
  await connection()

  const supabase = await createClient()
  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    return (
      <div className="pt-7 md:pt-14 space-y-6">
        <p className="text-destructive">
          Failed to load habits. Please try again later.
        </p>
      </div>
    )
  }

  return <AnalyticsView habits={habits ?? []} />
}
