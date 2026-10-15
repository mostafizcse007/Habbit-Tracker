"use client"

import Link from "next/link"
import { Flame } from "lucide-react"
import type { Habit } from "@/types"
import { parseLocalDateString } from "@/lib/dates"
import { formatSchedule } from "@/lib/habit-schedule"
import { WeekCell, type CellState } from "./week-cell"
import { StreakNumber } from "./streak-number"
import { cn } from "@/lib/utils"

interface WeekSheetProps {
  habits: Habit[]
  days: string[]
  today: string
  logsByHabit: Record<string, string[]>
  pendingKeys: Set<string>
  streaksByHabit: Record<string, number>
  getCellState: (habit: Habit, date: string) => CellState
  onToggleCell: (habit: Habit, date: string) => void
  className?: string
  isRecent?: (key: string) => boolean
}

export function WeekSheet({
  habits,
  days,
  today,
  pendingKeys,
  streaksByHabit,
  getCellState,
  onToggleCell,
  className,
  isRecent,
}: WeekSheetProps) {


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

  return (
    <div
      className={cn(
        "mt-7 md:mt-10 bg-card border border-border rounded-[14px] overflow-hidden",
        className
      )}
    >
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

        {habits.map((habit, index) => {
          const streak = streaksByHabit[habit.id] ?? 0
          const scheduleText = formatSchedule(habit.frequency)

          return (
            <div
              key={habit.id}
              style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
              className="anim-reveal grid grid-cols-[minmax(0,1fr)_repeat(7,56px)_96px] lg:grid-cols-[minmax(0,1fr)_repeat(7,64px)_112px] min-h-[76px] border-t border-border items-stretch"
            >
              <div className="pl-6 pr-4 flex items-center gap-[14px] min-w-0">
                <span
                  className="size-[10px] rounded-[3px] shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[17px] font-semibold tracking-[-0.01em] text-foreground truncate">
                    <Link href={`/habits/${habit.id}`} className="hover:underline">
                      {habit.name}
                    </Link>
                  </div>
                  <div className="text-[13px] text-muted-foreground mt-0.5 truncate">
                    {scheduleText}
                  </div>
                </div>
              </div>

              {dayDetails.map(({ date, weekdayLong, dayNum, isToday }) => {
                const state = getCellState(habit, date)
                const isPending = pendingKeys.has(`${habit.id}:${date}`)
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
                      pending={isPending}
                      justChecked={
                        isRecent ? isRecent(`${habit.id}:${date}`) : false
                      }
                      onToggle={() => onToggleCell(habit, date)}
                    />
                  </div>
                )
              })}

              <div className="pr-6 flex items-baseline justify-end gap-[6px] self-center">
                {streak >= 7 && (
                  <Flame
                    className="size-4 text-foreground shrink-0 self-center"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )}
                {streak > 0 ? (
                  <>
                    <StreakNumber
                      value={streak}
                      className="text-[26px] font-bold tracking-[-0.03em] text-foreground tabular-nums"
                    />
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

        {habits.map((habit, index) => {
          const streak = streaksByHabit[habit.id] ?? 0

          return (
            <div
              key={habit.id}
              style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
              className="anim-reveal px-3 pt-3.5 pb-4 border-t border-border"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="size-[10px] rounded-[3px] shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <Link
                    href={`/habits/${habit.id}`}
                    className="text-[16px] font-semibold text-foreground truncate hover:underline"
                  >
                    {habit.name}
                  </Link>
                </div>

                <div className="shrink-0 flex items-baseline gap-1.5">
                  {streak >= 7 && (
                    <Flame
                      className="size-4 text-foreground shrink-0 self-center"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                  {streak > 0 ? (
                    <>
                      <StreakNumber
                        value={streak}
                        className="text-[20px] font-bold text-foreground tabular-nums"
                      />
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
                  const state = getCellState(habit, date)
                  const isPending = pendingKeys.has(`${habit.id}:${date}`)
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
                        pending={isPending}
                        justChecked={
                          isRecent ? isRecent(`${habit.id}:${date}`) : false
                        }
                        onToggle={() => onToggleCell(habit, date)}
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
  )
}
