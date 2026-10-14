import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export async function fetchAllLogs(
  supabase: SupabaseClient<Database>,
  habitId?: string
): Promise<{
  data: { habit_id: string; completed_on: string }[]
  error: string | null
}> {
  const PAGE_SIZE = 1000
  let from = 0
  const allRows: { habit_id: string; completed_on: string }[] = []

  while (true) {
    let query = supabase
      .from("habit_logs")
      .select("habit_id, completed_on")
      .order("completed_on", { ascending: true })
      .order("id", { ascending: true })

    if (habitId) {
      query = query.eq("habit_id", habitId)
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1)

    if (error) {
      return { data: allRows, error: error.message }
    }

    if (!data || data.length === 0) {
      break
    }

    allRows.push(...data)

    if (data.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return { data: allRows, error: null }
}
