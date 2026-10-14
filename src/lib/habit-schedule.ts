const ORDER = [1, 2, 3, 4, 5, 6, 0]

const DAY_NAMES: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  0: "Sun",
}

export function formatSchedule(frequency: number[]): string {
  if (frequency.length === 7) {
    return "Every day"
  }

  if (
    frequency.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => frequency.includes(d))
  ) {
    return "Weekdays"
  }

  if (
    frequency.length === 2 &&
    [0, 6].every((d) => frequency.includes(d))
  ) {
    return "Weekends"
  }

  return ORDER.filter((d) => frequency.includes(d))
    .map((d) => DAY_NAMES[d])
    .join(", ")
}
