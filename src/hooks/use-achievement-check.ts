"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { checkAchievements } from "@/app/(app)/achievements/actions"
import { ACHIEVEMENTS } from "@/lib/achievements"

export function showAchievementToasts(
  newlyUnlocked: string[],
  router: { push: (href: string) => void }
): void {
  if (!newlyUnlocked || newlyUnlocked.length === 0) {
    return
  }

  if (newlyUnlocked.length <= 3) {
    for (const key of newlyUnlocked) {
      const def = ACHIEVEMENTS.find((a) => a.key === key)
      if (def) {
        toast(`Achievement unlocked: ${def.title}`, {
          description: def.description,
          action: {
            label: "View",
            onClick: () => router.push("/achievements"),
          },
        })
      }
    }
  } else {
    toast(`${newlyUnlocked.length} achievements unlocked`, {
      description: "See them on the Achievements page.",
      action: {
        label: "View",
        onClick: () => router.push("/achievements"),
      },
    })
  }
}

export function useAchievementCheck(): { scheduleCheck: () => void } {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isRunningRef = useRef<boolean>(false)
  const rerunRequestedRef = useRef<boolean>(false)

  const runCheck = useCallback(async () => {
    if (isRunningRef.current) {
      rerunRequestedRef.current = true
      return
    }

    isRunningRef.current = true

    try {
      while (true) {
        rerunRequestedRef.current = false
        try {
          const result = await checkAchievements()
          if (
            result &&
            "success" in result &&
            result.newlyUnlocked.length > 0
          ) {
            showAchievementToasts(result.newlyUnlocked, router)
          }
        } catch {
        }
        if (!rerunRequestedRef.current) {
          break
        }
      }
    } finally {
      isRunningRef.current = false
    }
  }, [router])

  const scheduleCheck = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void runCheck()
    }, 1500)
  }, [runCheck])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  return { scheduleCheck }
}
