"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { Habit } from "@/types"
import {
  addDaysToDateString,
  getLocalDateString,
  getLocalWeekday,
  parseLocalDateString,
} from "@/lib/dates"
import {
  buildHeatmapWeeks,
  getMonthLabel,
} from "@/lib/calendar"
import {
  buildDailyCompletion,
  buildHighlights,
  calculateHabitBreakdown,
  calculatePeriodLongestStreak,
  getWeekdayTotals,
  groupWeekly,
  summarizeRange,
  type DailyPoint,
  type HabitInput,
} from "@/lib/analytics"
import { getBestAndWorstWeekday } from "@/lib/stats"
import { fetchAllLogs } from "@/lib/logs"
import { createClient } from "@/lib/supabase/client"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { WeekdayBarChart } from "@/components/habits/weekday-bar-chart"
import { cn } from "@/lib/utils"
import { generateWeeklyReview } from "@/app/(app)/analytics/actions"
import { leaveDemo } from "@/app/(auth)/actions"
import { getReviewPeriod } from "@/lib/review"

export interface WeeklyReviewData {
  period_end: string
  content: string
  generations: number
  updated_at: string
}

interface AnalyticsViewProps {
  habits: Habit[]
  period?: {
    start: string
    end: string
  }
  initialReview?: WeeklyReviewData | null
  isDemo?: boolean
}

const WEEKDAY_PLURALS: Record<number, string> = {
  1: "Mondays",
  2: "Tuesdays",
  3: "Wednesdays",
  4: "Thursdays",
  5: "Fridays",
  6: "Saturdays",
  0: "Sundays",
}

function formatSquareTitleDate(dateStr: string): string {
  const d = parseLocalDateString(dateStr)
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" })
  const day = d.getDate()
  const month = d.toLocaleDateString("en-US", { month: "short" })
  const year = d.getFullYear()
  return `${weekday} ${day} ${month} ${year}`
}

function formatPeriodDate(dateStr: string): string {
  const d = parseLocalDateString(dateStr)
  const month = d.toLocaleDateString("en-US", { month: "short" })
  return `${d.getDate()} ${month}`
}

interface ChartTooltipPayload {
  payload?: {
    date: string
    isWeek?: boolean
    rate: number | null
    completed: number
    scheduled: number
  }
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayload[]
}

function CustomChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null
  }
  const item = payload[0].payload
  if (item.rate === null) {
    return null
  }

  const d = parseLocalDateString(item.date)
  const dateStr = `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`
  const title = item.isWeek ? `Week of ${dateStr}` : dateStr

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-[13px] shadow-none">
      <div className="text-muted-foreground">{title}</div>
      <div className="mt-1 font-semibold text-foreground">{item.rate}%</div>
      <div className="text-muted-foreground">
        {item.completed} of {item.scheduled} check-ins
      </div>
    </div>
  )
}

export function AnalyticsView({
  habits,
  period,
  initialReview,
  isDemo = false,
}: AnalyticsViewProps) {
  const [today, setToday] = useState<string>("")
  const [logsByHabit, setLogsByHabit] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [range, setRange] = useState<7 | 30 | 90 | "all">(30)
  const [breakdownView, setBreakdownView] = useState<"habit" | "tag">("habit")

  const [review, setReview] = useState<WeeklyReviewData | null>(
    initialReview ?? null
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [notEnough, setNotEnough] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const activePeriod = useMemo(() => {
    if (period) return period
    return getReviewPeriod(getLocalDateString())
  }, [period])

  const handleGenerateReview = async (regenerate: boolean) => {
    setReviewError(null)
    setIsGenerating(true)
    try {
      const res = await generateWeeklyReview(regenerate)
      if ("error" in res) {
        setReviewError(res.error)
      } else if ("notEnough" in res) {
        setNotEnough(true)
      } else if (res.success) {
        setReview(res.review)
      }
    } catch {
      setReviewError("Could not write your review right now. Try again later.")
    } finally {
      setIsGenerating(false)
    }
  }

  const mapScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadLogs = async () => {
      const todayStr = getLocalDateString()
      const supabase = createClient()
      const { data, error } = await fetchAllLogs(supabase)

      if (error) {
        toast.error("Failed to load habit history")
      } else if (data) {
        const habitIdSet = new Set(habits.map((h) => h.id))
        const grouped: Record<string, string[]> = {}
        for (const log of data) {
          if (habitIdSet.has(log.habit_id)) {
            if (!grouped[log.habit_id]) {
              grouped[log.habit_id] = []
            }
            grouped[log.habit_id].push(log.completed_on)
          }
        }
        setLogsByHabit(grouped)
      }

      setToday(todayStr)
      setIsLoading(false)
    }

    loadLogs()
  }, [habits])

  useEffect(() => {
    if (!isLoading && mapScrollRef.current) {
      mapScrollRef.current.scrollLeft = mapScrollRef.current.scrollWidth
    }
  }, [isLoading])

  const habitInputs = useMemo<HabitInput[]>(() => {
    return habits.map((h) => ({
      id: h.id,
      name: h.name,
      color: h.color,
      frequency: h.frequency,
      createdOn: getLocalDateString(new Date(h.created_at)),
    }))
  }, [habits])

  const earliestDate = useMemo(() => {
    if (!today) return ""
    let earliest = today
    for (const h of habits) {
      const d = getLocalDateString(new Date(h.created_at))
      if (d < earliest) earliest = d
    }
    for (const logs of Object.values(logsByHabit)) {
      for (const d of logs) {
        if (d < earliest) earliest = d
      }
    }
    return earliest
  }, [habits, logsByHabit, today])

  const startDate = useMemo(() => {
    if (!today) return ""
    if (range === "all") return earliestDate
    return addDaysToDateString(today, -(range - 1))
  }, [today, range, earliestDate])

  const effectiveDays = useMemo(() => {
    if (range !== "all") return range
    if (!startDate || !today) return 30
    const startObj = parseLocalDateString(startDate)
    const todayObj = parseLocalDateString(today)
    const diff = Math.max(
      1,
      Math.round((todayObj.getTime() - startObj.getTime()) / 86400000) + 1
    )
    return diff
  }, [range, startDate, today])

  const dailyPoints = useMemo(() => {
    if (!today || !startDate) return []
    return buildDailyCompletion(habitInputs, logsByHabit, startDate, today)
  }, [habitInputs, logsByHabit, startDate, today])

  const weeklyPoints = useMemo(() => {
    return groupWeekly(dailyPoints)
  }, [dailyPoints])

  const summary = useMemo(() => {
    return summarizeRange(dailyPoints)
  }, [dailyPoints])

  const habitBreakdown = useMemo(() => {
    if (!today || !startDate) return []
    return calculateHabitBreakdown(habitInputs, logsByHabit, startDate, today)
  }, [habitInputs, logsByHabit, startDate, today])

  const tagBreakdown = useMemo(() => {
    if (!today || !startDate) return []
    const tagMap = new Map<
      string,
      { scheduled: number; completed: number; habitCount: number }
    >()
    for (const habit of habits) {
      const tags =
        habit.tags && habit.tags.length > 0 ? habit.tags : ["Untagged"]
      const item = habitBreakdown.find((b) => b.id === habit.id)
      if (!item) continue
      for (const tag of tags) {
        const current = tagMap.get(tag) ?? {
          scheduled: 0,
          completed: 0,
          habitCount: 0,
        }
        current.scheduled += item.scheduled
        current.completed += item.completed
        current.habitCount += 1
        tagMap.set(tag, current)
      }
    }

    return Array.from(tagMap.entries())
      .map(([tag, data]) => ({
        tag,
        scheduled: data.scheduled,
        completed: data.completed,
        habitCount: data.habitCount,
        rate:
          data.scheduled > 0
            ? Math.round((data.completed / data.scheduled) * 100)
            : null,
      }))
      .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
  }, [habits, habitBreakdown, startDate, today])

  const weekdayTotals = useMemo(() => {
    if (!today) return []
    return getWeekdayTotals(habitInputs, logsByHabit, effectiveDays, today)
  }, [habitInputs, logsByHabit, effectiveDays, today])

  const highlights = useMemo(() => {
    if (!today) return []
    return buildHighlights({
      habits: habitInputs,
      logsByHabit,
      days: effectiveDays,
      today,
      habitBreakdown,
      weekdayTotals,
      currentSummary: summary,
    })
  }, [habitInputs, logsByHabit, effectiveDays, today, habitBreakdown, weekdayTotals, summary])

  const longestStreakData = useMemo(() => {
    if (!today || !startDate) return { max: 0, habitName: "" }
    let max = 0
    let habitName = ""
    for (const h of habits) {
      const logs = logsByHabit[h.id] ?? []
      const habitCreatedOn = getLocalDateString(new Date(h.created_at))
      const periodStreak = calculatePeriodLongestStreak(
        logs,
        h.frequency,
        startDate,
        today,
        habitCreatedOn
      )
      if (periodStreak > max) {
        max = periodStreak
        habitName = h.name
      }
    }
    return { max, habitName }
  }, [habits, logsByHabit, startDate, today])

  const checkInsCount = useMemo(() => {
    if (range === "all") {
      let count = 0
      for (const h of habits) {
        count += (logsByHabit[h.id] ?? []).length
      }
      return count
    }
    if (!startDate || !today) return 0
    let count = 0
    for (const h of habits) {
      for (const d of logsByHabit[h.id] ?? []) {
        if (d >= startDate && d <= today) {
          count++
        }
      }
    }
    return count
  }, [range, habits, logsByHabit, startDate, today])

  const chartData = useMemo(() => {
    if (range === 90 || (range === "all" && dailyPoints.length > 35)) {
      return weeklyPoints.map((p) => ({
        date: p.weekStart,
        rate: p.rate,
        completed: p.completed,
        scheduled: p.scheduled,
        isWeek: true,
      }))
    }
    return dailyPoints.map((p) => ({
      date: p.date,
      rate: p.rate,
      completed: p.completed,
      scheduled: p.scheduled,
      isWeek: false,
    }))
  }, [range, weeklyPoints, dailyPoints])

  const validChartPointsCount = useMemo(() => {
    return chartData.filter((p) => p.rate !== null).length
  }, [chartData])

  const weekdayCaption = useMemo(() => {
    const { best, worst } = getBestAndWorstWeekday(weekdayTotals, 3)
    if (best && worst) {
      return `Strongest on ${WEEKDAY_PLURALS[best.weekday]} at ${best.rate}%, weakest on ${WEEKDAY_PLURALS[worst.weekday]} at ${worst.rate}%.`
    }
    if (best) {
      return `Strongest on ${WEEKDAY_PLURALS[best.weekday]} at ${best.rate}%.`
    }
    return "Not enough history yet."
  }, [weekdayTotals])

  const heatmapWeeks = useMemo(() => {
    if (!today) return []
    return buildHeatmapWeeks(today, 53)
  }, [today])

  const consistencyDailyMap = useMemo(() => {
    if (!today || heatmapWeeks.length === 0) {
      return new Map<string, DailyPoint>()
    }
    const firstMonday = heatmapWeeks[0][0]
    if (!firstMonday) {
      return new Map<string, DailyPoint>()
    }

    const points = buildDailyCompletion(
      habitInputs,
      logsByHabit,
      firstMonday,
      today
    )
    const map = new Map<string, DailyPoint>()
    for (const p of points) {
      map.set(p.date, p)
    }
    return map
  }, [today, heatmapWeeks, habitInputs, logsByHabit])

  const heatmapMonthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = []
    let previousMonth = ""
    heatmapWeeks.forEach((week, index) => {
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
  }, [heatmapWeeks])

  const consistencyStats = useMemo(() => {
    let checkIns = 0
    let activeDays = 0
    for (const p of consistencyDailyMap.values()) {
      if (p.completed > 0) {
        checkIns += p.completed
        activeDays++
      }
    }
    return { checkIns, activeDays }
  }, [consistencyDailyMap])

  if (isLoading || !today) {
    return (
      <div className="pt-7 md:pt-14 pb-14 md:pb-[72px] space-y-6">
        <h1 className="sr-only">Analytics</h1>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Skeleton className="h-[44px] md:h-[56px] w-64" />
            <Skeleton className="h-5 w-80 mt-3" />
          </div>
          <Skeleton className="h-11 w-64 rounded-[10px]" />
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

        <div className="mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-full max-w-[480px]" />
          <Skeleton className="h-5 w-full max-w-[420px]" />
        </div>

        <div className="mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-[260px] w-full rounded-lg mt-4" />
        </div>

        <div className="mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        <div className="mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-3 h-28 items-end">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-11 rounded-md" />
            ))}
          </div>
        </div>

        <div className="mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-[120px] w-full" />
        </div>
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
        <h1 className="text-[44px] md:text-[56px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
          Analytics
        </h1>
        <p className="mt-[14px] md:mt-[18px] text-[16px] md:text-[19px] leading-[1.4] text-text-soft">
          How consistent you have been across all habits.
        </p>

        <div className="mt-8 border-dashed border border-line-strong rounded-[14px] p-10 text-left">
          <p className="text-[17px] font-semibold text-foreground">
            Analytics appear once you have habits.
          </p>
          <div className="mt-6">
            <Link href="/habits" className={buttonVariants()}>
              Create a habit
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[44px] md:text-[56px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
            Analytics
          </h1>
          <p className="mt-[14px] md:mt-[18px] text-[16px] md:text-[19px] leading-[1.4] text-text-soft">
            How consistent you have been across all habits.
          </p>
        </div>

        <div className="border border-border rounded-[10px] p-1 inline-flex gap-1 self-start md:self-auto">
          {([7, 30, 90, "all"] as const).map((r) => {
            const isSelected = range === r
            const label = r === "all" ? "All time" : `${r} days`
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                aria-pressed={isSelected}
                className={cn(
                  "h-9 px-3 rounded-lg text-[14px] font-semibold cursor-pointer transition-colors relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        style={{ "--i": 0 } as React.CSSProperties}
        className="anim-reveal mt-8 bg-card border border-border rounded-[14px] overflow-hidden"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          <div className="bg-card p-4 sm:p-5 md:p-6">
            <div className="text-[36px] font-bold leading-none tracking-[-0.03em] tabular-nums text-foreground">
              {summary.rate !== null ? `${summary.rate}%` : "—"}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2">
              Completion
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 md:p-6">
            <div className="text-[36px] font-bold leading-none tracking-[-0.03em] tabular-nums text-foreground">
              {summary.perfectDays}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2">
              Perfect days
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 md:p-6">
            <div className="text-[36px] font-bold leading-none tracking-[-0.03em] tabular-nums text-foreground">
              {checkInsCount}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2">
              Check-ins
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 md:p-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] font-bold leading-none tracking-[-0.03em] tabular-nums text-foreground">
                {longestStreakData.max}
              </span>
              <span className="text-[14px] text-muted-foreground font-normal">
                {longestStreakData.max === 1 ? "day" : "days"}
              </span>
            </div>
            <div
              className="text-[13px] text-muted-foreground mt-2 truncate"
              title={
                longestStreakData.max > 0 && longestStreakData.habitName
                  ? `Longest chain · ${longestStreakData.habitName}`
                  : "Longest chain"
              }
            >
              {longestStreakData.max > 0 && longestStreakData.habitName
                ? `Longest chain · ${longestStreakData.habitName}`
                : "Longest chain"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ "--i": 1 } as React.CSSProperties}
        className="anim-reveal mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <h2 className="text-[17px] font-semibold text-foreground">
            Weekly review
          </h2>
          <span className="text-[14px] text-muted-foreground tabular-nums">
            {formatPeriodDate(activePeriod.start)} to {formatPeriodDate(activePeriod.end)}
          </span>
        </div>

        <div className="mt-4">
          {isDemo ? (
            <div className="space-y-4">
              <p className="text-[15px] text-text-soft">
                Weekly reviews need a real account.
              </p>
              <div>
                <form action={leaveDemo}>
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer transition-colors hover:bg-primary/90"
                  >
                    Create your account
                  </button>
                </form>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  disabled
                  className="h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold opacity-60 cursor-not-allowed"
                >
                  Writing...
                </button>
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          ) : review ? (
            <div>
              <div>
                {review.content
                  .split(/\n\s*\n/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((para, idx) => (
                    <p
                      key={idx}
                      className={cn(
                        "text-[18px] leading-[1.5] text-foreground",
                        idx > 0 && "mt-4"
                      )}
                    >
                      {para}
                    </p>
                  ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <span className="text-[13px] text-muted-foreground">
                  Written by AI from your numbers. It can make mistakes.
                </span>
                <div className="flex items-center gap-2">
                  {review.generations >= 3 ? (
                    <span className="text-[14px] text-muted-foreground">
                      No regenerations left for this week.
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleGenerateReview(true)}
                        className="relative inline-flex items-center min-h-[44px] md:min-h-0 text-[14px] text-foreground hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Regenerate
                      </button>
                      <span className="text-[14px] text-muted-foreground">
                        {3 - review.generations} left
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : notEnough ? (
            <div>
              <p className="text-[15px] text-muted-foreground">
                Not enough history yet. Reviews appear after a few days of check-ins.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[15px] text-text-soft">
                Get a short written summary of your last 7 days, with one suggestion for
                the week ahead.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => handleGenerateReview(false)}
                  className="h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer transition-colors hover:bg-primary/90"
                >
                  Generate review
                </button>
              </div>
            </div>
          )}

          {reviewError && (
            <p role="alert" className="mt-3 text-[14px] text-destructive">
              {reviewError}
            </p>
          )}

          <p className="mt-4 text-[13px] text-muted-foreground">
            Habit names and weekly numbers are sent to Google&apos;s Gemini API to write
            the review.
          </p>
        </div>
      </div>

      <div
        style={{ "--i": 2 } as React.CSSProperties}
        className="anim-reveal mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 overflow-hidden"
      >
        <h2 className="text-[17px] font-semibold text-foreground">
          What stands out
        </h2>
        <div className="mt-4">
          {highlights.map((sentence, idx) => (
            <p
              key={idx}
              className={cn(
                "text-[18px] leading-[1.45] text-foreground",
                idx > 0 && "mt-3"
              )}
            >
              {sentence}
            </p>
          ))}
        </div>
      </div>

      <div
        style={{ "--i": 3 } as React.CSSProperties}
        className="anim-reveal mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-foreground">
              Completion over time
            </h2>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Share of scheduled check-ins you completed
            </p>
          </div>
          <span className="text-[14px] text-muted-foreground">
            {range === "all" ? "All time" : `${range} days`}
          </span>
        </div>

        {validChartPointsCount < 2 ? (
          <div className="h-[220px] md:h-[260px] flex items-center justify-center text-[15px] text-text-soft">
            Not enough history yet.
          </div>
        ) : (
          <div
            role="img"
            aria-label={
              range === "all"
                ? `Completion rate all-time: averaging ${summary.rate ?? 0}%, with ${summary.completed} of ${summary.scheduled} check-ins completed`
                : `Completion rate over the last ${range} days: averaging ${summary.rate ?? 0}%, with ${summary.completed} of ${summary.scheduled} check-ins completed`
            }
            className="w-full h-[220px] md:h-[260px] mt-6 min-w-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(dateStr: string) => {
                    const d = parseLocalDateString(dateStr)
                    return `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`
                  }}
                  minTickGap={24}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--foreground)" }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div
        style={{ "--i": 4 } as React.CSSProperties}
        className="anim-reveal mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] font-semibold text-foreground">
              Breakdown
            </h2>
            <div className="flex items-center p-0.5 rounded-lg bg-muted text-[13px] font-medium">
              <button
                type="button"
                onClick={() => setBreakdownView("habit")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                  breakdownView === "habit"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                By Habit
              </button>
              <button
                type="button"
                onClick={() => setBreakdownView("tag")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                  breakdownView === "tag"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                By Category
              </button>
            </div>
          </div>
          <span className="text-[14px] text-muted-foreground">
            {range === "all" ? "All time" : `Last ${range} days`}
          </span>
        </div>

        <div className="space-y-4 mt-4">
          {breakdownView === "habit" ? (
            habitBreakdown.map((item) => (
              <div
                key={item.id}
                className="min-h-[44px] flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4"
              >
                <div className="flex items-center justify-between md:justify-start gap-3 min-w-0 md:w-[240px] shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="size-[10px] rounded-[3px] shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-[16px] font-semibold text-foreground truncate">
                        <Link
                          href={`/habits/${item.id}`}
                          className="hover:underline"
                        >
                          {item.name}
                        </Link>
                      </div>
                      <div className="text-[13px] text-muted-foreground">
                        {item.completed} of {item.scheduled} days
                      </div>
                    </div>
                  </div>
                  <div className="md:hidden text-[15px] font-semibold tabular-nums text-foreground">
                    {item.rate !== null ? `${item.rate}%` : "—"}
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={item.rate ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.name} completion rate: ${item.rate !== null ? `${item.rate}%` : "no scheduled days"}`}
                  className="h-2 rounded-full bg-muted flex-1 overflow-hidden"
                >
                  {item.rate !== null && item.rate > 0 && (
                    <div
                      className="anim-grow-x h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.rate}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  )}
                </div>

                <div className="hidden md:block text-[15px] font-semibold tabular-nums text-foreground w-12 text-right">
                  {item.rate !== null ? `${item.rate}%` : "—"}
                </div>
              </div>
            ))
          ) : tagBreakdown.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-[14px]">
              No habits with categories or tags yet.
            </div>
          ) : (
            tagBreakdown.map((item) => (
              <div
                key={item.tag}
                className="min-h-[44px] flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4"
              >
                <div className="flex items-center justify-between md:justify-start gap-3 min-w-0 md:w-[240px] shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="size-2 rounded-full shrink-0 bg-primary" />
                    <div className="min-w-0">
                      <div className="text-[16px] font-semibold text-foreground truncate">
                        {item.tag}
                      </div>
                      <div className="text-[13px] text-muted-foreground">
                        {item.completed} of {item.scheduled} days • {item.habitCount}{" "}
                        {item.habitCount === 1 ? "habit" : "habits"}
                      </div>
                    </div>
                  </div>
                  <div className="md:hidden text-[15px] font-semibold tabular-nums text-foreground">
                    {item.rate !== null ? `${item.rate}%` : "—"}
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={item.rate ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.tag} category completion rate: ${item.rate !== null ? `${item.rate}%` : "no scheduled days"}`}
                  className="h-2 rounded-full bg-muted flex-1 overflow-hidden"
                >
                  {item.rate !== null && item.rate > 0 && (
                    <div
                      className="anim-grow-x h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${item.rate}%`,
                      }}
                    />
                  )}
                </div>

                <div className="hidden md:block text-[15px] font-semibold tabular-nums text-foreground w-12 text-right">
                  {item.rate !== null ? `${item.rate}%` : "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <WeekdayBarChart
        style={{ "--i": 5 } as React.CSSProperties}
        className="anim-reveal"
        rates={weekdayTotals}
        color="var(--foreground)"
        caption={weekdayCaption}
        daysLabel={range === "all" ? "All time" : `Last ${range} days`}
        isScheduled={(weekday) =>
          habits.some((h) => h.frequency.includes(weekday))
        }
      />

      <div
        style={{ "--i": 6 } as React.CSSProperties}
        className="anim-reveal mt-6 bg-card border border-border rounded-[14px] p-4 sm:p-6 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-[17px] font-semibold text-foreground">
            Consistency map
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
            <span>Less</span>
            <span className="size-[12px] rounded-[3px] bg-muted" />
            <span className="size-[12px] rounded-[3px] bg-foreground/25" />
            <span className="size-[12px] rounded-[3px] bg-foreground/50" />
            <span className="size-[12px] rounded-[3px] bg-foreground/75" />
            <span className="size-[12px] rounded-[3px] bg-foreground" />
            <span>More</span>
          </div>
        </div>

        <div ref={mapScrollRef} className="overflow-x-auto pb-2 min-w-0 max-w-full">
          <div
            role="img"
            aria-label={`Consistency map for the last 12 months: ${consistencyStats.checkIns} check-ins across ${consistencyStats.activeDays} active days`}
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
                {heatmapMonthLabels.map((item) => (
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
                {heatmapWeeks.flatMap((week, weekIndex) =>
                  week.map((date, dayIndex) => {
                    if (!date || date > today) {
                      return (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="size-[12px]"
                          style={{ visibility: "hidden" }}
                          aria-hidden="true"
                        />
                      )
                    }

                    const point = consistencyDailyMap.get(date)
                    const scheduled = point?.scheduled ?? 0
                    const completed = point?.completed ?? 0
                    const rate = point?.rate ?? null
                    const isToday = date === today

                    let colorClass = "bg-muted/30"
                    let title = `${formatSquareTitleDate(date)}: No check-ins scheduled`

                    if (scheduled > 0) {
                      title = `${formatSquareTitleDate(date)}: ${rate ?? 0}% (${completed} of ${scheduled})`
                      if (rate === 0 || rate === null) {
                        colorClass = "bg-muted"
                      } else if (rate <= 33) {
                        colorClass = "bg-foreground/25"
                      } else if (rate <= 66) {
                        colorClass = "bg-foreground/50"
                      } else if (rate <= 99) {
                        colorClass = "bg-foreground/75"
                      } else {
                        colorClass = "bg-foreground"
                      }
                    } else if (isToday) {
                      const weekday = getLocalWeekday(
                        parseLocalDateString(today)
                      )
                      const todayScheduled = habitInputs.filter(
                        (h) =>
                          h.frequency.includes(weekday) &&
                          today >= h.createdOn
                      ).length
                      if (todayScheduled > 0) {
                        title = `${formatSquareTitleDate(date)}: 0% (0 of ${todayScheduled})`
                      }
                    }

                    return (
                      <div
                        key={date}
                        title={title}
                        className={cn(
                          "size-[12px] rounded-[3px]",
                          colorClass,
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
    </div>
  )
}
