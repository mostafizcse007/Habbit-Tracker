"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function StreakNumber({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const prevRef = useRef(value)
  const isMountedRef = useRef(false)
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    if (prevRef.current !== value) {
      prevRef.current = value
      setChanged(true)
      const timer = setTimeout(() => {
        setChanged(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [value])

  return (
    <span
      key={value}
      className={cn(className, changed && "anim-streak-in inline-block")}
    >
      {value}
    </span>
  )
}
