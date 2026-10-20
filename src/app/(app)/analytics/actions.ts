"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchAllLogs } from "@/lib/logs"
import { getTodayInTimeZone, isValidTimeZone } from "@/lib/timezone"
import { getLocalDateString } from "@/lib/dates"
import { isDemoUser } from "@/lib/demo"
import type { HabitInput } from "@/lib/analytics"
import {
  buildReviewInput,
  buildReviewPrompt,
  getReviewPeriod,
  hasEnoughData,
  REVIEW_SYSTEM_PROMPT,
  summarizeWindow,
} from "@/lib/review"
import { AiError, generateText } from "@/lib/ai"

export type GenerateWeeklyReviewResult =
  | { error: string }
  | {
      success: true
      review: {
        period_end: string
        content: string
        generations: number
        updated_at: string
      }
    }
  | { notEnough: true }

function getCreatedOnInTz(createdAt: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(createdAt))
  } catch {
    return getLocalDateString(new Date(createdAt))
  }
}

export async function generateWeeklyReview(
  regenerate: boolean
): Promise<GenerateWeeklyReviewResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  if (isDemoUser(user)) {
    return { error: "Weekly reviews need a real account. Create one to try it." }
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
  const period = getReviewPeriod(todayInTz)

  const { data: existing } = await supabase
    .from("weekly_reviews")
    .select("period_end, content, generations, updated_at")
    .eq("period_end", period.end)
    .maybeSingle()

  if (existing && !regenerate) {
    return {
      success: true,
      review: {
        period_end: existing.period_end,
        content: existing.content,
        generations: existing.generations,
        updated_at: existing.updated_at,
      },
    }
  }

  if (existing && existing.generations >= 3) {
    return { error: "You have used all 3 reviews for this week." }
  }

  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (habitsError || !habits) {
    console.error("generateWeeklyReview habits query error:", habitsError)
    return { error: "Could not write your review right now. Try again later." }
  }

  const { data: logsData, error: logsError } = await fetchAllLogs(supabase)
  if (logsError || !logsData) {
    console.error("generateWeeklyReview logs query error:", logsError)
    return { error: "Could not write your review right now. Try again later." }
  }

  const logsByHabit: Record<string, string[]> = {}
  for (const h of habits) {
    logsByHabit[h.id] = []
  }
  for (const log of logsData) {
    if (logsByHabit[log.habit_id]) {
      logsByHabit[log.habit_id].push(log.completed_on)
    }
  }

  const habitInputs: HabitInput[] = habits.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    frequency: h.frequency,
    createdOn: getCreatedOnInTz(h.created_at, tz),
  }))

  const summary = summarizeWindow(
    habitInputs,
    logsByHabit,
    period.start,
    period.end
  )

  if (!hasEnoughData(summary)) {
    return { notEnough: true }
  }

  const habitNameMap = new Map(habits.map((h) => [h.id, h.name]))
  const recentNotes: { habit: string; date: string; note: string }[] = []
  for (const log of logsData) {
    if (
      log.note &&
      log.completed_on >= period.start &&
      log.completed_on <= period.end
    ) {
      const name = habitNameMap.get(log.habit_id)
      if (name) {
        recentNotes.push({
          habit: name,
          date: log.completed_on,
          note: log.note,
        })
      }
    }
  }

  const reviewInput = buildReviewInput(
    habitInputs,
    logsByHabit,
    period.start,
    period.end,
    recentNotes
  )
  const prompt = buildReviewPrompt(reviewInput)

  let text: string
  try {
    text = await generateText({
      system: REVIEW_SYSTEM_PROMPT,
      prompt,
    })
  } catch (err) {
    console.error("generateWeeklyReview AI generation error:", err)
    if (err instanceof AiError && err.kind === "rate_limited") {
      return {
        error: "The AI service is busy right now. Try again in a minute.",
      }
    }
    return { error: "Could not write your review right now. Try again later." }
  }

  const truncatedContent = text.slice(0, 2000)

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("weekly_reviews")
      .update({
        content: truncatedContent,
        generations: existing.generations + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("period_end", period.end)
      .eq("user_id", user.id)
      .select("period_end, content, generations, updated_at")
      .single()

    if (updateError || !updated) {
      console.error("generateWeeklyReview weekly_reviews update error:", updateError)
      return {
        error: "Could not write your review right now. Try again later.",
      }
    }

    return {
      success: true,
      review: {
        period_end: updated.period_end,
        content: updated.content,
        generations: updated.generations,
        updated_at: updated.updated_at,
      },
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("weekly_reviews")
    .insert({
      user_id: user.id,
      period_end: period.end,
      content: truncatedContent,
    })
    .select("period_end, content, generations, updated_at")
    .single()

  if (insertError) {
    console.error("generateWeeklyReview weekly_reviews insert error:", insertError)
    if (insertError.code === "23505") {
      const { data: fallbackRow } = await supabase
        .from("weekly_reviews")
        .select("period_end, content, generations, updated_at")
        .eq("period_end", period.end)
        .maybeSingle()

      if (fallbackRow) {
        return {
          success: true,
          review: {
            period_end: fallbackRow.period_end,
            content: fallbackRow.content,
            generations: fallbackRow.generations,
            updated_at: fallbackRow.updated_at,
          },
        }
      }
    }
    return { error: "Could not write your review right now. Try again later." }
  }

  if (!inserted) {
    console.error("generateWeeklyReview: inserted is null")
    return { error: "Could not write your review right now. Try again later." }
  }

  return {
    success: true,
    review: {
      period_end: inserted.period_end,
      content: inserted.content,
      generations: inserted.generations,
      updated_at: inserted.updated_at,
    },
  }
}
