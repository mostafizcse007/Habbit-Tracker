import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
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

export interface ReconcileAchievementsResult {
  success: boolean
  error: string | null
  newlyUnlocked: string[]
  revoked: string[]
  unlocked: { key: string; unlocked_at: string }[]
  stats: {
    totalCheckIns: number
    longestStreak: number
  }
}

/**
 * Reconciles user achievements against current active habits and verified check-in history.
 * - Inserts newly earned badges into user_achievements
 * - Prunes/deletes stale or seeded badge records from user_achievements if thresholds are no longer met
 * - Returns accurate unlocked badges and verified stats (totalCheckIns, longestStreak)
 */
export async function reconcileUserAchievements(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ReconcileAchievementsResult> {
  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (habitsError) {
    return {
      success: false,
      error: habitsError.message,
      newlyUnlocked: [],
      revoked: [],
      unlocked: [],
      stats: { totalCheckIns: 0, longestStreak: 0 },
    }
  }

  const { data: logsData, error: logsError } = await fetchAllLogs(supabase)
  if (logsError || !logsData) {
    return {
      success: false,
      error: logsError || "Failed to load logs",
      newlyUnlocked: [],
      revoked: [],
      unlocked: [],
      stats: { totalCheckIns: 0, longestStreak: 0 },
    }
  }

  const habitIds = new Set((habits ?? []).map((h) => h.id))
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
    .eq("id", userId)
    .maybeSingle()

  const tz =
    profile?.timezone && isValidTimeZone(profile.timezone)
      ? profile.timezone
      : "UTC"
  const today = getTodayInTimeZone(tz)

  const habitInputs: HabitInput[] = (habits ?? []).map((h) => ({
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
    .eq("user_id", userId)

  if (existingError) {
    return {
      success: false,
      error: existingError.message,
      newlyUnlocked: [],
      revoked: [],
      unlocked: [],
      stats: { totalCheckIns, longestStreak },
    }
  }

  const existingMap = new Map(
    (existingRows ?? []).map((r) => [r.key, r.unlocked_at])
  )
  const keysToInsert = Array.from(earnedKeys).filter((k) => !existingMap.has(k))
  const keysToDelete = (existingRows ?? [])
    .filter((r) => !earnedKeys.has(r.key))
    .map((r) => r.key)

  // 1. Prune/revoke stale badge records from database
  if (keysToDelete.length > 0) {
    await supabase
      .from("user_achievements")
      .delete()
      .eq("user_id", userId)
      .in("key", keysToDelete)
  }

  // 2. Insert newly earned badge records
  const newlyUnlocked: string[] = []
  const newlyUnlockedRows: { key: string; unlocked_at: string }[] = []

  for (const key of keysToInsert) {
    const { data, error } = await supabase
      .from("user_achievements")
      .insert({ key })
      .select("key, unlocked_at")
      .single()

    if (!error && data) {
      newlyUnlocked.push(data.key)
      newlyUnlockedRows.push(data)
    } else if (error && error.code === "23505") {
      continue
    }
  }

  // 3. Assemble validated unlocked badges
  const unlocked: { key: string; unlocked_at: string }[] = []
  for (const [key, unlocked_at] of existingMap.entries()) {
    if (earnedKeys.has(key)) {
      unlocked.push({ key, unlocked_at })
    }
  }
  for (const row of newlyUnlockedRows) {
    unlocked.push(row)
  }

  return {
    success: true,
    error: null,
    newlyUnlocked,
    revoked: keysToDelete,
    unlocked,
    stats: {
      totalCheckIns,
      longestStreak,
    },
  }
}
