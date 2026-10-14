import {
  addDaysToDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "./dates"
import {
  calculateWeekdayRates,
  getBestAndWorstWeekday,
  type WeekdayRate,
} from "./stats"

export interface HabitInput {
  id: string
  name: string
  color: string
  frequency: number[]
  createdOn: string
}

export interface DailyPoint {
  date: string
  scheduled: number
  completed: number
  rate: number | null
}

const WEEKDAY_PLURALS: Record<number, string> = {
  1: "Mondays",
  2: "Tuesdays",
  3: "Wednesdays",
  4: "Thursdays",
  5: "Fridays",
  6: "Saturdays",
  0: "Sundays",
}

export function buildDailyCompletion(
  habits: HabitInput[],
  logsByHabit: Record<string, string[]>,
  startDate: string,
  today: string
): DailyPoint[] {
  const result: DailyPoint[] = []
  let currentDateStr = startDate

  while (currentDateStr <= today) {
    const weekday = getLocalWeekday(parseLocalDateString(currentDateStr))
    let scheduled = 0
    let completed = 0

    for (const habit of habits) {
      if (
        habit.frequency.includes(weekday) &&
        currentDateStr >= habit.createdOn
      ) {
        scheduled++
        const habitLogs = logsByHabit[habit.id] ?? []
        if (habitLogs.includes(currentDateStr)) {
          completed++
        }
      }
    }

    if (currentDateStr === today && completed === 0) {
      currentDateStr = addDaysToDateString(currentDateStr, 1)
      continue
    }

    const rate =
      scheduled === 0 ? null : Math.round((completed / scheduled) * 100)

    result.push({
      date: currentDateStr,
      scheduled,
      completed,
      rate,
    })

    currentDateStr = addDaysToDateString(currentDateStr, 1)
  }

  return result
}

export function groupWeekly(
  points: DailyPoint[]
): { weekStart: string; scheduled: number; completed: number; rate: number | null }[] {
  const map = new Map<string, { scheduled: number; completed: number }>()

  for (const point of points) {
    const weekday = getLocalWeekday(parseLocalDateString(point.date))
    const offset = (weekday + 6) % 7
    const weekStart = addDaysToDateString(point.date, -offset)

    const existing = map.get(weekStart) ?? { scheduled: 0, completed: 0 }
    existing.scheduled += point.scheduled
    existing.completed += point.completed
    map.set(weekStart, existing)
  }

  const result: {
    weekStart: string
    scheduled: number
    completed: number
    rate: number | null
  }[] = []

  for (const [weekStart, totals] of map.entries()) {
    const rate =
      totals.scheduled === 0
        ? null
        : Math.round((totals.completed / totals.scheduled) * 100)
    result.push({
      weekStart,
      scheduled: totals.scheduled,
      completed: totals.completed,
      rate,
    })
  }

  return result
}

export function summarizeRange(points: DailyPoint[]): {
  scheduled: number
  completed: number
  rate: number | null
  perfectDays: number
} {
  let scheduled = 0
  let completed = 0
  let perfectDays = 0

  for (const point of points) {
    scheduled += point.scheduled
    completed += point.completed
    if (point.scheduled > 0 && point.completed === point.scheduled) {
      perfectDays++
    }
  }

  const rate =
    scheduled === 0 ? null : Math.round((completed / scheduled) * 100)

  return {
    scheduled,
    completed,
    rate,
    perfectDays,
  }
}

export function calculateHabitBreakdown(
  habits: HabitInput[],
  logsByHabit: Record<string, string[]>,
  startDate: string,
  today: string
): {
  id: string
  name: string
  color: string
  scheduled: number
  completed: number
  rate: number | null
}[] {
  const result: {
    id: string
    name: string
    color: string
    scheduled: number
    completed: number
    rate: number | null
  }[] = []

  for (const habit of habits) {
    const habitLogs = logsByHabit[habit.id] ?? []
    let scheduled = 0
    let completed = 0
    let currentDateStr = startDate

    while (currentDateStr <= today) {
      const weekday = getLocalWeekday(parseLocalDateString(currentDateStr))
      const isScheduled =
        habit.frequency.includes(weekday) && currentDateStr >= habit.createdOn
      const isCompleted = habitLogs.includes(currentDateStr)

      if (currentDateStr === today && !isCompleted) {
        currentDateStr = addDaysToDateString(currentDateStr, 1)
        continue
      }

      if (isScheduled) {
        scheduled++
        if (isCompleted) {
          completed++
        }
      }

      currentDateStr = addDaysToDateString(currentDateStr, 1)
    }

    const rate =
      scheduled === 0 ? null : Math.round((completed / scheduled) * 100)

    result.push({
      id: habit.id,
      name: habit.name,
      color: habit.color,
      scheduled,
      completed,
      rate,
    })
  }

  result.sort((a, b) => {
    if (a.rate === null && b.rate === null) return 0
    if (a.rate === null) return 1
    if (b.rate === null) return -1
    return b.rate - a.rate
  })

  return result
}

export function getWeekdayTotals(
  habits: HabitInput[],
  logsByHabit: Record<string, string[]>,
  windowDays: number,
  today: string
): WeekdayRate[] {
  const totals: Record<number, { scheduled: number; completed: number }> = {
    1: { scheduled: 0, completed: 0 },
    2: { scheduled: 0, completed: 0 },
    3: { scheduled: 0, completed: 0 },
    4: { scheduled: 0, completed: 0 },
    5: { scheduled: 0, completed: 0 },
    6: { scheduled: 0, completed: 0 },
    0: { scheduled: 0, completed: 0 },
  }

  for (const habit of habits) {
    const habitLogs = logsByHabit[habit.id] ?? []
    const rates = calculateWeekdayRates(
      habitLogs,
      habit.frequency,
      habit.createdOn,
      today,
      windowDays
    )
    for (const r of rates) {
      totals[r.weekday].scheduled += r.scheduled
      totals[r.weekday].completed += r.completed
    }
  }

  const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
  return WEEKDAY_ORDER.map((weekday) => {
    const { scheduled, completed } = totals[weekday]
    const rate =
      scheduled === 0 ? null : Math.round((completed / scheduled) * 100)
    return { weekday, scheduled, completed, rate }
  })
}

export interface BuildHighlightsArgs {
  habits: HabitInput[]
  logsByHabit: Record<string, string[]>
  days?: number
  windowDays?: number
  range?: number
  rangeDays?: number
  today: string
  habitBreakdown?: {
    id: string
    name: string
    scheduled: number
    completed: number
    rate: number | null
  }[]
  weekdayTotals?: WeekdayRate[]
  currentSummary?: {
    scheduled: number
    completed: number
    rate: number | null
  }
  previousSummary?: {
    scheduled: number
    completed: number
    rate: number | null
  }
}

export function buildHighlights(args: BuildHighlightsArgs): string[] {
  const { habits, logsByHabit, today } = args
  const days =
    args.days ?? args.windowDays ?? args.range ?? args.rangeDays ?? 30
  const startDate = addDaysToDateString(today, -(days - 1))
  const breakdown =
    args.habitBreakdown ??
    calculateHabitBreakdown(habits, logsByHabit, startDate, today)

  const sentences: string[] = []

  const eligibleHabits = breakdown.filter(
    (h) => h.scheduled >= 3 && h.rate !== null
  )

  if (eligibleHabits.length >= 1) {
    const best = eligibleHabits[0]
    sentences.push(`Best habit: ${best.name}, ${best.rate}%.`)

    if (eligibleHabits.length >= 2) {
      const lowest = eligibleHabits[eligibleHabits.length - 1]
      if (lowest.rate !== best.rate) {
        sentences.push(`Needs attention: ${lowest.name}, ${lowest.rate}%.`)
      }
    }
  }

  const weekdayRates =
    args.weekdayTotals ?? getWeekdayTotals(habits, logsByHabit, days, today)
  const { best: bestDay, worst: worstDay } =
    getBestAndWorstWeekday(weekdayRates)

  if (bestDay && worstDay && bestDay.weekday !== worstDay.weekday) {
    sentences.push(
      `Strongest on ${WEEKDAY_PLURALS[bestDay.weekday]} at ${bestDay.rate}%, weakest on ${WEEKDAY_PLURALS[worstDay.weekday]} at ${worstDay.rate}%.`
    )
  } else if (bestDay) {
    sentences.push(
      `Strongest on ${WEEKDAY_PLURALS[bestDay.weekday]} at ${bestDay.rate}%.`
    )
  }

  const curSummary =
    args.currentSummary ??
    summarizeRange(buildDailyCompletion(habits, logsByHabit, startDate, today))

  const prevEndDate = addDaysToDateString(startDate, -1)
  const prevStartDate = addDaysToDateString(prevEndDate, -(days - 1))
  const prevSummary =
    args.previousSummary ??
    summarizeRange(
      buildDailyCompletion(habits, logsByHabit, prevStartDate, prevEndDate)
    )

  if (
    curSummary.scheduled > 0 &&
    prevSummary.scheduled > 0 &&
    curSummary.rate !== null &&
    prevSummary.rate !== null
  ) {
    const diff = curSummary.rate - prevSummary.rate
    if (diff > 0) {
      sentences.push(`Up ${diff} points on the previous ${days} days.`)
    } else if (diff < 0) {
      sentences.push(
        `Down ${Math.abs(diff)} points on the previous ${days} days.`
      )
    } else {
      sentences.push(`Same as the previous ${days} days.`)
    }
  }

  if (sentences.length === 0) {
    return [
      "Not enough history yet. Check in for a few days and this fills in.",
    ]
  }

  return sentences
}
