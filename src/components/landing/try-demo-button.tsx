"use client"

import { useActionState } from "react"
import { startDemo } from "@/app/(auth)/actions"
import { cn } from "@/lib/utils"

interface TryDemoButtonProps {
  variant?: "button" | "link"
  className?: string
}

export function TryDemoButton({
  variant = "button",
  className,
}: TryDemoButtonProps) {
  const [state, formAction, isPending] = useActionState(startDemo, null)

  if (variant === "link") {
    return (
      <form action={formAction} className={cn("inline-block", className)}>
        <button
          type="submit"
          disabled={isPending}
          className="relative inline-flex items-center min-h-[44px] md:min-h-0 text-[14px] text-[#C3C7CC] hover:text-[#F3F4F1] dark:text-muted-foreground dark:hover:text-foreground underline hover:opacity-80 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
        >
          {isPending ? "Opening demo..." : "or try the demo first"}
        </button>
        {state?.error && (
          <p role="alert" className="mt-1 text-[14px] text-destructive">
            {state.error}
          </p>
        )}
      </form>
    )
  }

  return (
    <form action={formAction} className={cn("w-full sm:w-auto", className)}>
      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto inline-flex items-center justify-center h-[52px] px-7 rounded-[10px] border border-input bg-card text-foreground text-[16px] font-semibold hover:bg-muted transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {isPending ? "Opening demo..." : "Try the demo"}
      </button>
      {state?.error && (
        <p role="alert" className="mt-2 text-[14px] text-destructive">
          {state.error}
        </p>
      )}
    </form>
  )
}
