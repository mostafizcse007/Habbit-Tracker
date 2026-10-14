"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarCheck,
  Check,
  Crown,
  Flame,
  ListChecks,
  Medal,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import { checkAchievements } from "@/app/(app)/achievements/actions"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { showAchievementToasts } from "@/hooks/use-achievement-check"
import { cn } from "@/lib/utils"

interface AchievementsViewProps {
  initialAchievements: {
    key: string
    unlocked_at: string
  }[]
}

const ICONS: Record<string, LucideIcon> = {
  Check,
  ListChecks,
  Medal,
  Trophy,
  Flame,
  CalendarCheck,
  Crown,
  Sparkles,
  Star,
  RotateCcw,
}

function formatUnlockedDate(unlockedAt: string): string {
  const d = new Date(unlockedAt)
  const day = d.getDate()
  const month = d.toLocaleDateString("en-US", { month: "short" })
  const year = d.getFullYear()
  return `Unlocked ${day} ${month} ${year}`
}

function getProgress(
  key: string,
  stats: { totalCheckIns: number; longestStreak: number } | null
): { current: number; max: number; text: string; percent: number } | null {
  if (!stats) return null
  if (key === "checkins_25") {
    const current = Math.min(stats.totalCheckIns, 25)
    const percent = Math.min(Math.round((current / 25) * 100), 100)
    return { current, max: 25, text: `${current} of 25`, percent }
  }
  if (key === "checkins_100") {
    const current = Math.min(stats.totalCheckIns, 100)
    const percent = Math.min(Math.round((current / 100) * 100), 100)
    return { current, max: 100, text: `${current} of 100`, percent }
  }
  if (key === "checkins_500") {
    const current = Math.min(stats.totalCheckIns, 500)
    const percent = Math.min(Math.round((current / 500) * 100), 100)
    return { current, max: 500, text: `${current} of 500`, percent }
  }
  if (key === "streak_7") {
    const current = Math.min(stats.longestStreak, 7)
    const percent = Math.min(Math.round((current / 7) * 100), 100)
    return { current, max: 7, text: `${current} of 7 days`, percent }
  }
  if (key === "streak_30") {
    const current = Math.min(stats.longestStreak, 30)
    const percent = Math.min(Math.round((current / 30) * 100), 100)
    return { current, max: 30, text: `${current} of 30 days`, percent }
  }
  if (key === "streak_100") {
    const current = Math.min(stats.longestStreak, 100)
    const percent = Math.min(Math.round((current / 100) * 100), 100)
    return { current, max: 100, text: `${current} of 100 days`, percent }
  }
  return null
}

export function AchievementsView({
  initialAchievements,
}: AchievementsViewProps) {
  const router = useRouter()
  const hasSyncedRef = useRef(false)
  const [unlockedRows, setUnlockedRows] = useState(initialAchievements)
  const [stats, setStats] = useState<{
    totalCheckIns: number
    longestStreak: number
  } | null>(null)

  useEffect(() => {
    if (hasSyncedRef.current) return
    hasSyncedRef.current = true

    let active = true
    const sync = async () => {
      const res = await checkAchievements({ revalidate: false })
      if (active && res && "success" in res) {
        setUnlockedRows(res.unlocked)
        setStats(res.stats)
        if (res.newlyUnlocked.length > 0) {
          showAchievementToasts(res.newlyUnlocked, router)
        }
      }
    }
    void sync()
    return () => {
      active = false
    }
  }, [router])

  const unlockedMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of unlockedRows) {
      map.set(r.key, r.unlocked_at)
    }
    return map
  }, [unlockedRows])

  const { list, unlockedCount, totalCount } = useMemo(() => {
    const unlockedList: {
      key: string
      title: string
      description: string
      icon: string
      unlocked_at: string
    }[] = []
    const lockedList: {
      key: string
      title: string
      description: string
      icon: string
    }[] = []

    for (const def of ACHIEVEMENTS) {
      const unlockedAt = unlockedMap.get(def.key)
      if (unlockedAt) {
        unlockedList.push({
          ...def,
          unlocked_at: unlockedAt,
        })
      } else {
        lockedList.push(def)
      }
    }

    unlockedList.sort((a, b) => b.unlocked_at.localeCompare(a.unlocked_at))

    return {
      unlockedCount: unlockedList.length,
      totalCount: ACHIEVEMENTS.length,
      list: [
        ...unlockedList.map((item) => ({ ...item, isUnlocked: true })),
        ...lockedList.map((item) => ({
          ...item,
          isUnlocked: false,
          unlocked_at: "",
        })),
      ],
    }
  }, [unlockedMap])

  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
      <div>
        <h1 className="text-[44px] md:text-[56px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
          Achievements
        </h1>
        <p className="mt-[14px] md:mt-[18px] text-[16px] md:text-[19px] leading-[1.4] text-text-soft">
          {unlockedCount} of {totalCount} unlocked. Badges unlock on their own as
          you check in.
        </p>
      </div>

      <div className="mt-10 bg-card border border-border rounded-[14px] p-6">
        <div
          role="list"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {list.map((badge) => {
            const Icon = ICONS[badge.icon]
            const isUnlocked = badge.isUnlocked
            const progress = !isUnlocked
              ? getProgress(badge.key, stats)
              : null

            return (
              <div
                key={badge.key}
                role="listitem"
                aria-label={
                  isUnlocked
                    ? `${badge.title}, unlocked`
                    : `${badge.title}, locked`
                }
                className={cn(
                  "rounded-[10px] p-5 flex gap-4 items-start",
                  isUnlocked
                    ? "bg-highlight border border-transparent"
                    : "border border-dashed border-line-strong bg-transparent"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "size-6 shrink-0 stroke-2",
                      isUnlocked ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2
                    className={cn(
                      "text-[17px] font-semibold leading-snug",
                      isUnlocked ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {badge.title}
                  </h2>
                  <p className="text-[14px] text-muted-foreground mt-0.5 leading-normal">
                    {badge.description}
                  </p>
                  <div
                    className={cn(
                      "text-[13px] mt-2",
                      isUnlocked ? "text-text-soft" : "text-muted-foreground"
                    )}
                  >
                    {isUnlocked
                      ? formatUnlockedDate(badge.unlocked_at)
                      : "Locked"}
                  </div>
                  {progress && (
                    <div className="mt-2">
                      <div className="text-[13px] text-muted-foreground">
                        {progress.text}
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={progress.current}
                        aria-valuemin={0}
                        aria-valuemax={progress.max}
                        className="h-1.5 rounded-full bg-muted overflow-hidden mt-2"
                      >
                        <div
                          className="h-full rounded-full bg-foreground transition-all duration-300"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
