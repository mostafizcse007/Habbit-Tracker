"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, Plus, Pencil, Shield, Archive, RotateCcw } from "lucide-react"
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
import { toggleHabitLog, saveHabitNote } from "@/app/(app)/dashboard/actions"
import { unarchiveHabit } from "@/app/(app)/habits/actions"
import { HabitActions } from "@/components/habits/habit-actions"
import { HabitHistoryEditor } from "@/components/habits/habit-history-editor"
import { WeekdayBars } from "@/components/habits/weekday-bars"
import { HabitNoteDialog } from "@/components/habits/habit-note-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAchievementCheck } from "@/hooks/use-achievement-check"
import { useJustChanged } from "@/hooks/use-just-changed"
import { StreakNumber } from "@/components/habits/streak-number"
import { tapHaptic } from "@/lib/haptics"
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
  const { mark, isRecent } = useJustChanged()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentHabit, setCurrentHabit] = useState<Habit>(habit)
  const [prevHabit, setPrevHabit] = useState<Habit>(habit)
  const [today, setToday] = useState<string>("")
  const [logs, setLogs] = useState<string[]>([])
  const [notesByDate, setNotesByDate] = useState<Record<string, string>>({})
  const [activeNoteDate, setActiveNoteDate] = useState<string | null>(null)
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  if (prevHabit !== habit) {
    setPrevHabit(habit)
    setCurrentHabit(habit)
  }

  useEffect(() => {
    const loadLogs = async () => {
      const todayStr = getLocalDateString()
      const supabase = createClient()
      const { data, error } = await fetchAllLogs(supabase, habit.id)

      if (error) {
        toast.error("Failed to load habit history")
      } else if (data) {
        setLogs(data.map((l) => l.completed_on))
        const noteMap: Record<string, string> = {}
        for (const l of data) {
          if (l.note) {
            noteMap[l.completed_on] = l.note
          }
        }
        setNotesByDate(noteMap)
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
    if (next) {
      mark(`${habit.id}:${date}`)
      tapHaptic()
    }

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

  const handleSaveNote = async (
    habitId: string,
    date: string,
    note: string | null
  ) => {
    const previousNote = notesByDate[date]
    const wasLogged = logs.includes(date)

    setNotesByDate((prev) => {
      const next = { ...prev }
      if (note) next[date] = note
      else delete next[date]
      return next
    })

    if (note && !wasLogged) {
      setLogs((prev) => [...prev, date])
    }

    try {
      const result = await saveHabitNote(habitId, date, note)
      if (result && "error" in result) {
        setNotesByDate((prev) => {
          const next = { ...prev }
          if (previousNote) next[date] = previousNote
          else delete next[date]
          return next
        })
        if (note && !wasLogged) {
          setLogs((prev) => prev.filter((d) => d !== date))
        }
        throw new Error(result.error)
      }
    } catch (err) {
      setNotesByDate((prev) => {
        const next = { ...prev }
        if (previousNote) next[date] = previousNote
        else delete next[date]
        return next
      })
      if (note && !wasLogged) {
        setLogs((prev) => prev.filter((d) => d !== date))
      }
      throw err
    }
  }

  const createdOn = useMemo(
    () => getLocalDateString(new Date(currentHabit.created_at)),
    [currentHabit.created_at]
  )
  const startedText = useMemo(() => formatLongDate(createdOn), [createdOn])
  const scheduleText = useMemo(
    () => formatSchedule(currentHabit.frequency),
    [currentHabit.frequency]
  )

  const streaks = useMemo(
    () => calculateStreaks(logs, currentHabit.frequency, today, createdOn),
    [logs, currentHabit.frequency, today, createdOn]
  )

  const rateStats = useMemo(
    () => calculateCompletionRate(logs, currentHabit.frequency, createdOn, today, 30),
    [logs, currentHabit.frequency, createdOn, today]
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
              style={{ backgroundColor: currentHabit.color }}
            />
            <h1 className="text-[40px] md:text-[56px] font-bold leading-none tracking-[-0.045em] text-foreground truncate">
              {currentHabit.name}
            </h1>
          </div>

          <HabitActions
            habit={currentHabit}
            onArchived={handleAfterAction}
            onUnarchived={() => {
              setCurrentHabit((prev) => ({ ...prev, archived: false }))
              router.refresh()
            }}
            onDeleted={handleAfterAction}
            onUpdated={(updated) =>
              setCurrentHabit((prev) => ({ ...prev, ...updated }))
            }
          />
        </div>

        <p className="mt-3 text-[16px] md:text-[19px] leading-[1.4] text-text-soft">
          {scheduleText}. Started {startedText}.
        </p>

        {currentHabit.tags && currentHabit.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {currentHabit.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-secondary text-secondary-foreground border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {currentHabit.archived && (
          <div className="mt-6 p-4 rounded-[12px] bg-muted/70 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-[14px] text-muted-foreground">
              <Archive className="size-4 shrink-0" />
              <span>
                This habit is currently archived. It is hidden from Today and active counts.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await unarchiveHabit(currentHabit.id)
                if (res?.error) {
                  toast.error(res.error)
                } else {
                  toast.success("Habit restored")
                  setCurrentHabit((prev) => ({ ...prev, archived: false }))
                  router.refresh()
                }
              }}
              className="h-8 px-3 rounded-[8px] text-[13px] font-medium shrink-0 cursor-pointer"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Restore habit
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 bg-card border border-border rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          <div className="bg-card p-4 sm:p-5 md:p-6">
            <div className="flex items-baseline justify-between gap-1">
              <div className="flex items-baseline gap-1.5">
                {streaks.current > 0 ? (
                  <>
                    <StreakNumber
                      value={streaks.current}
                      className="text-[36px] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums"
                    />
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
              {streaks.graceUsedThisWeek && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full select-none"
                  title={
                    streaks.graceDate
                      ? `Streak protected by 1 grace day on ${streaks.graceDate}`
                      : "Streak protected by automatic weekly grace day"
                  }
                >
                  <Shield className="size-3 shrink-0" />
                  Grace active
                </span>
              )}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2 flex items-center justify-between">
              <span>Current streak</span>
              {streaks.graceUsedThisWeek && streaks.graceDate && (
                <span className="text-[11px] text-muted-foreground">
                  Saved on {streaks.graceDate.slice(5)}
                </span>
              )}
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
            <div className="flex items-baseline justify-between gap-1">
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
              {streaks.momentumScore > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full select-none",
                    streaks.momentumLabel === "Unstoppable" &&
                      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
                    streaks.momentumLabel === "Strong" &&
                      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
                    streaks.momentumLabel === "Building" &&
                      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
                    streaks.momentumLabel === "Starting" &&
                      "bg-muted text-muted-foreground border border-border"
                  )}
                  title={`30-Day weighted momentum: ${streaks.momentumScore}% (${streaks.momentumLabel})`}
                >
                  {streaks.momentumLabel === "Unstoppable" && "🔥 "}
                  {streaks.momentumLabel === "Strong" && "⚡ "}
                  {streaks.momentumLabel === "Building" && "📈 "}
                  {streaks.momentumLabel}
                </span>
              )}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2 flex items-center justify-between">
              <span>Last 30 days</span>
              {streaks.momentumScore > 0 && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {streaks.momentumScore}% momentum
                </span>
              )}
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
          <h2 className="text-[17px] font-semibold text-foreground">
            Last 12 months
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span
                className="size-[12px] rounded-[3px] shrink-0"
                style={{ backgroundColor: currentHabit.color }}
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
            aria-label={`Check-in history for the last 12 months: ${heatmapCheckInsCount} check-ins, ${rateStats.rate ?? 0}% completed`}
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
                    const isScheduled = currentHabit.frequency.includes(weekday)
                    const isOnOrAfterCreation = date >= createdOn
                    const isToday = date === today

                    let status: "done" | "missed" | "not scheduled"
                    let bgStyle: React.CSSProperties = {}
                    let bgClass = ""

                    if (isLogged) {
                      status = "done"
                      bgStyle = { backgroundColor: currentHabit.color }
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
        habit={currentHabit}
        logs={logs}
        today={today}
        pending={pendingDates}
        onToggle={toggleDate}
        isRecent={isRecent}
      />

      <WeekdayBars
        habit={currentHabit}
        logs={logs}
        today={today}
      />

      {/* Daily Notes & Journal Section */}
      <div className="mt-8 bg-card border border-border rounded-[14px] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <FileText className="size-4" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-foreground">
                Daily Reflections & Notes
              </h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Log observations, obstacles, or wins on your habit check-ins
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveNoteDate(today)}
            className="h-9 px-3.5 rounded-lg text-[13px] font-medium cursor-pointer shrink-0"
          >
            <Plus className="size-3.5 mr-1.5" />
            {notesByDate[today] ? "Edit today's note" : "Add note for today"}
          </Button>
        </div>

        {Object.keys(notesByDate).length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-[14px] border border-dashed border-border rounded-xl">
            No reflections recorded yet. Click &quot;Add note for today&quot; to write your first reflection!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {Object.entries(notesByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, noteText]) => {
                const d = parseLocalDateString(date)
                const formatted = d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                return (
                  <button
                    type="button"
                    key={date}
                    onClick={() => setActiveNoteDate(date)}
                    className="text-left w-full p-4 rounded-xl border border-border bg-background hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors cursor-pointer group space-y-2"
                    aria-label={`Edit reflection for ${formatted}`}
                  >
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatted}</span>
                      <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center gap-1 text-primary text-[12px] font-medium">
                        <Pencil className="size-3" aria-hidden="true" /> Edit
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-text-soft whitespace-pre-wrap">
                      {noteText}
                    </p>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      {activeNoteDate && (
        <HabitNoteDialog
          open={Boolean(activeNoteDate)}
          onOpenChange={(open) => {
            if (!open) setActiveNoteDate(null)
          }}
          habit={currentHabit}
          date={activeNoteDate}
          initialNote={notesByDate[activeNoteDate]}
          onSave={handleSaveNote}
        />
      )}
    </div>
  )
}
