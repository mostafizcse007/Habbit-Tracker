"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error("AppError", error.message, {
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])
  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <h1 className="text-4xl sm:text-[56px] font-bold tracking-tight text-foreground leading-tight">
        Something went wrong
      </h1>
      <p className="text-[16px] text-muted-foreground mt-4 max-w-[480px]">
        An unexpected error occurred while loading this page.
      </p>
      <div className="mt-8">
        <Button onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}
