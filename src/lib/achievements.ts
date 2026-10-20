import { parseLocalDateString } from "./dates"
import { calculateStreaks } from "./streaks"
import { buildDailyCompletion, type HabitInput } from "./analytics"

export interface AchievementDefinition {
  key: string
  title: string
  description: string
  icon: string
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "first_checkin",
    title: "First check-in",
    description: "Log your first day.",
    icon: "Check",
  },
  {
    key: "checkins_25",
    title: "25 check-ins",
    description: "Reach 25 check-ins in total.",
    icon: "ListChecks",
  },
  {
    key: "checkins_100",
    title: "100 check-ins",
    description: "Reach 100 check-ins in total.",
    icon: "Medal",
  },
  {
    key: "checkins_500",
    title: "500 check-ins",
    description: "Reach 500 check-ins in total.",
    icon: "Trophy",
  },
  {
    key: "streak_7",
    title: "One week",
    description: "Keep any habit going for 7 days in a row.",
    icon: "Flame",
  },
  {
    key: "streak_30",
    title: "30-day chain",
    description: "Keep any habit going for 30 days in a row.",
    icon: "CalendarCheck",
  },
  {
    key: "streak_100",
    title: "100-day chain",
    description: "Keep any habit going for 100 days in a row.",
    icon: "Crown",
  },
  {
    key: "perfect_day",
    title: "Perfect day",
    description: "Finish every habit on a day with at least 3 scheduled.",
    icon: "Sparkles",
  },
  {
    key: "perfect_week",
    title: "Perfect week",
    description:
      "Have 7 perfect days in a row. Days with nothing scheduled do not break the run.",
    icon: "Star",
  },
  {
    key: "comeback",
    title: "Comeback",
    description: "Check in again after 7 or more days away.",
    icon: "RotateCcw",
  },
]

export function evaluateAchievements(
  habits: HabitInput[],
  logsByHabit: Record<string, string[]>,
  today: string
): {
  earned: Set<string>
  totalCheckIns: number
  longestStreak: number
} {
  const earned = new Set<string>()

  if (habits.length === 0) {
    return {
      earned,
      totalCheckIns: 0,
      longestStreak: 0,
    }
  }

  let totalLogs = 0
  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    totalLogs += logs.length
  }

  if (totalLogs >= 1) {
    earned.add("first_checkin")
  }
  if (totalLogs >= 25) {
    earned.add("checkins_25")
  }
  if (totalLogs >= 100) {
    earned.add("checkins_100")
  }
  if (totalLogs >= 500) {
    earned.add("checkins_500")
  }

  let longestStreak = 0
  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    const s = calculateStreaks(logs, habit.frequency, today, habit.createdOn)
    if (s.longest > longestStreak) {
      longestStreak = s.longest
    }
  }

  if (longestStreak >= 7) {
    earned.add("streak_7")
  }
  if (longestStreak >= 30) {
    earned.add("streak_30")
  }
  if (longestStreak >= 100) {
    earned.add("streak_100")
  }

  let earliestCreatedOn = habits[0].createdOn
  for (const habit of habits) {
    if (habit.createdOn < earliestCreatedOn) {
      earliestCreatedOn = habit.createdOn
    }
  }

  const daily = buildDailyCompletion(
    habits,
    logsByHabit,
    earliestCreatedOn,
    today
  )

  let perfectWeekRun = 0
  for (const point of daily) {
    if (point.scheduled >= 3 && point.completed === point.scheduled) {
      earned.add("perfect_day")
    }

    if (point.scheduled === 0) {
      continue
    }

    if (point.completed === point.scheduled) {
      perfectWeekRun++
      if (perfectWeekRun >= 7) {
        earned.add("perfect_week")
      }
    } else {
      perfectWeekRun = 0
    }
  }

  const distinctDatesSet = new Set<string>()
  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    for (const d of logs) {
      distinctDatesSet.add(d)
    }
  }

  const distinctDates = Array.from(distinctDatesSet).sort()
  for (let i = 1; i < distinctDates.length; i++) {
    const prevDate = parseLocalDateString(distinctDates[i - 1])
    const curDate = parseLocalDateString(distinctDates[i])
    const diffDays = Math.round(
      (curDate.getTime() - prevDate.getTime()) / 86400000
    )
    if (diffDays >= 8) {
      earned.add("comeback")
      break
    }
  }

  return {
    earned,
    totalCheckIns: totalLogs,
    longestStreak,
  }
}
