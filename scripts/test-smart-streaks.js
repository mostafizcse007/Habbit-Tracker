// Helper date functions matching src/lib/dates.ts
function parseLocalDateString(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function getLocalWeekday(date) {
  const day = date.getDay()
  return day === 0 ? 7 : day // 1 (Mon) - 7 (Sun)
}

function addDaysToDateString(dateStr, days) {
  const date = parseLocalDateString(dateStr)
  date.setDate(date.getDate() + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function calculateSmartStreaks(logDates, frequency, today, createdOn) {
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

  // 1. Calculate traditional raw current streak (walking backwards from today)
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
    // Today scheduled but not yet completed
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
  }

  // 2. Calculate smart current streak with 1 Grace Day per rolling 7 days
  // We walk backward from today:
  let smartCurrent = 0
  let graceUsedThisWeek = false
  let activeGraceDate = null
  let pendingGraceDate = null
  let pendingGraceCount = 0

  checkDate = today
  if (logSet.has(today)) {
    smartCurrent++
    checkDate = addDaysToDateString(today, -1)
  } else {
    // If today is scheduled and not logged, today is still pending (not counted as missed yet if user is checking in today)
    checkDate = addDaysToDateString(today, -1)
  }

  // 7-day cutoff for "grace used this week"
  const weekCutoff = addDaysToDateString(today, -6)

  while (true) {
    if (createdOn && checkDate < createdOn) break

    const weekday = getLocalWeekday(parseLocalDateString(checkDate))
    if (frequency.includes(weekday)) {
      if (logSet.has(checkDate)) {
        if (pendingGraceDate) {
          // The grace day successfully bridged to previous completed days!
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
          // Potential grace day: allow it if it bridges to an earlier completed day
          pendingGraceDate = checkDate
          pendingGraceCount = 1 // count the grace day towards the streak run
        } else {
          // Second missed day: streak breaks here
          break
        }
      }
    }
    checkDate = addDaysToDateString(checkDate, -1)
  }

  // 3. Calculate 30-day Momentum Score (weighted 60% recent 7 days, 40% prior 23 days)
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

  const recentRate = recentScheduled > 0 ? (recentCompleted / recentScheduled) * 100 : 100
  const priorRate = priorScheduled > 0 ? (priorCompleted / priorScheduled) * 100 : recentRate
  const momentumScore = Math.round(recentRate * 0.6 + priorRate * 0.4)

  let momentumLabel = "Starting"
  if (momentumScore >= 90) momentumLabel = "Unstoppable"
  else if (momentumScore >= 75) momentumLabel = "Strong"
  else if (momentumScore >= 50) momentumLabel = "Building"

  return {
    current: Math.max(smartCurrent, rawCurrent),
    longest: Math.max(smartCurrent, rawCurrent),
    rawCurrent,
    graceUsedThisWeek,
    graceDate: activeGraceDate,
    momentumScore,
    momentumLabel,
  }
}

// Test Case 1: Daily habit (1-7), completed today (Oct 20), missed yesterday (Oct 19), completed Oct 14-18
const today = "2026-10-20"
const logs1 = [
  "2026-10-20", // today completed
  // missed 2026-10-19
  "2026-10-18",
  "2026-10-17",
  "2026-10-16",
  "2026-10-15",
  "2026-10-14",
]
const res1 = calculateSmartStreaks(logs1, [1, 2, 3, 4, 5, 6, 7], today, "2026-10-01")
console.log("Test 1 (Missed yesterday, bridged to 5 days before):", res1)

// Test Case 2: Missed 2 days in a row (Oct 19 and Oct 18 missed, only today done)
const logs2 = [
  "2026-10-20",
  // missed 2026-10-19
  // missed 2026-10-18
  "2026-10-17",
]
const res2 = calculateSmartStreaks(logs2, [1, 2, 3, 4, 5, 6, 7], today, "2026-10-01")
console.log("Test 2 (Missed 2 days in a row, only today completed):", res2)

// Test Case 3: Perfect 7 days (no grace needed)
const logs3 = [
  "2026-10-20",
  "2026-10-19",
  "2026-10-18",
  "2026-10-17",
  "2026-10-16",
  "2026-10-15",
  "2026-10-14",
]
const res3 = calculateSmartStreaks(logs3, [1, 2, 3, 4, 5, 6, 7], today, "2026-10-01")
console.log("Test 3 (Perfect 7 days, grace should be false):", res3)

// Test Case 4: Today not logged yet, but yesterday was missed, day before was logged
const logs4 = [
  // today not done yet
  // missed Oct 19
  "2026-10-18",
  "2026-10-17",
  "2026-10-16",
]
const res4 = calculateSmartStreaks(logs4, [1, 2, 3, 4, 5, 6, 7], today, "2026-10-01")
console.log("Test 4 (Today not logged yet, missed yesterday, bridged to prior):", res4)

