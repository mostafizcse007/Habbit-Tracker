"use client"

import { useMemo, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { Habit } from "@/types"
import {
  getLocalDateString,
  getLastNDates,
  getLocalWeekday,
  parseLocalDateString,
} from "@/lib/dates"
import { calculateStreaks, calculateCompletionRate } from "@/lib/streaks"
import { createClient } from "@/lib/supabase/client"
import { fetchAllLogs } from "@/lib/logs"
import { toggleHabitLog, saveHabitNote } from "@/app/(app)/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HabitDialog } from "@/components/habits/habit-dialog"
import { WeekSheet } from "@/components/habits/week-sheet"
import { StarterHabits } from "@/components/habits/starter-habits"
import { SmartNudgeCard } from "@/components/habits/smart-nudge-card"
import { HabitNoteDialog } from "@/components/habits/habit-note-dialog"
import { computeSmartNudges } from "@/lib/nudges"
import type { CellState } from "@/components/habits/week-cell"
import { useAchievementCheck } from "@/hooks/use-achievement-check"
import { useJustChanged } from "@/hooks/use-just-changed"
import { tapHaptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"

interface DashboardContentProps {
  habits: Habit[]
}

function joinNames(names: string[]): string {
  if (names.length === 0) return ""
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

export function cellState(
  habit: Habit,
  date: string,
  today: string,
  logs: string[]
): CellState {
  if (logs.includes(date)) {
    return "done"
  }

  const weekday = getLocalWeekday(parseLocalDateString(date))
  if (!habit.frequency.includes(weekday)) {
    return "off"
  }

  const createdOn = getLocalDateString(new Date(habit.created_at))
  if (date < createdOn) {
    return "off"
  }

  if (date < today) {
    return "missed"
  }

  return "open"
}

export function DashboardContent({ habits }: DashboardContentProps) {
  const { scheduleCheck } = useAchievementCheck()
  const { mark, isRecent } = useJustChanged()
  const [today, setToday] = useState<string>("")
  const [logsByHabit, setLogsByHabit] = useState<Record<string, string[]>>({})
  const [notesByHabitDate, setNotesByHabitDate] = useState<Record<string, string>>({})
  const [activeNoteTarget, setActiveNoteTarget] = useState<{
    habit: Habit
    date: string
  } | null>(null)
  const [dismissedNudgeIds, setDismissedNudgeIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set()
    try {
      const saved = localStorage.getItem("dismissed_nudges")
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const prevAllDoneRef = useRef<boolean | null>(null)
  const [animatingMarker, setAnimatingMarker] = useState(false)
  const markerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const loadLogs = async () => {
      const todayDate = getLocalDateString()
      const supabase = createClient()
      const { data, error } = await fetchAllLogs(supabase)

      if (error) {
        toast.error("Failed to load habit history")
      } else if (data) {
        const grouped: Record<string, string[]> = {}
        const notesMap: Record<string, string> = {}
        for (const log of data) {
          if (!grouped[log.habit_id]) {
            grouped[log.habit_id] = []
          }
          grouped[log.habit_id].push(log.completed_on)
          if (log.note) {
            notesMap[`${log.habit_id}:${log.completed_on}`] = log.note
          }
        }
        setLogsByHabit(grouped)
        setNotesByHabitDate(notesMap)
      }

      setToday(todayDate)
      setIsLoading(false)
    }

    loadLogs()
  }, [])

  useEffect(() => {
    return () => {
      if (markerTimerRef.current) {
        clearTimeout(markerTimerRef.current)
      }
    }
  }, [])

  const toggleCell = async (habit: Habit, date: string) => {
    if (!today || date > today) {
      return
    }

    const key = `${habit.id}:${date}`
    if (pendingKeys.has(key)) {
      return
    }

    const currentLogs = logsByHabit[habit.id] ?? []
    const isCompleted = currentLogs.includes(date)
    const nextCompleted = !isCompleted

    if (nextCompleted) {
      mark(key)
      tapHaptic()
    }

    setLogsByHabit((prev) => {
      const logs = prev[habit.id] ?? []
      return {
        ...prev,
        [habit.id]: nextCompleted
          ? [...logs, date]
          : logs.filter((d) => d !== date),
      }
    })

    setPendingKeys((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })

    try {
      const result = await toggleHabitLog(habit.id, date, nextCompleted)
      if (result && "error" in result) {
        setLogsByHabit((prev) => ({
          ...prev,
          [habit.id]: currentLogs,
        }))
        toast.error("Could not update that day. Try again.")
      } else if (nextCompleted) {
        scheduleCheck()
      }
    } catch {
      setLogsByHabit((prev) => ({
        ...prev,
        [habit.id]: currentLogs,
      }))
      toast.error("Could not update that day. Try again.")
    } finally {
      setPendingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleSaveNote = async (
    habitId: string,
    date: string,
    note: string | null
  ) => {
    const key = `${habitId}:${date}`
    const previousNote = notesByHabitDate[key]
    const previousLogs = logsByHabit[habitId] ?? []

    setNotesByHabitDate((prev) => {
      const next = { ...prev }
      if (note) next[key] = note
      else delete next[key]
      return next
    })

    if (note && !previousLogs.includes(date)) {
      setLogsByHabit((prev) => ({
        ...prev,
        [habitId]: [...(prev[habitId] ?? []), date],
      }))
    }

    try {
      const result = await saveHabitNote(habitId, date, note)
      if (result && "error" in result) {
        setNotesByHabitDate((prev) => {
          const next = { ...prev }
          if (previousNote) next[key] = previousNote
          else delete next[key]
          return next
        })
        setLogsByHabit((prev) => ({
          ...prev,
          [habitId]: previousLogs,
        }))
        throw new Error(result.error)
      }
    } catch (err) {
      setNotesByHabitDate((prev) => {
        const next = { ...prev }
        if (previousNote) next[key] = previousNote
        else delete next[key]
        return next
      })
      setLogsByHabit((prev) => ({
        ...prev,
        [habitId]: previousLogs,
      }))
      throw err
    }
  }

  const handleDismissNudge = (id: string) => {
    setDismissedNudgeIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(
          "dismissed_nudges",
          JSON.stringify(Array.from(next))
        )
      } catch {}
      return next
    })
  }

  const dateObj = today ? parseLocalDateString(today) : new Date()
  const weekdayShort = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
  })
  const dayNum = dateObj.getDate()
  const monthShort = dateObj.toLocaleDateString("en-US", {
    month: "short",
  })
  const dateHeadline = `${weekdayShort} ${dayNum} ${monthShort}`

  const todayWeekday = getLocalWeekday(dateObj)
  const scheduledTodayHabits = habits.filter((h) =>
    h.frequency.includes(todayWeekday)
  )
  const totalToday = scheduledTodayHabits.length
  const doneToday = scheduledTodayHabits.filter((h) =>
    (logsByHabit[h.id] ?? []).includes(today)
  ).length
  const isAllDone = totalToday > 0 && doneToday === totalToday

  useEffect(() => {
    if (isLoading) return

    if (prevAllDoneRef.current === null) {
      prevAllDoneRef.current = isAllDone
      return
    }

    if (!prevAllDoneRef.current && isAllDone) {
      setAnimatingMarker(true)
      if (markerTimerRef.current) clearTimeout(markerTimerRef.current)
      markerTimerRef.current = setTimeout(() => {
        setAnimatingMarker(false)
        markerTimerRef.current = null
      }, 700)
    }

    prevAllDoneRef.current = isAllDone
  }, [isAllDone, isLoading])

  const streaksByHabit = useMemo(() => {
    if (!today) return {}
    const map: Record<string, number> = {}
    for (const habit of habits) {
      const logs = logsByHabit[habit.id] ?? []
      const streaks = calculateStreaks(logs, habit.frequency, today)
      map[habit.id] = streaks.current
    }
    return map
  }, [habits, logsByHabit, today])

  const allTags = useMemo(() => {
    return Array.from(new Set(habits.flatMap((h) => h.tags ?? [])))
  }, [habits])

  const habitsToRender = useMemo(() => {
    if (!selectedTag) return habits
    return habits.filter((h) => h.tags?.includes(selectedTag))
  }, [habits, selectedTag])

  const topNudge = useMemo(() => {
    if (!today || habits.length === 0) return null
    const list = computeSmartNudges({
      habits,
      logsByHabit,
      streaksByHabit,
      today,
    })
    return list.find((n) => !dismissedNudgeIds.has(n.id)) ?? null
  }, [habits, logsByHabit, streaksByHabit, today, dismissedNudgeIds])

  if (isLoading || !today) {
    return (
      <div className="pt-7 md:pt-14 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-16 w-64 rounded-lg" />
          <Skeleton className="h-5 w-80 rounded-md" />
        </div>
        <div className="mt-7 md:mt-10 bg-card border border-border rounded-[14px] p-6 space-y-4">
          <Skeleton className="h-[76px] w-full rounded-[10px]" />
          <Skeleton className="h-[76px] w-full rounded-[10px]" />
          <Skeleton className="h-[76px] w-full rounded-[10px]" />
          <Skeleton className="h-[76px] w-full rounded-[10px]" />
          <Skeleton className="h-[76px] w-full rounded-[10px]" />
        </div>
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[52px] md:text-[72px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
              {dateHeadline}
            </h1>
            <p className="mt-[14px] md:mt-[18px] text-[16px] md:text-[19px] leading-[1.4] text-text-soft max-w-[520px]">
              No habits yet. Start with a few of these, or make your own.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <StarterHabits />
        </div>
      </div>
    )
  }

  const days = getLastNDates(7, today)
  const openTodayHabits = scheduledTodayHabits.filter(
    (h) => !(logsByHabit[h.id] ?? []).includes(today)
  )

  let sentence = "Nothing scheduled today."
  if (totalToday > 0) {
    if (doneToday === totalToday) {
      sentence = `${doneToday} of ${totalToday} done. Nothing left for today.`
    } else {
      const openNames = joinNames(openTodayHabits.map((h) => h.name))
      sentence = `${doneToday} of ${totalToday} done. Still open: ${openNames}.`
    }
  }

  let totalScheduledWeek = 0
  let totalCompletedWeek = 0
  let bestCurrentStreak = 0
  let bestStreakHabitName = ""

  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    const currentStreak = streaksByHabit[habit.id] ?? 0

    if (currentStreak > bestCurrentStreak) {
      bestCurrentStreak = currentStreak
      bestStreakHabitName = habit.name
    }

    const createdOn = getLocalDateString(new Date(habit.created_at))
    const rateStats = calculateCompletionRate(
      logs,
      habit.frequency,
      createdOn,
      today,
      7
    )
    totalScheduledWeek += rateStats.scheduled
    totalCompletedWeek += rateStats.completed
  }

  const weekCompletionRate =
    totalScheduledWeek > 0
      ? Math.round((totalCompletedWeek / totalScheduledWeek) * 100)
      : 0

  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[52px] md:text-[72px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
            {dateHeadline}
          </h1>
          <p
            aria-live="polite"
            className="mt-[14px] md:mt-[18px] text-[16px] md:text-[19px] leading-[1.4] text-text-soft max-w-[520px]"
          >
            {isAllDone ? (
              <>
                {doneToday} of {totalToday} done.{" "}
                <span
                  className={cn(animatingMarker && "anim-marker-swipe")}
                  style={{
                    backgroundImage:
                      "linear-gradient(transparent 58%, var(--marker) 58%, var(--marker) 92%, transparent 92%)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                    padding: "0 4px",
                    margin: "0 -4px",
                  }}
                >
                  Nothing left for today.
                </span>
              </>
            ) : (
              sentence
            )}
          </p>
        </div>

        <HabitDialog
          trigger={
            <Button className="w-full mt-5 h-12 md:w-auto md:mt-0 md:h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer">
              New habit
            </Button>
          }
        />
      </div>

      {topNudge && (
        <div className="mt-8">
          <SmartNudgeCard
            nudge={topNudge}
            onDismiss={handleDismissNudge}
          />
        </div>
      )}

      {allTags.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={cn(
              "h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer",
              selectedTag === null
                ? "bg-foreground text-background font-semibold"
                : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All ({habits.length})
          </button>
          {allTags.map((tag) => {
            const count = habits.filter((h) => h.tags?.includes(tag)).length
            const isSelected = selectedTag === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={cn(
                  "h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-foreground text-background font-semibold"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {tag} ({count})
              </button>
            )
          })}
        </div>
      )}

      {Object.values(logsByHabit).every((logs) => logs.length === 0) && (
        <div
          role="status"
          className="mt-8 rounded-[10px] bg-highlight px-4 py-3 text-[15px] text-foreground"
        >
          Tap today&apos;s square on a habit to check it off. That is your first check-in.
        </div>
      )}

      <WeekSheet
        className={
          Object.values(logsByHabit).every((logs) => logs.length === 0)
            ? "mt-4"
            : allTags.length > 0
              ? "mt-4"
              : undefined
        }
        habits={habitsToRender}
        days={days}
        today={today}
        logsByHabit={logsByHabit}
        notesByHabitDate={notesByHabitDate}
        pendingKeys={pendingKeys}
        streaksByHabit={streaksByHabit}
        isRecent={isRecent}
        getCellState={(habit, date) =>
          cellState(habit, date, today, logsByHabit[habit.id] ?? [])
        }
        onToggleCell={toggleCell}
        onOpenNote={(habit, date) => setActiveNoteTarget({ habit, date })}
      />

      <p className="mt-4 md:mt-5 text-[13px] md:text-[14px] text-muted-foreground">
        Tap a square to check it off, or to fill in a day you missed.
      </p>

      {totalScheduledWeek > 0 && (
        <p className="mt-7 md:mt-9 text-[18px] md:text-[20px] leading-[1.45] tracking-[-0.01em] text-foreground max-w-[600px]">
          You have done {totalCompletedWeek} of the {totalScheduledWeek} check-ins
          you planned this week,{" "}
          <strong className="font-bold">{weekCompletionRate}%</strong>.
          {bestCurrentStreak > 0 &&
            ` The longest chain right now is ${bestStreakHabitName}, at ${bestCurrentStreak} ${
              bestCurrentStreak === 1 ? "day" : "days"
            }.`}
        </p>
      )}

      {activeNoteTarget && (
        <HabitNoteDialog
          open={Boolean(activeNoteTarget)}
          onOpenChange={(open) => {
            if (!open) setActiveNoteTarget(null)
          }}
          habit={activeNoteTarget.habit}
          date={activeNoteTarget.date}
          initialNote={
            notesByHabitDate[
              `${activeNoteTarget.habit.id}:${activeNoteTarget.date}`
            ]
          }
          onSave={handleSaveNote}
        />
      )}
    </div>
  )
}
