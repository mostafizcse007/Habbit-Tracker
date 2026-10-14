export function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string") {
    return false
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function getTimeZoneList(): string[] {
  let list: string[] = []
  if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
    try {
      list = Intl.supportedValuesOf("timeZone")
    } catch {
      list = []
    }
  }
  if (!list.includes("UTC")) {
    list.push("UTC")
  }
  return [...new Set(list)].sort((a, b) => a.localeCompare(b))
}

export function getTodayInTimeZone(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}
