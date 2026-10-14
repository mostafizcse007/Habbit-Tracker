export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getLocalWeekday(date = new Date()): number {
  return date.getDay()
}

export function parseLocalDateString(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split("-")
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const date = parseLocalDateString(dateStr)
  date.setDate(date.getDate() + days)
  return getLocalDateString(date)
}

export function getLastNDates(n: number, today: string): string[] {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    dates.push(addDaysToDateString(today, -i))
  }
  return dates
}
