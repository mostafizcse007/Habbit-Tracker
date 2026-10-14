"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { toggleHabitLog } from "@/app/(app)/dashboard/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HabitDialog } from "@/components/habits/habit-dialog"
import { WeekSheet } from "@/components/habits/week-sheet"
import type { CellState } from "@/components/habits/week-cell"
import { useAchievementCheck } from "@/hooks/use-achievement-check"

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
  const [today, setToday] = useState<string>("")
  const [logsByHabit, setLogsByHabit] = useState<Record<string, string[]>>({})
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLogs = async () => {
      const todayDate = getLocalDateString()
      const supabase = createClient()
      const { data, error } = await fetchAllLogs(supabase)

      if (error) {
        toast.error("Failed to load habit history")
      } else if (data) {
        const grouped: Record<string, string[]> = {}
        for (const log of data) {
          if (!grouped[log.habit_id]) {
            grouped[log.habit_id] = []
          }
          grouped[log.habit_id].push(log.completed_on)
        }
        setLogsByHabit(grouped)
      }

      setToday(todayDate)
      setIsLoading(false)
    }

    loadLogs()
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

  const dateObj = parseLocalDateString(today)
  const weekdayShort = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
  })
  const dayNum = dateObj.getDate()
  const monthShort = dateObj.toLocaleDateString("en-US", {
    month: "short",
  })
  const dateHeadline = `${weekdayShort} ${dayNum} ${monthShort}`

  if (habits.length === 0) {
    return (
      <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[52px] md:text-[72px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
              {dateHeadline}
            </h1>
            <p className="mt-[14px] md:mt-[18px] text-[16px] md:text-[19px] leading-[1.4] text-text-soft max-w-[520px]">
              No habits yet.
            </p>
          </div>
        </div>

        <div className="mt-7 md:mt-10 border-dashed border border-line-strong rounded-[14px] p-10 text-left">
          <p className="text-[15px] text-muted-foreground mb-6">
            Add your first habit and it will show up here.
          </p>
          <Link href="/habits" className={buttonVariants()}>
            Create a habit
          </Link>
        </div>
      </div>
    )
  }

  const days = getLastNDates(7, today)
  const todayWeekday = getLocalWeekday(dateObj)
  const scheduledTodayHabits = habits.filter((h) =>
    h.frequency.includes(todayWeekday)
  )
  const totalToday = scheduledTodayHabits.length
  const doneToday = scheduledTodayHabits.filter((h) =>
    (logsByHabit[h.id] ?? []).includes(today)
  ).length
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
  const streaksByHabit: Record<string, number> = {}

  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    const streaks = calculateStreaks(logs, habit.frequency, today)
    streaksByHabit[habit.id] = streaks.current

    if (streaks.current > bestCurrentStreak) {
      bestCurrentStreak = streaks.current
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
          <p className="mt-[14px] md:mt-[18px] text-[16px] md:text-[19px] leading-[1.4] text-text-soft max-w-[520px]">
            {sentence}
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

      <WeekSheet
        habits={habits}
        days={days}
        today={today}
        logsByHabit={logsByHabit}
        pendingKeys={pendingKeys}
        streaksByHabit={streaksByHabit}
        getCellState={(habit, date) =>
          cellState(habit, date, today, logsByHabit[habit.id] ?? [])
        }
        onToggleCell={toggleCell}
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
    </div>
  )
}
