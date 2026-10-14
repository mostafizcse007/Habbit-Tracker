import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AchievementsView } from "@/components/achievements/achievements-view"

export default async function AchievementsPage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: achievements } = await supabase
    .from("user_achievements")
    .select("key, unlocked_at")

  return <AchievementsView initialAchievements={achievements ?? []} />
}
