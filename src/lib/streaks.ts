import {
  addDaysToDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "./dates"

export type MomentumTier = "Unstoppable" | "Strong" | "Building" | "Starting"

export interface StreakResult {
  current: number
  longest: number
  rawCurrent: number
  graceUsedThisWeek: boolean
  graceDate: string | null
  momentumScore: number
  momentumLabel: MomentumTier
}

export function calculateStreaks(
  logDates: string[],
  frequency: number[],
  today: string,
  createdOn?: string
): StreakResult {
  const logSet = new Set(logDates)
  if (logSet.size === 0) {
    return {
      current: 0,
      longest: 0,
      rawCurrent: 0,
      graceUsedThisWeek: false,
      graceDate: null,
      momentumScore: 0,
      momentumLabel: "Starting",
    }
  }

  const sortedDates = [...logDates].sort()
  const earliest = sortedDates[0]

  if (earliest > today) {
    return {
      current: 0,
      longest: 0,
      rawCurrent: 0,
      graceUsedThisWeek: false,
      graceDate: null,
      momentumScore: 0,
      momentumLabel: "Starting",
    }
  }

  // 1. Calculate contiguous current streak (walking backward from today)
  let currentStreak = 0
  let checkDate = today
  const todayWeekday = getLocalWeekday(parseLocalDateString(today))
  const todayScheduled = frequency.includes(todayWeekday)

  if (logSet.has(today)) {
    currentStreak++
    checkDate = addDaysToDateString(today, -1)
  } else if (!todayScheduled) {
    // Today is not scheduled, streak carries over from last scheduled day
    checkDate = addDaysToDateString(today, -1)
  } else {
    // Today is scheduled but not checked off yet
    // Today remains open; check contiguous streak ending on yesterday / prior scheduled days
    checkDate = addDaysToDateString(today, -1)
  }

  const effectiveCreatedOn =
    createdOn && earliest < createdOn ? earliest : createdOn

  while (true) {
    if (effectiveCreatedOn && checkDate < effectiveCreatedOn) break
    if (checkDate < earliest) break

    const weekday = getLocalWeekday(parseLocalDateString(checkDate))
    const isScheduled = frequency.includes(weekday)
    const isCompleted = logSet.has(checkDate)

    if (isScheduled) {
      if (isCompleted) {
        currentStreak++
      } else {
        // Scheduled day was missed or unchecked: contiguous streak breaks!
        break
      }
    } else if (isCompleted) {
      // Bonus completion on an unscheduled day
      currentStreak++
    }

    checkDate = addDaysToDateString(checkDate, -1)
  }

  // 2. Calculate longest contiguous streak across history (forward pass from earliest up to today)
  let run = 0
  let historicalLongest = 0
  let currentDateStr = earliest

  while (currentDateStr <= today) {
    const weekday = getLocalWeekday(parseLocalDateString(currentDateStr))
    const isScheduled = frequency.includes(weekday)
    const isCompleted = logSet.has(currentDateStr)

    if (isCompleted) {
      run++
      if (run > historicalLongest) {
        historicalLongest = run
      }
    } else if (isScheduled) {
      if (currentDateStr !== today) {
        run = 0
      }
    }

    currentDateStr = addDaysToDateString(currentDateStr, 1)
  }

  const longestStreak = Math.max(historicalLongest, currentStreak)

  // 3. Calculate 30-Day Momentum Score (weighted 60% recent 7 days, 40% prior 23 days)
  let recentCompleted = 0
  let recentScheduled = 0
  let priorCompleted = 0
  let priorScheduled = 0

  for (let i = 0; i < 30; i++) {
    const d = addDaysToDateString(today, -i)
    if (effectiveCreatedOn && d < effectiveCreatedOn) break
    const weekday = getLocalWeekday(parseLocalDateString(d))
    if (frequency.includes(weekday)) {
      if (i < 7) {
        recentScheduled++
        if (logSet.has(d)) recentCompleted++
      } else {
        priorScheduled++
        if (logSet.has(d)) priorCompleted++
      }
    }
  }

  const recentRate =
    recentScheduled > 0 ? (recentCompleted / recentScheduled) * 100 : 100
  const priorRate =
    priorScheduled > 0 ? (priorCompleted / priorScheduled) * 100 : recentRate
  const momentumScore = Math.round(recentRate * 0.6 + priorRate * 0.4)

  let momentumLabel: MomentumTier = "Starting"
  if (momentumScore >= 90) momentumLabel = "Unstoppable"
  else if (momentumScore >= 75) momentumLabel = "Strong"
  else if (momentumScore >= 50) momentumLabel = "Building"

  return {
    current: currentStreak,
    longest: longestStreak,
    rawCurrent: currentStreak,
    graceUsedThisWeek: false,
    graceDate: null,
    momentumScore,
    momentumLabel,
  }
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

  const sorted = [...logDates].sort()
  const effectiveCreatedOn =
    sorted.length > 0 && sorted[0] < createdOn ? sorted[0] : createdOn

  const windowStartCandidate = addDaysToDateString(today, -(windowDays - 1))
  let currentDateStr =
    windowStartCandidate > effectiveCreatedOn ? windowStartCandidate : effectiveCreatedOn

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
