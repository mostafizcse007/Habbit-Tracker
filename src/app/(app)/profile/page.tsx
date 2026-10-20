import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isDemoUser } from "@/lib/demo"
import { ProfileView } from "@/components/profile/profile-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

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

  // Resolve cover banner configuration from database profile, falling back to auth user_metadata
  const profileRecord = profile as Record<string, unknown> | null
  const coverPreset = profileRecord?.cover_preset as string | undefined
  const coverUrl = profileRecord?.cover_url as string | undefined
  const metaCover = user.user_metadata?.cover_config as
    | { type: "preset"; presetId: string }
    | { type: "custom"; customUrl: string }
    | undefined

  let initialCover: { type: "preset"; presetId: string } | { type: "custom"; customUrl: string } = {
    type: "preset",
    presetId: "aurora",
  }

  if (coverUrl) {
    initialCover = { type: "custom", customUrl: coverUrl }
  } else if (coverPreset) {
    initialCover = { type: "preset", presetId: coverPreset }
  } else if (metaCover && (metaCover.type === "preset" || metaCover.type === "custom")) {
    initialCover = metaCover
  }

  return (
    <ProfileView
      user={{
        id: user.id,
        email: user.email ?? "",
        created_at: user.created_at,
        user_metadata: user.user_metadata,
      }}
      profile={profile}
      habitsCount={habitsCount ?? 0}
      totalLogsCount={totalLogsCount ?? 0}
      isDemo={isDemo}
      initialCover={initialCover}
    />
  )
}
