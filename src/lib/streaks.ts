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

  // 1. Calculate traditional longest streak (historical forward pass)
  let run = 0
  let historicalLongest = 0
  let currentDateStr = earliest

  while (currentDateStr <= today) {
    const weekday = getLocalWeekday(parseLocalDateString(currentDateStr))
    const isRelevant = frequency.includes(weekday) || logSet.has(currentDateStr)

    if (isRelevant) {
      if (logSet.has(currentDateStr)) {
        run++
        if (run > historicalLongest) {
          historicalLongest = run
        }
      } else {
        if (currentDateStr !== today) {
          run = 0
        }
      }
    }

    currentDateStr = addDaysToDateString(currentDateStr, 1)
  }

  // 2. Calculate raw current streak (walking backward from today)
  let rawCurrent = 0
  let checkDate = today
  const todayWeekday = getLocalWeekday(parseLocalDateString(today))
  const todayScheduled = frequency.includes(todayWeekday)

  if (logSet.has(today)) {
    rawCurrent++
    checkDate = addDaysToDateString(today, -1)
  } else if (!todayScheduled) {
    checkDate = addDaysToDateString(today, -1)
  } else {
    // Today scheduled but not checked off yet
    checkDate = addDaysToDateString(today, -1)
  }

  while (true) {
    const weekday = getLocalWeekday(parseLocalDateString(checkDate))
    if (frequency.includes(weekday)) {
      if (logSet.has(checkDate)) {
        rawCurrent++
      } else {
        break
      }
    }
    checkDate = addDaysToDateString(checkDate, -1)
    if (createdOn && checkDate < createdOn) break
    if (checkDate < earliest) break
  }

  // 3. Smart current streak with 1 Grace Day per rolling 7 days
  let smartCurrent = 0
  let graceUsedThisWeek = false
  let activeGraceDate: string | null = null
  let pendingGraceDate: string | null = null
  let pendingGraceCount = 0

  checkDate = today
  if (logSet.has(today)) {
    smartCurrent++
    checkDate = addDaysToDateString(today, -1)
  } else {
    checkDate = addDaysToDateString(today, -1)
  }

  const weekCutoff = addDaysToDateString(today, -6)

  while (true) {
    if (createdOn && checkDate < createdOn) break
    if (checkDate < earliest && !pendingGraceDate) break

    const weekday = getLocalWeekday(parseLocalDateString(checkDate))
    if (frequency.includes(weekday)) {
      if (logSet.has(checkDate)) {
        if (pendingGraceDate) {
          // Grace bridged to earlier completed days!
          smartCurrent += pendingGraceCount + 1
          if (!activeGraceDate) {
            activeGraceDate = pendingGraceDate
            if (activeGraceDate >= weekCutoff) {
              graceUsedThisWeek = true
            }
          }
          pendingGraceDate = null
          pendingGraceCount = 0
        } else {
          smartCurrent++
        }
      } else {
        // Missed scheduled day
        if (!pendingGraceDate && !activeGraceDate) {
          // Potential grace day: allow if it bridges backwards
          pendingGraceDate = checkDate
          pendingGraceCount = 1
        } else {
          // Second missed scheduled day: streak terminates
          break
        }
      }
    }
    checkDate = addDaysToDateString(checkDate, -1)
  }

  const effectiveCurrent = Math.max(smartCurrent, rawCurrent)
  const longest = Math.max(historicalLongest, effectiveCurrent)

  // 4. Calculate 30-Day Momentum Score (weighted 60% recent 7 days, 40% prior 23 days)
  let recentCompleted = 0
  let recentScheduled = 0
  let priorCompleted = 0
  let priorScheduled = 0

  for (let i = 0; i < 30; i++) {
    const d = addDaysToDateString(today, -i)
    if (createdOn && d < createdOn) break
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
    current: effectiveCurrent,
    longest,
    rawCurrent,
    graceUsedThisWeek,
    graceDate: activeGraceDate,
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
