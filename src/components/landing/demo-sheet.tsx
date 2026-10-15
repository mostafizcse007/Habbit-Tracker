"use client"

import { useState, useSyncExternalStore } from "react"
import {
  addDaysToDateString,
  getLastNDates,
  getLocalDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "@/lib/dates"
import { formatSchedule } from "@/lib/habit-schedule"
import { calculateStreaks } from "@/lib/streaks"
import { WeekCell, type CellState } from "@/components/habits/week-cell"
import { Skeleton } from "@/components/ui/skeleton"

interface SampleHabitConfig {
  id: string
  name: string
  color: string
  frequency: number[]
  missOffsets: number[]
  todayDone: boolean
}

const SAMPLE_HABITS: SampleHabitConfig[] = [
  {
    id: "sample-1",
    name: "Solve 2 LeetCode problems",
    color: "#F97316",
    frequency: [1, 2, 3, 4, 5, 6, 0],
    missOffsets: [],
    todayDone: true,
  },
  {
    id: "sample-2",
    name: "Read 20 pages",
    color: "#3B82F6",
    frequency: [1, 2, 3, 4, 5, 6, 0],
    missOffsets: [4],
    todayDone: true,
  },
  {
    id: "sample-3",
    name: "Gym",
    color: "#10B981",
    frequency: [1, 3, 5, 6],
    missOffsets: [],
    todayDone: false,
  },
  {
    id: "sample-4",
    name: "Revise ML notes",
    color: "#8B5CF6",
    frequency: [1, 2, 3, 4, 5],
    missOffsets: [1],
    todayDone: false,
  },
  {
    id: "sample-5",
    name: "Sleep before 11:30",
    color: "#EC4899",
    frequency: [1, 2, 3, 4, 5, 6, 0],
    missOffsets: [5, 3],
    todayDone: false,
  },
]

function buildInitialLogs(
  todayStr: string,
  last7: string[]
): Record<string, string[]> {
  const initialLogs: Record<string, string[]> = {}

  for (const habit of SAMPLE_HABITS) {
    const habitLogs: string[] = []
    const missDates = new Set(
      habit.missOffsets.map((offset) => addDaysToDateString(todayStr, -offset))
    )

    for (const d of last7) {
      const weekday = getLocalWeekday(parseLocalDateString(d))
      const isScheduled = habit.frequency.includes(weekday)

      if (d < todayStr) {
        if (isScheduled && !missDates.has(d)) {
          habitLogs.push(d)
        }
      } else if (d === todayStr) {
        if (habit.todayDone) {
          habitLogs.push(d)
        }
      }
    }

    initialLogs[habit.id] = habitLogs
  }

  return initialLogs
}

const emptySubscribe = () => () => {}

function ActiveDemoSheet() {
  const today = getLocalDateString()
  const days = getLastNDates(7, today)
  const [logsByHabit, setLogsByHabit] = useState<Record<string, string[]>>(() =>
    buildInitialLogs(today, days)
  )

  const dayDetails = days.map((date) => {
    const d = parseLocalDateString(date)
    const weekdayShort = d.toLocaleDateString("en-US", { weekday: "short" })
    const weekdayInitial = weekdayShort[0]
    const weekdayLong = d.toLocaleDateString("en-US", { weekday: "long" })
    const dayNum = d.getDate()
    const isToday = date === today

    return {
      date,
      weekdayShort,
      weekdayInitial,
      weekdayLong,
      dayNum,
      isToday,
    }
  })

  function getCellState(
    habit: SampleHabitConfig,
    date: string,
    logs: string[]
  ): CellState {
    if (logs.includes(date)) {
      return "done"
    }
    const weekday = getLocalWeekday(parseLocalDateString(date))
    if (!habit.frequency.includes(weekday)) {
      return "off"
    }
    if (date < today) {
      return "missed"
    }
    return "open"
  }

  function handleToggle(habitId: string, date: string) {
    setLogsByHabit((prev) => {
      const current = prev[habitId] ?? []
      const next = current.includes(date)
        ? current.filter((d) => d !== date)
        : [...current, date]
      return { ...prev, [habitId]: next }
    })
  }

  return (
    <div className="w-full">
      <div className="bg-card border border-border rounded-[14px] overflow-hidden">
        <div className="hidden md:block">
          <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,56px)_96px] lg:grid-cols-[minmax(0,1fr)_repeat(7,64px)_112px] h-[76px] items-stretch">
            <div className="pl-6 flex items-center text-[14px] font-medium text-muted-foreground">
              Habit
            </div>
            {dayDetails.map(({ date, weekdayShort, dayNum, isToday }) => (
              <div
                key={date}
                className={`flex flex-col items-center justify-center gap-[2px] h-full ${
                  isToday ? "bg-highlight" : ""
                }`}
              >
                <span
                  className={`text-[13px] ${
                    isToday
                      ? "font-bold text-foreground"
                      : "font-medium text-muted-foreground"
                  }`}
                >
                  {weekdayShort}
                </span>
                <span
                  className={`text-[20px] tracking-[-0.02em] ${
                    isToday
                      ? "font-extrabold text-foreground"
                      : "font-semibold text-foreground"
                  }`}
                >
                  {dayNum}
                </span>
              </div>
            ))}
            <div className="pr-6 flex items-center justify-end text-[14px] font-medium text-muted-foreground">
              Streak
            </div>
          </div>

          {SAMPLE_HABITS.map((habit) => {
            const logs = logsByHabit[habit.id] ?? []
            const streak = calculateStreaks(logs, habit.frequency, today).current
            const scheduleText = formatSchedule(habit.frequency)

            return (
              <div
                key={habit.id}
                className="grid grid-cols-[minmax(0,1fr)_repeat(7,56px)_96px] lg:grid-cols-[minmax(0,1fr)_repeat(7,64px)_112px] min-h-[76px] border-t border-border items-stretch"
              >
                <div className="pl-6 pr-4 flex items-center gap-[14px] min-w-0">
                  <span
                    className="size-[10px] rounded-[3px] shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[17px] font-semibold tracking-[-0.01em] text-foreground truncate">
                      {habit.name}
                    </div>
                    <div className="text-[13px] text-muted-foreground mt-0.5 truncate">
                      {scheduleText}
                    </div>
                  </div>
                </div>

                {dayDetails.map(({ date, weekdayLong, dayNum, isToday }) => {
                  const state = getCellState(habit, date, logs)
                  let label = `${habit.name}, ${weekdayLong} ${dayNum}, not scheduled`
                  if (state === "done") {
                    label = `${habit.name}, ${weekdayLong} ${dayNum}, done`
                  } else if (state === "missed") {
                    label = `${habit.name}, ${weekdayLong} ${dayNum}, missed`
                  } else if (state === "open") {
                    label = `${habit.name}, ${weekdayLong} ${dayNum}, not done yet`
                  }

                  return (
                    <div
                      key={date}
                      className={`flex items-center justify-center h-full ${
                        isToday ? "bg-highlight" : ""
                      }`}
                    >
                      <WeekCell
                        state={state}
                        color={habit.color}
                        size="desktop"
                        label={label}
                        onToggle={() => handleToggle(habit.id, date)}
                      />
                    </div>
                  )
                })}

                <div className="pr-6 flex items-baseline justify-end gap-[6px] self-center">
                  {streak > 0 ? (
                    <>
                      <span className="text-[26px] font-bold tracking-[-0.03em] text-foreground tabular-nums">
                        {streak}
                      </span>
                      <span className="text-[13px] text-muted-foreground">
                        {streak === 1 ? "day" : "days"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[26px] font-bold text-foreground">
                      —
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="md:hidden">
          <div className="grid grid-cols-7 gap-1 px-3 py-2.5">
            {dayDetails.map(({ date, weekdayInitial, dayNum, isToday }) => (
              <div
                key={date}
                className={`w-full max-w-[44px] h-[52px] mx-auto rounded-lg flex flex-col items-center justify-center gap-[1px] ${
                  isToday
                    ? "bg-highlight-solid text-[#15181D]"
                    : "text-foreground"
                }`}
              >
                <span
                  className={`text-[12px] ${
                    isToday
                      ? "font-bold text-[#15181D]"
                      : "font-medium text-muted-foreground"
                  }`}
                >
                  {weekdayInitial}
                </span>
                <span
                  className={`text-[17px] tracking-[-0.02em] ${
                    isToday
                      ? "font-extrabold text-[#15181D]"
                      : "font-semibold text-foreground"
                  }`}
                >
                  {dayNum}
                </span>
              </div>
            ))}
          </div>

          {SAMPLE_HABITS.map((habit) => {
            const logs = logsByHabit[habit.id] ?? []
            const streak = calculateStreaks(logs, habit.frequency, today).current

            return (
              <div
                key={habit.id}
                className="px-3 pt-3.5 pb-4 border-t border-border"
              >
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="size-[10px] rounded-[3px] shrink-0"
                      style={{ backgroundColor: habit.color }}
                    />
                    <span className="text-[16px] font-semibold text-foreground truncate">
                      {habit.name}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-baseline">
                    {streak > 0 ? (
                      <>
                        <span className="text-[20px] font-bold text-foreground tabular-nums">
                          {streak}
                        </span>
                        <span className="text-[12px] text-muted-foreground ml-1.5">
                          {streak === 1 ? "day" : "days"}
                        </span>
                      </>
                    ) : (
                      <span className="text-[20px] font-bold text-foreground">
                        —
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mt-3">
                  {dayDetails.map(({ date, weekdayLong, dayNum }) => {
                    const state = getCellState(habit, date, logs)
                    let label = `${habit.name}, ${weekdayLong} ${dayNum}, not scheduled`
                    if (state === "done") {
                      label = `${habit.name}, ${weekdayLong} ${dayNum}, done`
                    } else if (state === "missed") {
                      label = `${habit.name}, ${weekdayLong} ${dayNum}, missed`
                    } else if (state === "open") {
                      label = `${habit.name}, ${weekdayLong} ${dayNum}, not done yet`
                    }

                    return (
                      <div
                        key={date}
                        className="w-full max-w-[44px] aspect-square mx-auto flex items-center justify-center"
                      >
                        <WeekCell
                          state={state}
                          color={habit.color}
                          size="mobile"
                          label={label}
                          onToggle={() => handleToggle(habit.id, date)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-5 text-[14px] text-muted-foreground">
        This is the real thing, with sample habits. Tap a square to try it.
      </p>
    </div>
  )
}

export function DemoSheet() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <div className="w-full">
        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <Skeleton className="h-[592px] md:h-[456px] w-full" />
        </div>
        <p className="mt-5 text-[14px] text-muted-foreground">
          This is the real thing, with sample habits. Tap a square to try it.
        </p>
      </div>
    )
  }

  return <ActiveDemoSheet />
}
