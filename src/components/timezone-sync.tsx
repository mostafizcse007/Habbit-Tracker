"use client"

import { useEffect, useRef } from "react"
import { saveDetectedTimezone } from "@/app/(app)/profile/actions"

interface TimezoneSyncProps {
  hasTimezone: boolean
}

export function TimezoneSync({ hasTimezone }: TimezoneSyncProps) {
  const syncedRef = useRef(false)

  useEffect(() => {
    if (!hasTimezone && !syncedRef.current) {
      syncedRef.current = true
      const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (detectedZone) {
        saveDetectedTimezone(detectedZone)
      }
    }
  }, [hasTimezone])

  return null
}
