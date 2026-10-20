import type { Metadata } from "next"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/habits/dashboard-content"

export const metadata: Metadata = {
  title: "Today",
  robots: {
    index: false,
    follow: false,
  },
}

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
      <div className="pt-7 md:pt-14 space-y-6">
        <h1 className="text-[44px] md:text-[56px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
          Today
        </h1>
        <p className="text-destructive">
          Failed to load habits. Please try again later.
        </p>
      </div>
    )
  }

  return <DashboardContent habits={habits} />
}
