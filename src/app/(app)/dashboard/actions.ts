"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { addDaysToDateString } from "@/lib/dates"
import { getTodayInTimeZone, isValidTimeZone } from "@/lib/timezone"

export async function toggleHabitLog(
  habitId: string,
  date: string,
  completed: boolean
): Promise<{ error: string } | { success: true }> {
  if (!habitId || typeof habitId !== "string" || habitId.trim() === "") {
    return { error: "Invalid habit ID" }
  }

  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Invalid date format" }
  }

  const [yearStr, monthStr, dayStr] = date.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const parsedDate = new Date(year, month - 1, day)

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return { error: "Invalid date" }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
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

  const todayInTz = getTodayInTimeZone(tz)

  if (date > addDaysToDateString(todayInTz, 1)) {
    return { error: "That date is in the future." }
  }

  if (completed) {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      completed_on: date,
    })

    if (error && error.code !== "23505") {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("completed_on", date)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function saveHabitNote(
  habitId: string,
  date: string,
  note: string | null
): Promise<{ error: string } | { success: true }> {
  if (!habitId || typeof habitId !== "string" || habitId.trim() === "") {
    return { error: "Invalid habit ID" }
  }

  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Invalid date format" }
  }

  const cleanNote = note ? note.trim().slice(0, 500) : null

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", habitId)
    .eq("completed_on", date)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .update({ note: cleanNote })
      .eq("id", existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      completed_on: date,
      note: cleanNote,
    })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/habits/${habitId}`)
  return { success: true }
}

