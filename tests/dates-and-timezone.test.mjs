import test from "node:test"
import assert from "node:assert/strict"

// Date helpers mirroring src/lib/dates.ts
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getLocalWeekday(date = new Date()) {
  return date.getDay()
}

function parseLocalDateString(dateStr) {
  const [yearStr, monthStr, dayStr] = dateStr.split("-")
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
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

test("parseLocalDateString: parses YYYY-MM-DD into local Date object without UTC drift", () => {
  const parsed = parseLocalDateString("2026-10-21")
  assert.equal(parsed.getFullYear(), 2026)
  assert.equal(parsed.getMonth(), 9) // 0-indexed month: 9 = October
  assert.equal(parsed.getDate(), 21)
})

test("getLocalDateString: formats local date with leading zeros", () => {
  const date = new Date(2026, 0, 5) // Jan 5, 2026
  assert.equal(getLocalDateString(date), "2026-01-05")
})

test("addDaysToDateString: handles normal positive and negative addition", () => {
  assert.equal(addDaysToDateString("2026-10-15", 5), "2026-10-20")
  assert.equal(addDaysToDateString("2026-10-20", -5), "2026-10-15")
})

test("addDaysToDateString: handles leap year boundary correctly (2024)", () => {
  assert.equal(addDaysToDateString("2024-02-28", 1), "2024-02-29")
  assert.equal(addDaysToDateString("2024-02-29", 1), "2024-03-01")
})

test("addDaysToDateString: handles non-leap year boundary correctly (2025)", () => {
  assert.equal(addDaysToDateString("2025-02-28", 1), "2025-03-01")
})

test("addDaysToDateString: handles year-end boundary correctly (Dec 31 -> Jan 1)", () => {
  assert.equal(addDaysToDateString("2025-12-31", 1), "2026-01-01")
  assert.equal(addDaysToDateString("2026-01-01", -1), "2025-12-31")
})

test("getLastNDates: generates ordered list of previous N days including today", () => {
  const dates = getLastNDates(7, "2026-10-21")
  assert.equal(dates.length, 7)
  assert.equal(dates[0], "2026-10-15")
  assert.equal(dates[6], "2026-10-21")
})

test("getLocalWeekday: maps to standard JavaScript weekday indices (0=Sun, 1=Mon, ..., 6=Sat)", () => {
  // 2026-10-18 was Sunday (0)
  // 2026-10-19 was Monday (1)
  // 2026-10-20 was Tuesday (2)
  // 2026-10-24 is Saturday (6)
  assert.equal(getLocalWeekday(parseLocalDateString("2026-10-18")), 0)
  assert.equal(getLocalWeekday(parseLocalDateString("2026-10-19")), 1)
  assert.equal(getLocalWeekday(parseLocalDateString("2026-10-20")), 2)
  assert.equal(getLocalWeekday(parseLocalDateString("2026-10-24")), 6)
})
