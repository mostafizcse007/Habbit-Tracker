import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export async function fetchAllLogs(
  supabase: SupabaseClient<Database>,
  habitId?: string
): Promise<{
  data: { habit_id: string; completed_on: string; note: string | null }[]
  error: string | null
}> {
  const PAGE_SIZE = 1000
  let from = 0
  const allRows: { habit_id: string; completed_on: string; note: string | null }[] = []
  let hasNoteColumn = true

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

    if (habitId) {
      query = query.eq("habit_id", habitId)
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
