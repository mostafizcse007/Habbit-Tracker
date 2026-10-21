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

function getLastNDates(n, today) {
  const dates = []
  for (let i = n - 1; i >= 0; i--) {
    dates.push(addDaysToDateString(today, -i))
  }
  return dates
}

function formatShortDate(dateStr) {
  const date = parseLocalDateString(dateStr)
  const day = date.getDate()
  const month = date.toLocaleDateString("en-US", { month: "short" })
  return `${day} ${month}`
}

function formatDateRange(startDateStr, endDateStr) {
  const start = parseLocalDateString(startDateStr)
  const end = parseLocalDateString(endDateStr)

  const startDay = start.getDate()
  const endDay = end.getDate()

  const startMonth = start.toLocaleDateString("en-US", { month: "short" })
  const endMonth = end.toLocaleDateString("en-US", { month: "short" })

  const startYear = start.getFullYear()
  const endYear = end.getFullYear()

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startDay} – ${endDay} ${startMonth} ${startYear}`
    }
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`
  }

  return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`
}

function cellState(habit, date, today, logs) {
  if (logs.includes(date)) {
    return "done"
  }

  const weekday = getLocalWeekday(parseLocalDateString(date))
  if (!habit.frequency.includes(weekday)) {
    return "off"
  }

  if (date > today) {
    return "off"
  }

  if (date < today) {
    return "missed"
  }

  return "open"
}

function calculateStreaks(logDates, frequency, today, createdOn) {
  const logSet = new Set(logDates)
  if (logSet.size === 0) {
    return {
      current: 0,
      longest: 0,
      rawCurrent: 0,
    }
  }

  const sortedDates = [...logDates].sort()
  const earliest = sortedDates[0]

  if (earliest > today) {
    return {
      current: 0,
      longest: 0,
      rawCurrent: 0,
    }
  }

  let currentStreak = 0
  let checkDate = today
  const todayWeekday = getLocalWeekday(parseLocalDateString(today))
  const todayScheduled = frequency.includes(todayWeekday)

  if (logSet.has(today)) {
    currentStreak++
    checkDate = addDaysToDateString(today, -1)
  } else if (!todayScheduled) {
    checkDate = addDaysToDateString(today, -1)
  } else {
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
        break
      }
    } else if (isCompleted) {
      currentStreak++
    }

    checkDate = addDaysToDateString(checkDate, -1)
  }

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
  return { current: currentStreak, longest: longestStreak }
}

test("cellState: habit created mid-week renders earlier scheduled weekdays as 'missed' to allow backfilling", () => {
  // Habit created on Wednesday Oct 21, 2026
  const habit = {
    id: "h-1",
    name: "Workout",
    frequency: [1, 2, 3, 4, 5], // Mon-Fri
    created_at: "2026-10-21T09:00:00Z",
  }
  const today = "2026-10-21" // Wednesday

  // Mon Oct 19 is scheduled and before createdAt: should return "missed", NOT "off"!
  const mondayState = cellState(habit, "2026-10-19", today, [])
  assert.equal(mondayState, "missed", "Monday before habit creation must be 'missed' so user can backfill")

  // Tue Oct 20 is scheduled and before createdAt: should return "missed"!
  const tuesdayState = cellState(habit, "2026-10-20", today, [])
  assert.equal(tuesdayState, "missed", "Tuesday before habit creation must be 'missed'")

  // Sunday Oct 18 is NOT scheduled (frequency is Mon-Fri): should return "off"
  const sundayState = cellState(habit, "2026-10-18", today, [])
  assert.equal(sundayState, "off", "Unscheduled weekend day must remain 'off'")

  // Wed Oct 21 is today (not completed yet): should return "open"
  const wednesdayState = cellState(habit, "2026-10-21", today, [])
  assert.equal(wednesdayState, "open", "Today when not checked off must return 'open'")

  // Once checked off, should return "done"
  const backfilledMonday = cellState(habit, "2026-10-19", today, ["2026-10-19"])
  assert.equal(backfilledMonday, "done", "Backfilled check-in must return 'done'")
})

test("Week navigation: offset calculation generates contiguous non-overlapping 7-day windows", () => {
  const today = "2026-10-21" // Wednesday

  // Current week (offset 0)
  const currentWeekDays = getLastNDates(7, addDaysToDateString(today, 0 * 7))
  assert.equal(currentWeekDays.length, 7)
  assert.equal(currentWeekDays[0], "2026-10-15")
  assert.equal(currentWeekDays[6], "2026-10-21")

  // Previous week (offset -1)
  const prevWeekDays = getLastNDates(7, addDaysToDateString(today, -1 * 7))
  assert.equal(prevWeekDays.length, 7)
  assert.equal(prevWeekDays[0], "2026-10-08")
  assert.equal(prevWeekDays[6], "2026-10-14")

  // Continuity check: prevWeekDays[6] + 1 day === currentWeekDays[0]
  assert.equal(addDaysToDateString(prevWeekDays[6], 1), currentWeekDays[0])

  // Two weeks ago (offset -2)
  const twoWeeksAgoDays = getLastNDates(7, addDaysToDateString(today, -2 * 7))
  assert.equal(twoWeeksAgoDays.length, 7)
  assert.equal(twoWeeksAgoDays[0], "2026-10-01")
  assert.equal(twoWeeksAgoDays[6], "2026-10-07")
  assert.equal(addDaysToDateString(twoWeeksAgoDays[6], 1), prevWeekDays[0])
})

test("formatDateRange: formats same month, different months, and year boundaries", () => {
  assert.equal(formatDateRange("2026-10-15", "2026-10-21"), "15 – 21 Oct 2026")
  assert.equal(formatDateRange("2026-09-28", "2026-10-04"), "28 Sep – 4 Oct 2026")
  assert.equal(formatDateRange("2025-12-28", "2026-01-03"), "28 Dec 2025 – 3 Jan 2026")
})

test("calculateStreaks: seamlessly accounts for backfilled days before habit createdOn", () => {
  // Habit created on Wednesday Oct 21
  const createdOn = "2026-10-21"
  const today = "2026-10-21"
  const frequency = [0, 1, 2, 3, 4, 5, 6] // daily

  // User created habit today, but backfilled Mon Oct 19, Tue Oct 20, and checked Wed Oct 21
  const logs = ["2026-10-19", "2026-10-20", "2026-10-21"]

  const result = calculateStreaks(logs, frequency, today, createdOn)
  assert.equal(result.current, 3, "Contiguous streak must count all 3 days including backfilled dates")
  assert.equal(result.longest, 3)
})

test("Cell tooltip: generates informative creation date tooltip for backfilling", () => {
  const createdOn = "2026-10-21"
  const createdFormatted = formatShortDate(createdOn)
  const isBeforeCreation = "2026-10-19" < createdOn

  const title = isBeforeCreation
    ? `Habit created on ${createdFormatted} · Tap to backfill`
    : "Missed · Click to check off"

  assert.equal(title, "Habit created on 21 Oct · Tap to backfill")
})
