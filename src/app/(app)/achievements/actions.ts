"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { reconcileUserAchievements } from "@/lib/achievements-sync"

export async function checkAchievements(options?: {
  revalidate?: boolean
}): Promise<
  | { error: string }
  | {
      success: true
      newlyUnlocked: string[]
      revoked: string[]
      unlocked: { key: string; unlocked_at: string }[]
      stats: {
        totalCheckIns: number
        longestStreak: number
      }
    }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const result = await reconcileUserAchievements(supabase, user.id)

  if (!result.success || result.error) {
    return { error: result.error || "Failed to reconcile achievements" }
  }

  let shouldRevalidate = options?.revalidate ?? true
  if (shouldRevalidate) {
    try {
      const headerList = await headers()
      const referer =
        headerList.get("referer") || headerList.get("next-url") || ""
      if (referer.includes("/achievements")) {
        shouldRevalidate = false
      }
    } catch {
    }
  }

  if (
    (result.newlyUnlocked.length > 0 || result.revoked.length > 0) &&
    shouldRevalidate
  ) {
    revalidatePath("/achievements")
  }

  return {
    success: true,
    newlyUnlocked: result.newlyUnlocked,
    revoked: result.revoked,
    unlocked: result.unlocked,
    stats: result.stats,
  }
}
