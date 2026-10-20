import type { Habit } from "@/types"
import {
  addDaysToDateString,
  getLocalDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "@/lib/dates"
import { calculateCompletionRate } from "@/lib/streaks"

export interface SmartNudge {
  id: string
  type: "milestone" | "encouragement" | "warning" | "celebration" | "nudge"
  title: string
  message: string
  habitId?: string
  priority: number
}

const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 365]

export function computeSmartNudges({
  habits,
  logsByHabit,
  streaksByHabit,
  today,
}: {
  habits: Habit[]
  logsByHabit: Record<string, string[]>
  streaksByHabit: Record<string, number>
  today: string
}): SmartNudge[] {
  if (habits.length === 0 || !today) return []

  const nudges: SmartNudge[] = []
  const todayWeekday = getLocalWeekday(parseLocalDateString(today))
  const scheduledToday = habits.filter((h) =>
    h.frequency.includes(todayWeekday)
  )
  const openToday = scheduledToday.filter(
    (h) => !(logsByHabit[h.id] ?? []).includes(today)
  )

  // 1. One habit left for perfect day
  if (scheduledToday.length > 1 && openToday.length === 1) {
    const lastOne = openToday[0]
    nudges.push({
      id: `almost-perfect-${today}-${lastOne.id}`,
      type: "encouragement",
      title: "Almost there! ✨",
      message: `Only 1 habit left for a 100% complete day: "${lastOne.name}". Finish strong!`,
      habitId: lastOne.id,
      priority: 95,
    })
  }

  // 2. Streak milestones
  for (const habit of habits) {
    const streak = streaksByHabit[habit.id] ?? 0
    if (MILESTONES.includes(streak)) {
      nudges.push({
        id: `streak-milestone-${habit.id}-${streak}`,
        type: "milestone",
        title: "Streak Milestone! 🔥",
        message: `You've kept up "${habit.name}" for ${streak} days in a row! Amazing consistency.`,
        habitId: habit.id,
        priority: 90 + Math.min(streak, 10),
      })
    }
  }

  // 3. Drop-off Warning (Comparing last 7 days vs previous 7 days)
  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    const createdOn = getLocalDateString(new Date(habit.created_at))

    const recentRate = calculateCompletionRate(
      logs,
      habit.frequency,
      createdOn,
      today,
      7
    )

    const sevenDaysAgo = addDaysToDateString(today, -7)
    const prevRate = calculateCompletionRate(
      logs,
      habit.frequency,
      createdOn,
      sevenDaysAgo,
      7
    )

    if (
      prevRate.scheduled >= 3 &&
      prevRate.rate !== null &&
      prevRate.rate >= 60 &&
      recentRate.rate !== null &&
      prevRate.rate - recentRate.rate >= 30
    ) {
      nudges.push({
        id: `drop-off-${habit.id}-${today}`,
        type: "warning",
        title: "Momentum Alert ⚠️",
        message: `"${habit.name}" dropped by ${prevRate.rate - recentRate.rate}% this week. A small check-in today will get you back in rhythm!`,
        habitId: habit.id,
        priority: 75,
      })
    }
  }

  // 4. Comeback Nudge for an open habit today
  for (const habit of openToday) {
    const logs = new Set(logsByHabit[habit.id] ?? [])
    // check if missed last 2 scheduled days
    let missedCount = 0
    let checkDate = addDaysToDateString(today, -1)
    let daysChecked = 0

    while (daysChecked < 7 && missedCount < 2) {
      const wd = getLocalWeekday(parseLocalDateString(checkDate))
      if (habit.frequency.includes(wd)) {
        if (!logs.has(checkDate)) {
          missedCount++
        } else {
          break
        }
      }
      checkDate = addDaysToDateString(checkDate, -1)
      daysChecked++
    }

    if (missedCount >= 2) {
      nudges.push({
        id: `comeback-${habit.id}-${today}`,
        type: "nudge",
        title: "Fresh Start 💪",
        message: `"${habit.name}" is scheduled today. Take a quick step to restart your momentum!`,
        habitId: habit.id,
        priority: 70,
      })
    }
  }

  return nudges.sort((a, b) => b.priority - a.priority)
}
