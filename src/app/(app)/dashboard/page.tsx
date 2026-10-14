import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/habits/dashboard-content"

export default async function DashboardPage() {
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
      <div className="space-y-6">
        <h1 className="sr-only">Dashboard</h1>
        <p className="text-destructive">
          Failed to load habits. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Dashboard</h1>
      <DashboardContent habits={habits} />
    </div>
  )
}
