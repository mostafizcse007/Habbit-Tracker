import type { Metadata } from "next"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { getTodayInTimeZone, isValidTimeZone } from "@/lib/timezone"
import { getReviewPeriod } from "@/lib/review"
import { isDemoUser } from "@/lib/demo"

export const maxDuration = 30

export const metadata: Metadata = {
  title: "Analytics",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AnalyticsPage() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDemo = isDemoUser(user)

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null }

  const tz =
    profile?.timezone && isValidTimeZone(profile.timezone)
      ? profile.timezone
      : "UTC"

  const todayInTz = getTodayInTimeZone(tz)
  const period = getReviewPeriod(todayInTz)

  const { data: initialReview } = user
    ? await supabase
        .from("weekly_reviews")
        .select("period_end, content, generations, updated_at")
        .eq("period_end", period.end)
        .maybeSingle()
    : { data: null }

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
          Analytics
        </h1>
        <p className="text-destructive">
          Failed to load habits. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <AnalyticsView
      habits={habits ?? []}
      period={period}
      initialReview={initialReview ?? null}
      isDemo={isDemo}
    />
  )
}
