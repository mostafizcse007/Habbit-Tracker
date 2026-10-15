"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import type { Habit } from "@/types"
import {
  getLocalDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "@/lib/dates"
import { calculateCompletionRate, calculateStreaks } from "@/lib/streaks"
import {
  buildHeatmapWeeks,
  formatLongDate,
  getMonthLabel,
} from "@/lib/calendar"
import { formatSchedule } from "@/lib/habit-schedule"
import { fetchAllLogs } from "@/lib/logs"
import { createClient } from "@/lib/supabase/client"
import { toggleHabitLog } from "@/app/(app)/dashboard/actions"
import { HabitActions } from "@/components/habits/habit-actions"
import { HabitHistoryEditor } from "@/components/habits/habit-history-editor"
import { WeekdayBars } from "@/components/habits/weekday-bars"
import { Skeleton } from "@/components/ui/skeleton"
import { useAchievementCheck } from "@/hooks/use-achievement-check"
import { cn } from "@/lib/utils"

interface HabitDetailProps {
  habit: Habit
}

function formatSquareTitleDate(dateStr: string): string {
  const d = parseLocalDateString(dateStr)
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" })
  const day = d.getDate()
  const month = d.toLocaleDateString("en-US", { month: "short" })
  const year = d.getFullYear()
  return `${weekday} ${day} ${month} ${year}`
}

export function HabitDetail({ habit }: HabitDetailProps) {
  const router = useRouter()
  const { scheduleCheck } = useAchievementCheck()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [today, setToday] = useState<string>("")
  const [logs, setLogs] = useState<string[]>([])
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLogs = async () => {
      const todayStr = getLocalDateString()
      const supabase = createClient()
      const { data, error } = await fetchAllLogs(supabase, habit.id)

      if (error) {
        toast.error("Failed to load habit history")
      } else if (data) {
        setLogs(data.map((l) => l.completed_on))
      }

      setToday(todayStr)
      setIsLoading(false)
    }

    loadLogs()
  }, [habit.id])

  useEffect(() => {
    if (!isLoading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth
    }
  }, [isLoading])

  const handleAfterAction = () => {
    router.push("/habits")
    router.refresh()
  }

  const toggleDate = async (date: string) => {
    if (!today || date > today || pendingDates.has(date)) {
      return
    }

    const next = !logs.includes(date)

    setLogs((prev) => (next ? [...prev, date] : prev.filter((d) => d !== date)))
    setPendingDates((prev) => {
      const updated = new Set(prev)
      updated.add(date)
      return updated
    })

    try {
      const result = await toggleHabitLog(habit.id, date, next)
      if (result && "error" in result) {
        setLogs((prev) =>
          next ? prev.filter((d) => d !== date) : [...prev, date]
        )
        toast.error("Could not update that day. Try again.")
      } else if (next) {
        scheduleCheck()
      }
    } catch {
      setLogs((prev) =>
        next ? prev.filter((d) => d !== date) : [...prev, date]
      )
      toast.error("Could not update that day. Try again.")
    } finally {
      setPendingDates((prev) => {
        const updated = new Set(prev)
        updated.delete(date)
        return updated
      })
    }
  }

  const createdOn = useMemo(
    () => getLocalDateString(new Date(habit.created_at)),
    [habit.created_at]
  )
  const startedText = useMemo(() => formatLongDate(createdOn), [createdOn])
  const scheduleText = useMemo(
    () => formatSchedule(habit.frequency),
    [habit.frequency]
  )

  const streaks = useMemo(
    () => calculateStreaks(logs, habit.frequency, today),
    [logs, habit.frequency, today]
  )
  const rateStats = useMemo(
    () => calculateCompletionRate(logs, habit.frequency, createdOn, today, 30),
    [logs, habit.frequency, createdOn, today]
  )

  const logSet = useMemo(() => new Set(logs), [logs])
  const weeks = useMemo(
    () => (today ? buildHeatmapWeeks(today, 53) : []),
    [today]
  )

  const heatmapCheckInsCount = useMemo(() => {
    if (!today) return 0
    const validHeatmapDates = new Set(
      weeks.flatMap((w) => w).filter((d): d is string => d !== null)
    )
    return logs.filter((d) => validHeatmapDates.has(d)).length
  }, [weeks, logs, today])

  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = []
    let previousMonth = ""

    weeks.forEach((week, index) => {
      const monday = week[0]
      if (!monday) return
      const monthKey = monday.slice(0, 7)
      if (previousMonth && monthKey !== previousMonth) {
        labels.push({
          weekIndex: index,
          label: getMonthLabel(monday),
        })
      }
      previousMonth = monthKey
    })

    return labels
  }, [weeks])

  if (isLoading || !today) {
    return (
      <div className="pt-7 md:pt-14 pb-14 md:pb-[72px] space-y-6">
        <div>
          <Skeleton className="h-4 w-16 mb-4" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-[14px] rounded-[4px]" />
              <Skeleton className="h-[40px] md:h-[56px] w-64 md:w-80" />
            </div>
            <Skeleton className="size-[36px] rounded-lg" />
          </div>
          <Skeleton className="h-5 w-72 mt-3" />
        </div>

        <div className="mt-8 bg-card border border-border rounded-[14px] overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card p-4 sm:p-5 md:p-6 space-y-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-[120px] w-full" />
        </div>

        <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-9 w-48" />
          </div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <Skeleton className="h-[280px] w-full md:w-[350px] rounded-lg" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </div>

        <div className="mt-6 bg-card border border-border rounded-[14px] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-3 h-28 items-end">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-11 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
      <div>
        <Link
          href="/habits"
          className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Habits</span>
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <span
              className="size-[14px] rounded-[4px] shrink-0"
              style={{ backgroundColor: habit.color }}
            />
            <h1 className="text-[40px] md:text-[56px] font-bold leading-none tracking-[-0.045em] text-foreground truncate">
              {habit.name}
            </h1>
          </div>

          <HabitActions
            habit={habit}
            onArchived={handleAfterAction}
            onDeleted={handleAfterAction}
          />
        </div>

        <p className="mt-3 text-[16px] md:text-[19px] leading-[1.4] text-text-soft">
          {scheduleText}. Started {startedText}.
        </p>
      </div>

      <div className="mt-8 bg-card border border-border rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          <div className="bg-card p-4 sm:p-5 md:p-6">
            <div className="flex items-baseline gap-1.5">
              {streaks.current > 0 ? (
                <>
                  <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
                    {streaks.current}
                  </span>
                  <span className="text-[14px] text-muted-foreground">
                    {streaks.current === 1 ? "day" : "days"}
                  </span>
                </>
              ) : (
                <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-foreground">
                  —
                </span>
              )}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2">
              Current streak
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 md:p-6">
            <div className="flex items-baseline gap-1.5">
              {streaks.longest > 0 ? (
                <>
                  <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
                    {streaks.longest}
                  </span>
                  <span className="text-[14px] text-muted-foreground">
                    {streaks.longest === 1 ? "day" : "days"}
                  </span>
                </>
              ) : (
                <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-foreground">
                  —
                </span>
              )}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2">
              Longest streak
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 md:p-6">
            <div className="flex items-baseline gap-0.5">
              {rateStats.rate !== null ? (
                <>
                  <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
                    {rateStats.rate}
                  </span>
                  <span className="text-[14px] text-muted-foreground">%</span>
                </>
              ) : (
                <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-foreground">
                  —
                </span>
              )}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2">
              Last 30 days
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 md:p-6">
            <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
              {logs.length}
            </span>
            <div className="text-[13px] text-muted-foreground mt-2">
              Check-ins
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-[14px] overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="text-[17px] font-semibold text-foreground">
            Last 12 months
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span
                className="size-[12px] rounded-[3px] shrink-0"
                style={{ backgroundColor: habit.color }}
              />
              <span>Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-[12px] rounded-[3px] shrink-0 bg-muted" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-[12px] rounded-[3px] shrink-0 bg-muted/40" />
              <span>Not scheduled</span>
            </div>
          </div>
        </div>

        <div ref={scrollContainerRef} className="overflow-x-auto pb-2 min-w-0 max-w-full">
          <div
            role="img"
            aria-label={`Check-in history for the last 12 months: ${heatmapCheckInsCount} check-ins`}
            className="inline-flex gap-2 min-w-max"
          >
            <div className="flex flex-col">
              <div className="h-4" />
              <div
                className="grid text-[12px] text-muted-foreground select-none"
                style={{
                  gridTemplateRows: "repeat(7, 12px)",
                  gap: "3px",
                }}
              >
                <span className="row-start-2 leading-[12px]">Mon</span>
                <span className="row-start-4 leading-[12px]">Wed</span>
                <span className="row-start-6 leading-[12px]">Fri</span>
              </div>
            </div>

            <div className="flex flex-col">
              <div
                className="grid h-4 items-end"
                style={{
                  gridTemplateColumns: "repeat(53, 12px)",
                  gap: "3px",
                }}
              >
                {monthLabels.map((item) => (
                  <span
                    key={item.weekIndex}
                    style={{ gridColumnStart: item.weekIndex + 1 }}
                    className="text-[12px] text-muted-foreground whitespace-nowrap overflow-visible w-0 block leading-none select-none"
                  >
                    {item.label}
                  </span>
                ))}
              </div>

              <div
                className="grid"
                style={{
                  gridTemplateRows: "repeat(7, 12px)",
                  gridAutoFlow: "column",
                  gap: "3px",
                }}
              >
                {weeks.flatMap((week, weekIndex) =>
                  week.map((date, dayIndex) => {
                    if (!date) {
                      return (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="size-[12px]"
                          style={{ visibility: "hidden" }}
                          aria-hidden="true"
                        />
                      )
                    }

                    const isLogged = logSet.has(date)
                    const d = parseLocalDateString(date)
                    const weekday = getLocalWeekday(d)
                    const isScheduled = habit.frequency.includes(weekday)
                    const isOnOrAfterCreation = date >= createdOn
                    const isToday = date === today

                    let status: "done" | "missed" | "not scheduled"
                    let bgStyle: React.CSSProperties = {}
                    let bgClass = ""

                    if (isLogged) {
                      status = "done"
                      bgStyle = { backgroundColor: habit.color }
                    } else if (isScheduled && isOnOrAfterCreation) {
                      status = "missed"
                      bgClass = "bg-muted"
                    } else {
                      status = "not scheduled"
                      bgClass = "bg-muted/40"
                    }

                    return (
                      <div
                        key={date}
                        title={`${formatSquareTitleDate(date)}: ${status}`}
                        style={bgStyle}
                        className={cn(
                          "size-[12px] rounded-[3px]",
                          bgClass,
                          isToday && "ring-1 ring-foreground"
                        )}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <HabitHistoryEditor
        habit={habit}
        logs={logs}
        today={today}
        pending={pendingDates}
        onToggle={toggleDate}
      />

      <WeekdayBars
        habit={habit}
        logs={logs}
        today={today}
      />
    </div>
  )
}
