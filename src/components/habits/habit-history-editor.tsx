"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Habit } from "@/types"
import {
  getLocalDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "@/lib/dates"
import {
  buildMonthGrid,
  getMonthTitle,
  shiftMonth,
} from "@/lib/calendar"
import { cn } from "@/lib/utils"

interface HabitHistoryEditorProps {
  habit: Habit
  logs: string[]
  today: string
  pending: Set<string>
  onToggle: (date: string) => void
}

const WEEKDAYS = [
  { short: "Mon", narrow: "M" },
  { short: "Tue", narrow: "T" },
  { short: "Wed", narrow: "W" },
  { short: "Thu", narrow: "T" },
  { short: "Fri", narrow: "F" },
  { short: "Sat", narrow: "S" },
  { short: "Sun", narrow: "S" },
]

function formatAriaDate(dateStr: string): string {
  const d = parseLocalDateString(dateStr)
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" })
  const day = d.getDate()
  const month = d.toLocaleDateString("en-US", { month: "short" })
  const year = d.getFullYear()
  return `${weekday} ${day} ${month} ${year}`
}

export function HabitHistoryEditor({
  habit,
  logs,
  today,
  pending,
  onToggle,
}: HabitHistoryEditorProps) {
  const todayDate = parseLocalDateString(today)
  const currentYear = todayDate.getFullYear()
  const currentMonth = todayDate.getMonth()

  const [shown, setShown] = useState(() => ({
    year: currentYear,
    month: currentMonth,
  }))

  const isNextDisabled =
    shown.year > currentYear ||
    (shown.year === currentYear && shown.month >= currentMonth)

  const minMonth = shiftMonth(currentYear, currentMonth, -24)
  const isPrevDisabled =
    shown.year < minMonth.year ||
    (shown.year === minMonth.year && shown.month <= minMonth.month)

  const handlePrev = () => {
    setShown((prev) => shiftMonth(prev.year, prev.month, -1))
  }

  const handleNext = () => {
    setShown((prev) => shiftMonth(prev.year, prev.month, 1))
  }

  const monthTitle = getMonthTitle(shown.year, shown.month)
  const gridRows = buildMonthGrid(shown.year, shown.month)
  const createdOn = getLocalDateString(new Date(habit.created_at))

  const daysInShownMonth = new Date(shown.year, shown.month + 1, 0).getDate()
  const monthName = new Date(shown.year, shown.month, 1).toLocaleDateString(
    "en-US",
    { month: "long" }
  )

  let scheduledCount = 0
  let doneCount = 0

  for (let day = 1; day <= daysInShownMonth; day++) {
    const dateStr = getLocalDateString(new Date(shown.year, shown.month, day))
    if (dateStr <= today && dateStr >= createdOn) {
      const weekday = getLocalWeekday(parseLocalDateString(dateStr))
      if (habit.frequency.includes(weekday)) {
        scheduledCount++
        if (logs.includes(dateStr)) {
          doneCount++
        }
      }
    }
  }

  return (
    <div className="mt-6 bg-card border border-border rounded-[14px] overflow-hidden p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold text-foreground">
          Edit history
        </h2>
        <div className="flex items-center gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isPrevDisabled}
            aria-label="Previous month"
            className="size-[36px] rounded-lg border border-input flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-[17px] font-semibold tabular-nums min-w-[140px] text-center text-foreground select-none">
            {monthTitle}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            aria-label="Next month"
            className="size-[36px] rounded-lg border border-input flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10 mt-6">
        <div className="w-full md:w-auto shrink-0">
          <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-1.5 text-center text-[13px] text-muted-foreground select-none">
            {WEEKDAYS.map((w, i) => (
              <div
                key={i}
                className="h-6 flex items-center justify-center font-medium"
              >
                <span className="hidden md:inline">{w.short}</span>
                <span className="md:hidden">{w.narrow}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-1.5">
            {gridRows.flatMap((row, rowIdx) =>
              row.map((date, colIdx) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${rowIdx}-${colIdx}`}
                      className="size-[44px] md:size-[48px]"
                      aria-hidden="true"
                    />
                  )
                }

                const d = parseLocalDateString(date)
                const dayNum = d.getDate()
                const weekday = getLocalWeekday(d)
                const isFuture = date > today
                const isLogged = logs.includes(date)
                const isScheduled = habit.frequency.includes(weekday)
                const isOnOrAfterCreation = date >= createdOn
                const isToday = date === today
                const isPending = pending.has(date)

                let statusLabel = ""
                let stateClass = ""
                let stateStyle: React.CSSProperties = {}

                if (isFuture) {
                  statusLabel = "not scheduled"
                  stateClass = "text-muted-foreground/40 cursor-not-allowed"
                } else if (isLogged) {
                  statusLabel = "done"
                  stateClass = "text-[#15181D] font-bold"
                  stateStyle = { backgroundColor: habit.color }
                } else if (isToday && isScheduled) {
                  statusLabel = "not done yet"
                  stateClass = "border-2 border-foreground font-medium text-foreground"
                } else if (isScheduled && isOnOrAfterCreation) {
                  statusLabel = "missed"
                  stateClass =
                    "border-[1.5px] border-line-strong text-foreground font-medium hover:border-foreground"
                } else {
                  statusLabel = "not scheduled"
                  stateClass =
                    "text-muted-foreground font-medium hover:border hover:border-line-strong"
                }

                return (
                  <button
                    key={date}
                    type="button"
                    disabled={isFuture || isPending}
                    aria-label={`${formatAriaDate(date)}, ${statusLabel}`}
                    aria-pressed={isLogged}
                    onClick={() => onToggle(date)}
                    style={stateStyle}
                    className={cn(
                      "size-[44px] md:size-[48px] rounded-lg text-[15px] tabular-nums flex items-center justify-center select-none motion-safe:transition-colors motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      stateClass,
                      isToday &&
                        "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                      isPending && "opacity-60",
                      !isFuture && !isPending && "cursor-pointer"
                    )}
                  >
                    {dayNum}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex-1 max-w-[360px]">
          <p className="text-[15px] leading-[1.5] text-text-soft">
            Tap a day to log it, or tap again to undo. You can log any past day,
            even one this habit is not scheduled on. Changes save as you tap.
          </p>
          {scheduledCount === 0 ? (
            <p className="mt-4 text-[17px] font-semibold text-foreground">
              No scheduled days in {monthName} yet.
            </p>
          ) : (
            <p className="mt-4 text-[17px] font-semibold text-foreground">
              {doneCount} of {scheduledCount} scheduled days done in {monthName}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
