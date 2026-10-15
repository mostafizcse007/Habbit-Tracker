"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useJustChanged(durationMs = 600) {
  const [recentKey, setRecentKey] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const mark = useCallback(
    (key: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      setRecentKey(key)
      timerRef.current = setTimeout(() => {
        setRecentKey((current) => (current === key ? null : current))
        timerRef.current = null
      }, durationMs)
    },
    [durationMs]
  )

  const isRecent = useCallback(
    (key: string) => recentKey === key,
    [recentKey]
  )

  return { mark, isRecent }
}
