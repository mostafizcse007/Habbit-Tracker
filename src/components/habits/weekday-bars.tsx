"use client"

import type { Habit } from "@/types"
import { getLocalDateString } from "@/lib/dates"
import { calculateWeekdayRates, getBestAndWorstWeekday } from "@/lib/stats"
import { WeekdayBarChart } from "./weekday-bar-chart"

interface WeekdayBarsProps {
  habit: Habit
  logs: string[]
  today: string
}

const WEEKDAY_DATA: Record<
  number,
  { short: string; full: string; plural: string }
> = {
  1: { short: "Mon", full: "Monday", plural: "Mondays" },
  2: { short: "Tue", full: "Tuesday", plural: "Tuesdays" },
  3: { short: "Wed", full: "Wednesday", plural: "Wednesdays" },
  4: { short: "Thu", full: "Thursday", plural: "Thursdays" },
  5: { short: "Fri", full: "Friday", plural: "Fridays" },
  6: { short: "Sat", full: "Saturday", plural: "Saturdays" },
  0: { short: "Sun", full: "Sunday", plural: "Sundays" },
}

export function WeekdayBars({ habit, logs, today }: WeekdayBarsProps) {
  const createdOn = getLocalDateString(new Date(habit.created_at))
  const rates = calculateWeekdayRates(logs, habit.frequency, createdOn, today, 90)
  const { best, worst } = getBestAndWorstWeekday(rates, 3)

  let summaryText = "Not enough history yet."
  if (best && worst) {
    summaryText = `Strongest on ${WEEKDAY_DATA[best.weekday].plural} at ${best.rate}%, weakest on ${WEEKDAY_DATA[worst.weekday].plural} at ${worst.rate}%.`
  } else if (best) {
    summaryText = `Strongest on ${WEEKDAY_DATA[best.weekday].plural} at ${best.rate}%.`
  }

  return (
    <WeekdayBarChart
      rates={rates}
      color={habit.color}
      caption={summaryText}
      daysLabel="Last 90 days"
      isScheduled={(weekday) => habit.frequency.includes(weekday)}
    />
  )
}
