import test from "node:test"
import assert from "node:assert/strict"

function parseLocalDateString(dateStr) {
  const [yearStr, monthStr, dayStr] = dateStr.split("-")
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
}

function getLocalWeekday(date = new Date()) {
  return date.getDay()
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDaysToDateString(dateStr, days) {
  const date = parseLocalDateString(dateStr)
  date.setDate(date.getDate() + days)
  return getLocalDateString(date)
}

function calculateStreaks(logDates, frequency, today, createdOn) {
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

  while (true) {
    if (createdOn && checkDate < createdOn) break
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

  // 3. 30-Day Momentum Score
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

  let momentumLabel = "Starting"
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

function calculateCompletionRate(logDates, frequency, createdOn, today, windowDays) {
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

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAYS = [1, 2, 3, 4, 5]

test("calculateStreaks: returns 0 and Starting tier for empty log history", () => {
  const result = calculateStreaks([], EVERY_DAY, "2026-10-21")
  assert.equal(result.current, 0)
  assert.equal(result.longest, 0)
  assert.equal(result.rawCurrent, 0)
  assert.equal(result.graceUsedThisWeek, false)
  assert.equal(result.momentumScore, 0)
  assert.equal(result.momentumLabel, "Starting")
})

test("calculateStreaks: calculates perfect daily streak without triggering grace day", () => {
  const logs = [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
  ]
  // Created on Oct 15 -> 7/7 days completed -> 100% momentum -> Unstoppable
  const result = calculateStreaks(logs, EVERY_DAY, "2026-10-21", "2026-10-15")
  assert.equal(result.current, 7)
  assert.equal(result.longest, 7)
  assert.equal(result.rawCurrent, 7)
  assert.equal(result.graceUsedThisWeek, false)
  assert.equal(result.graceDate, null)
  assert.equal(result.momentumScore, 100)
  assert.equal(result.momentumLabel, "Unstoppable")
})

test("calculateStreaks: momentum score weights recent 7 days (60%) vs prior history (40%)", () => {
  const logs = [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
  ]
  // Created on Oct 1 -> 7 recent days completed (100% * 0.6 = 60), 0 prior completed (0% * 0.4 = 0) -> score 60 -> Building
  const result = calculateStreaks(logs, EVERY_DAY, "2026-10-21", "2026-10-01")
  assert.equal(result.momentumScore, 60)
  assert.equal(result.momentumLabel, "Building")
})

test("calculateStreaks: unchecking past day earlier in current week recalculates and breaks current streak", () => {
  // Before unchecking: Oct 15-20 were checked. Today is Oct 21 (open).
  const logsBefore = [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
    "2026-10-20",
  ]
  const beforeResult = calculateStreaks(logsBefore, EVERY_DAY, "2026-10-21", "2026-10-01")
  assert.equal(beforeResult.current, 6)
  assert.equal(beforeResult.longest, 6)

  // Unchecking Tuesday Oct 20:
  const logsAfter = [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
    // 2026-10-20 unchecked!
  ]
  const afterResult = calculateStreaks(logsAfter, EVERY_DAY, "2026-10-21", "2026-10-01")
  // Since yesterday Oct 20 was unchecked/missed, current streak is 0 (NOT stuck at 6)
  assert.equal(afterResult.current, 0)
  assert.equal(afterResult.rawCurrent, 0)
  // Longest contiguous chain in history was Oct 15-19 (5 days)
  assert.equal(afterResult.longest, 5)
})

test("calculateStreaks: unchecking past day when today is completed decrements streak to today's contiguous run", () => {
  // Oct 15-21 checked (7 days). Uncheck Oct 20 (yesterday).
  const logs = [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
    // 2026-10-20 unchecked
    "2026-10-21", // today
  ]
  const result = calculateStreaks(logs, EVERY_DAY, "2026-10-21", "2026-10-01")
  assert.equal(result.current, 1)
  assert.equal(result.rawCurrent, 1)
  assert.equal(result.longest, 5) // Oct 15-19
})

test("calculateStreaks: unchecking today decrements current streak to unbroken run ending yesterday", () => {
  // Oct 15-20 were checked. Today is Oct 20.
  // Unchecking today Oct 20:
  const logs = [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
  ]
  const result = calculateStreaks(logs, EVERY_DAY, "2026-10-20", "2026-10-01")
  assert.equal(result.current, 5)
  assert.equal(result.longest, 5)
})

test("calculateStreaks: re-checking previously unchecked day restores contiguous streak", () => {
  const logsRestored = [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
    "2026-10-20",
  ]
  const result = calculateStreaks(logsRestored, EVERY_DAY, "2026-10-21", "2026-10-01")
  assert.equal(result.current, 6)
  assert.equal(result.longest, 6)
})

test("calculateStreaks: Weekdays habit ignores unscheduled weekend days", () => {
  // 2026-10-16 was Friday (5)
  // 2026-10-17 was Saturday (6) - unscheduled
  // 2026-10-18 was Sunday (0) - unscheduled
  // 2026-10-19 was Monday (1)
  // 2026-10-20 was Tuesday (2)
  // 2026-10-21 was Wednesday (3)
  const logs = ["2026-10-16", "2026-10-19", "2026-10-20", "2026-10-21"]
  const result = calculateStreaks(logs, WEEKDAYS, "2026-10-21", "2026-10-01")
  assert.equal(result.current, 4)
  assert.equal(result.rawCurrent, 4)
  assert.equal(result.graceUsedThisWeek, false)
})

test("calculateCompletionRate: returns accurate percentage over rolling window", () => {
  // 7-day window on daily habit with 5 completed days
  const logs = [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
  ]
  const stats = calculateCompletionRate(logs, EVERY_DAY, "2026-10-01", "2026-10-21", 7)
  assert.equal(stats.scheduled, 7)
  assert.equal(stats.completed, 5)
  assert.equal(stats.rate, 71) // Math.round(5/7 * 100) = 71
})
