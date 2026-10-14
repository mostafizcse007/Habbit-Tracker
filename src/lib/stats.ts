import {
  addDaysToDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "./dates"

export interface WeekdayRate {
  weekday: number
  scheduled: number
  completed: number
  rate: number | null
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function calculateWeekdayRates(
  logDates: string[],
  frequency: number[],
  createdOn: string,
  today: string,
  windowDays: number
): WeekdayRate[] {
  const logSet = new Set(logDates)
  const scheduledCounts: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    0: 0,
  }
  const completedCounts: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    0: 0,
  }

  const windowStartCandidate = addDaysToDateString(today, -(windowDays - 1))
  let currentDateStr =
    windowStartCandidate > createdOn ? windowStartCandidate : createdOn

  while (currentDateStr <= today) {
    const weekday = getLocalWeekday(parseLocalDateString(currentDateStr))
    if (frequency.includes(weekday)) {
      scheduledCounts[weekday]++
      if (logSet.has(currentDateStr)) {
        completedCounts[weekday]++
      }
    }
    currentDateStr = addDaysToDateString(currentDateStr, 1)
  }

  return WEEKDAY_ORDER.map((weekday) => {
    const scheduled = scheduledCounts[weekday]
    const completed = completedCounts[weekday]
    const rate =
      scheduled === 0 ? null : Math.round((completed / scheduled) * 100)
    return {
      weekday,
      scheduled,
      completed,
      rate,
    }
  })
}

export function getBestAndWorstWeekday(
  rates: WeekdayRate[],
  minScheduled = 3
): { best: WeekdayRate | null; worst: WeekdayRate | null } {
  const eligible = rates.filter(
    (entry) => entry.scheduled >= minScheduled && entry.rate !== null
  )

  if (eligible.length === 0) {
    return { best: null, worst: null }
  }

  if (eligible.length === 1) {
    return { best: eligible[0], worst: null }
  }

  let best = eligible[0]
  let worst = eligible[0]

  for (const entry of eligible) {
    if (entry.rate! > best.rate!) {
      best = entry
    }
    if (entry.rate! < worst.rate!) {
      worst = entry
    }
  }

  return { best, worst }
}
