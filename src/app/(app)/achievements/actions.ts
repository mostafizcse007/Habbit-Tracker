"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { fetchAllLogs } from "@/lib/logs"
import { getTodayInTimeZone, isValidTimeZone } from "@/lib/timezone"
import { evaluateAchievements } from "@/lib/achievements"
import type { HabitInput } from "@/lib/analytics"

function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export async function checkAchievements(options?: {
  revalidate?: boolean
}): Promise<
  | { error: string }
  | {
      success: true
      newlyUnlocked: string[]
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

  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (habitsError || !habits) {
    return { error: "Failed to load habits" }
  }

  const { data: logsData, error: logsError } = await fetchAllLogs(supabase)
  if (logsError || !logsData) {
    return { error: "Failed to load logs" }
  }

  const habitIds = new Set(habits.map((h) => h.id))
  const logsByHabit: Record<string, string[]> = {}
  for (const log of logsData) {
    if (habitIds.has(log.habit_id)) {
      if (!logsByHabit[log.habit_id]) {
        logsByHabit[log.habit_id] = []
      }
      logsByHabit[log.habit_id].push(log.completed_on)
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle()

  const tz =
    profile?.timezone && isValidTimeZone(profile.timezone)
      ? profile.timezone
      : "UTC"
  const today = getTodayInTimeZone(tz)

  const habitInputs: HabitInput[] = habits.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    frequency: h.frequency,
    createdOn: formatDateInTimeZone(new Date(h.created_at), tz),
  }))

  const {
    earned: earnedKeys,
    totalCheckIns,
    longestStreak,
  } = evaluateAchievements(habitInputs, logsByHabit, today)

  const { data: existingRows, error: existingError } = await supabase
    .from("user_achievements")
    .select("key, unlocked_at")

  if (existingError || !existingRows) {
    return { error: "Failed to read achievements" }
  }

  const existingKeys = new Set(existingRows.map((r) => r.key))
  const keysToInsert = Array.from(earnedKeys).filter(
    (k) => !existingKeys.has(k)
  )

  const newlyUnlocked: string[] = []
  const allUnlocked = [...existingRows]

  for (const key of keysToInsert) {
    const { data, error } = await supabase
      .from("user_achievements")
      .insert({ key })
      .select("key, unlocked_at")
      .single()

    if (!error && data) {
      newlyUnlocked.push(data.key)
      allUnlocked.push(data)
    } else if (error && error.code === "23505") {
      continue
    }
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

  if (newlyUnlocked.length > 0 && shouldRevalidate) {
    revalidatePath("/achievements")
  }

  return {
    success: true,
    newlyUnlocked,
    unlocked: allUnlocked,
    stats: {
      totalCheckIns,
      longestStreak,
    },
  }
}
