import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { reconcileUserAchievements } from "@/lib/achievements-sync"
import { AchievementsView } from "@/components/achievements/achievements-view"

export const metadata: Metadata = {
  title: "Achievements",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AchievementsPage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const result = await reconcileUserAchievements(supabase, user.id)

  return (
    <AchievementsView
      initialAchievements={result.unlocked}
      initialStats={result.stats}
    />
  )
}
