import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isDemoUser } from "@/lib/demo"
import { ProfileView } from "@/components/profile/profile-view"

export const metadata: Metadata = {
  title: "Profile & Settings",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ProfilePage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [
    { data: profile },
    { count: habitsCount },
    { count: totalLogsCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("habits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("archived", false),
    supabase
      .from("habit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ])

  const isDemo = isDemoUser(user)

  return (
    <ProfileView
      user={{
        id: user.id,
        email: user.email ?? "",
        created_at: user.created_at,
      }}
      profile={profile}
      habitsCount={habitsCount ?? 0}
      totalLogsCount={totalLogsCount ?? 0}
      isDemo={isDemo}
    />
  )
}
