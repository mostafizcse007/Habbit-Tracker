"use client"

import { useEffect } from "react"
import Link from "next/link"
import { logger } from "@/lib/logger"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error("GlobalRootError", error.message, {
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center mb-5 text-xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Critical Error
          </h1>
          <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
            A critical system error occurred. We have logged the incident and our team is notified.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
