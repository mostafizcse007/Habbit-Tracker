"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { addDaysToDateString } from "@/lib/dates"
import { getTodayInTimeZone, isValidTimeZone } from "@/lib/timezone"
import { reconcileUserAchievements } from "@/lib/achievements-sync"

import { calculateStreaks, calculateCompletionRate } from "@/lib/streaks"

function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export interface ToggleHabitLogSuccess {
  success: true
  habitId: string
  currentStreak: number
  longestStreak: number
  rawCurrent: number
  completionRate: number | null
  completedWeek: number
  scheduledWeek: number
  logs: string[]
}

export type ToggleHabitLogResult =
  | { error: string }
  | ToggleHabitLogSuccess

export async function toggleHabitLog(
  habitId: string,
  date: string,
  completed: boolean
): Promise<ToggleHabitLogResult> {
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
      user_id: user.id,
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
      .eq("user_id", user.id)
      .eq("completed_on", date)

    if (error) {
      return { error: error.message }
    }

    // Reconcile achievements when a check-in is deleted/unchecked so revoked badges are pruned immediately
    await reconcileUserAchievements(supabase, user.id)
  }

  revalidatePath("/dashboard")
  revalidatePath("/analytics")
  revalidatePath("/achievements")
  revalidatePath("/profile")
  revalidatePath("/habits")
  revalidatePath(`/habits/${habitId}`)

  // Fetch updated habit details and logs to recalculate metrics
  const { data: habit } = await supabase
    .from("habits")
    .select("id, frequency, created_at")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: habitLogsData } = await supabase
    .from("habit_logs")
    .select("completed_on")
    .eq("habit_id", habitId)
    .eq("user_id", user.id)

  const habitLogs = (habitLogsData ?? []).map((l) => l.completed_on)
  const frequency = habit?.frequency ?? [0, 1, 2, 3, 4, 5, 6]
  const createdOn = habit?.created_at
    ? formatDateInTimeZone(new Date(habit.created_at), tz)
    : undefined

  const streaks = calculateStreaks(habitLogs, frequency, todayInTz, createdOn)
  const rateStats = calculateCompletionRate(
    habitLogs,
    frequency,
    createdOn ?? addDaysToDateString(todayInTz, -6),
    todayInTz,
    7
  )

  return {
    success: true,
    habitId,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    rawCurrent: streaks.rawCurrent,
    completionRate: rateStats.rate,
    completedWeek: rateStats.completed,
    scheduledWeek: rateStats.scheduled,
    logs: habitLogs,
  }
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
    .eq("user_id", user.id)
    .eq("completed_on", date)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .update({ note: cleanNote })
      .eq("id", existing.id)
      .eq("user_id", user.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      completed_on: date,
      note: cleanNote,
    })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/analytics")
  revalidatePath("/achievements")
  revalidatePath("/habits")
  revalidatePath(`/habits/${habitId}`)
  return { success: true }
}

