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

function buildDailyCompletion(habits, logsByHabit, startDate, today) {
  const result = []
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

    const rate = scheduled === 0 ? null : Math.round((completed / scheduled) * 100)
    result.push({ date: currentDateStr, scheduled, completed, rate })
    currentDateStr = addDaysToDateString(currentDateStr, 1)
  }
  return result
}

function evaluateAchievements(habits, logsByHabit, today) {
  const earned = new Set()

  if (habits.length === 0) {
    return { earned, totalCheckIns: 0, longestStreak: 0 }
  }

  let totalLogs = 0
  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    totalLogs += logs.length
  }

  if (totalLogs >= 1) earned.add("first_checkin")
  if (totalLogs >= 25) earned.add("checkins_25")
  if (totalLogs >= 100) earned.add("checkins_100")
  if (totalLogs >= 500) earned.add("checkins_500")

  let longestStreak = 0
  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    // Simple longest run calculation
    const sorted = [...logs].sort()
    let run = 0
    let longest = 0
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        run = 1
      } else {
        const prev = parseLocalDateString(sorted[i - 1])
        const cur = parseLocalDateString(sorted[i])
        const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000)
        if (diff === 1) {
          run++
        } else {
          run = 1
        }
      }
      if (run > longest) longest = run
    }
    if (longest > longestStreak) longestStreak = longest
  }

  if (longestStreak >= 7) earned.add("streak_7")
  if (longestStreak >= 30) earned.add("streak_30")
  if (longestStreak >= 100) earned.add("streak_100")

  let earliestCreatedOn = habits[0].createdOn
  for (const habit of habits) {
    if (habit.createdOn < earliestCreatedOn) earliestCreatedOn = habit.createdOn
  }

  const daily = buildDailyCompletion(habits, logsByHabit, earliestCreatedOn, today)

  let perfectWeekRun = 0
  for (const point of daily) {
    if (point.scheduled >= 3 && point.completed === point.scheduled) {
      earned.add("perfect_day")
    }

    if (point.scheduled === 0) continue

    if (point.completed === point.scheduled) {
      perfectWeekRun++
      if (perfectWeekRun >= 7) earned.add("perfect_week")
    } else {
      perfectWeekRun = 0
    }
  }

  const distinctDatesSet = new Set()
  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    for (const d of logs) distinctDatesSet.add(d)
  }

  const distinctDates = Array.from(distinctDatesSet).sort()
  for (let i = 1; i < distinctDates.length; i++) {
    const prevDate = parseLocalDateString(distinctDates[i - 1])
    const curDate = parseLocalDateString(distinctDates[i])
    const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / 86400000)
    if (diffDays >= 8) {
      earned.add("comeback")
      break
    }
  }

  return { earned, totalCheckIns: totalLogs, longestStreak }
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

test("evaluateAchievements: awards first_checkin when 1 check-in exists", () => {
  const habits = [{ id: "h1", name: "Read", color: "#6366f1", frequency: EVERY_DAY, createdOn: "2026-10-01" }]
  const logs = { h1: ["2026-10-21"] }
  const result = evaluateAchievements(habits, logs, "2026-10-21")
  assert.ok(result.earned.has("first_checkin"))
  assert.equal(result.totalCheckIns, 1)
})

test("evaluateAchievements: awards streak_7 when habit has 7 continuous days", () => {
  const habits = [{ id: "h1", name: "Exercise", color: "#10b981", frequency: EVERY_DAY, createdOn: "2026-10-01" }]
  const logs = {
    h1: [
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
    ],
  }
  const result = evaluateAchievements(habits, logs, "2026-10-21")
  assert.ok(result.earned.has("streak_7"))
})

test("evaluateAchievements: awards perfect_day when >=3 scheduled habits are completed", () => {
  const habits = [
    { id: "h1", name: "Habit 1", color: "#6366f1", frequency: EVERY_DAY, createdOn: "2026-10-01" },
    { id: "h2", name: "Habit 2", color: "#10b981", frequency: EVERY_DAY, createdOn: "2026-10-01" },
    { id: "h3", name: "Habit 3", color: "#f59e0b", frequency: EVERY_DAY, createdOn: "2026-10-01" },
  ]
  const logs = {
    h1: ["2026-10-20"],
    h2: ["2026-10-20"],
    h3: ["2026-10-20"],
  }
  const result = evaluateAchievements(habits, logs, "2026-10-21")
  assert.ok(result.earned.has("perfect_day"))
})

test("evaluateAchievements: awards comeback badge when checking in after 8+ days hiatus", () => {
  const habits = [{ id: "h1", name: "Journaling", color: "#8b5cf6", frequency: EVERY_DAY, createdOn: "2026-10-01" }]
  const logs = {
    h1: [
      "2026-10-01", // day 1
      // 10 days gap
      "2026-10-12", // returned on day 12
    ],
  }
  const result = evaluateAchievements(habits, logs, "2026-10-21")
  assert.ok(result.earned.has("comeback"))
})
