"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error("AuthRouteError", error.message, {
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm text-center">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Authentication Error
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          An error occurred while communicating with the authentication service.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button onClick={() => reset()} className="flex-1 h-10">
            Try again
          </Button>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline" }), "flex-1 h-10")}
          >
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
