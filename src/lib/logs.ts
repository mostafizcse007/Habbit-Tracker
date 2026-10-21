import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export async function fetchAllLogs(
  supabase: SupabaseClient<Database>,
  optionsOrHabitId?:
    | string
    | {
        habitId?: string
        userId?: string
        habitIds?: string[]
      }
): Promise<{
  data: { habit_id: string; completed_on: string; note: string | null }[]
  error: string | null
}> {
  const PAGE_SIZE = 1000
  let from = 0
  const allRows: { habit_id: string; completed_on: string; note: string | null }[] = []
  let hasNoteColumn = true

  const habitId =
    typeof optionsOrHabitId === "string"
      ? optionsOrHabitId
      : optionsOrHabitId?.habitId
  const userId =
    typeof optionsOrHabitId === "object" ? optionsOrHabitId?.userId : undefined
  const habitIds =
    typeof optionsOrHabitId === "object"
      ? optionsOrHabitId?.habitIds
      : undefined

  if (habitIds && habitIds.length === 0) {
    return { data: [], error: null }
  }

  while (true) {
    let query = hasNoteColumn
      ? supabase
          .from("habit_logs")
          .select("habit_id, completed_on, note")
          .order("completed_on", { ascending: true })
          .order("id", { ascending: true })
      : supabase
          .from("habit_logs")
          .select("habit_id, completed_on")
          .order("completed_on", { ascending: true })
          .order("id", { ascending: true })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (habitId) {
      query = query.eq("habit_id", habitId)
    } else if (habitIds && habitIds.length > 0) {
      query = query.in("habit_id", habitIds)
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1)

    if (error) {
      // If note column does not exist in database yet, retry without note column gracefully
      if (
        hasNoteColumn &&
        (error.code === "42703" ||
          error.message?.toLowerCase().includes("note") ||
          error.message?.toLowerCase().includes("column"))
      ) {
        hasNoteColumn = false
        from = 0
        allRows.length = 0
        continue
      }
      return { data: allRows, error: error.message }
    }

    if (!data || data.length === 0) {
      break
    }

    for (const row of data as {
      habit_id: string
      completed_on: string
      note?: string | null
    }[]) {
      allRows.push({
        habit_id: row.habit_id,
        completed_on: row.completed_on,
        note: row.note ?? null,
      })
    }

    if (data.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return { data: allRows, error: null }
}

/**
 * Single source of truth for total check-ins count across /profile, /achievements, and /analytics.
 * Consistently counts valid check-ins belonging to the user's active habits,
 * strictly excluding any orphaned logs from deleted habits.
 */
export async function getUserTotalCheckIns(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { includeArchived?: boolean }
): Promise<{ total: number; error: string | null }> {
  let habitsQuery = supabase
    .from("habits")
    .select("id")
    .eq("user_id", userId)

  if (!options?.includeArchived) {
    habitsQuery = habitsQuery.eq("archived", false)
  }

  const { data: habits, error: habitsError } = await habitsQuery

  if (habitsError) {
    return { total: 0, error: habitsError.message }
  }

  if (!habits || habits.length === 0) {
    return { total: 0, error: null }
  }

  const habitIds = habits.map((h) => h.id)

  const { count, error: countError } = await supabase
    .from("habit_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("habit_id", habitIds)

  if (countError) {
    return { total: 0, error: countError.message }
  }

  return { total: count ?? 0, error: null }
}
