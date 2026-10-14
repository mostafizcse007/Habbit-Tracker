import {
  addDaysToDateString,
  getLocalDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "./dates"

export function buildHeatmapWeeks(
  today: string,
  weeks = 53
): (string | null)[][] {
  const todayDate = parseLocalDateString(today)
  const weekday = getLocalWeekday(todayDate)
  const offset = (weekday + 6) % 7
  const currentMonday = addDaysToDateString(today, -offset)
  const startMonday = addDaysToDateString(currentMonday, -7 * (weeks - 1))

  const result: (string | null)[][] = []

  for (let w = 0; w < weeks; w++) {
    const weekMonday = addDaysToDateString(startMonday, w * 7)
    const week: (string | null)[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = addDaysToDateString(weekMonday, d)
      if (dateStr > today) {
        week.push(null)
      } else {
        week.push(dateStr)
      }
    }
    result.push(week)
  }

  return result
}

export function getMonthLabel(dateStr: string): string {
  const date = parseLocalDateString(dateStr)
  return date.toLocaleDateString("en-US", { month: "short" })
}

export function formatLongDate(dateStr: string): string {
  const date = parseLocalDateString(dateStr)
  const day = date.getDate()
  const month = date.toLocaleDateString("en-US", { month: "short" })
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

export function buildMonthGrid(
  year: number,
  month: number
): (string | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayWeekday = getLocalWeekday(new Date(year, month, 1))
  const leadingCount = (firstDayWeekday + 6) % 7

  const entries: (string | null)[] = []
  for (let i = 0; i < leadingCount; i++) {
    entries.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    entries.push(getLocalDateString(new Date(year, month, day)))
  }

  const remainder = entries.length % 7
  if (remainder !== 0) {
    const trailingCount = 7 - remainder
    for (let i = 0; i < trailingCount; i++) {
      entries.push(null)
    }
  }

  const rows: (string | null)[][] = []
  for (let i = 0; i < entries.length; i += 7) {
    rows.push(entries.slice(i, i + 7))
  }

  return rows
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function getMonthTitle(year: number, month: number): string {
  const date = new Date(year, month, 1)
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}
