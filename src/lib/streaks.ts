import {
  addDaysToDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "./dates"

export function calculateStreaks(
  logDates: string[],
  frequency: number[],
  today: string
): { current: number; longest: number } {
  const logSet = new Set(logDates)
  if (logSet.size === 0) {
    return { current: 0, longest: 0 }
  }

  const sortedDates = [...logDates].sort()
  const earliest = sortedDates[0]

  if (earliest > today) {
    return { current: 0, longest: 0 }
  }

  let run = 0
  let longest = 0
  let currentDateStr = earliest

  while (currentDateStr <= today) {
    const weekday = getLocalWeekday(parseLocalDateString(currentDateStr))
    const isRelevant = frequency.includes(weekday) || logSet.has(currentDateStr)

    if (isRelevant) {
      if (logSet.has(currentDateStr)) {
        run++
        if (run > longest) {
          longest = run
        }
      } else {
        if (currentDateStr !== today) {
          run = 0
        }
      }
    }

    currentDateStr = addDaysToDateString(currentDateStr, 1)
  }

  return { current: run, longest }
}

export function calculateCompletionRate(
  logDates: string[],
  frequency: number[],
  createdOn: string,
  today: string,
  windowDays: number
): { completed: number; scheduled: number; rate: number | null } {
  const logSet = new Set(logDates)
  let scheduled = 0
  let completed = 0

  const windowStartCandidate = addDaysToDateString(today, -(windowDays - 1))
  let currentDateStr =
    windowStartCandidate > createdOn ? windowStartCandidate : createdOn

  while (currentDateStr <= today) {
    const weekday = getLocalWeekday(parseLocalDateString(currentDateStr))
    if (frequency.includes(weekday)) {
      scheduled++
      if (logSet.has(currentDateStr)) {
        completed++
      }
    }
    currentDateStr = addDaysToDateString(currentDateStr, 1)
  }

  const rate =
    scheduled === 0 ? null : Math.round((completed / scheduled) * 100)

  return { completed, scheduled, rate }
}
