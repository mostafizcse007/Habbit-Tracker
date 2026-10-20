"use client"

import Link from "next/link"
import { Sparkles, Flame, AlertCircle, RefreshCw, X, ArrowRight } from "lucide-react"
import type { SmartNudge } from "@/lib/nudges"
import { cn } from "@/lib/utils"

interface SmartNudgeCardProps {
  nudge: SmartNudge
  onDismiss: (id: string) => void
  className?: string
}

export function SmartNudgeCard({
  nudge,
  onDismiss,
  className,
}: SmartNudgeCardProps) {
  const getIcon = () => {
    switch (nudge.type) {
      case "milestone":
        return <Flame className="size-4 text-orange-500 shrink-0" />
      case "warning":
        return <AlertCircle className="size-4 text-amber-500 shrink-0" />
      case "nudge":
        return <RefreshCw className="size-4 text-emerald-500 shrink-0" />
      case "encouragement":
      case "celebration":
      default:
        return <Sparkles className="size-4 text-primary shrink-0" />
    }
  }

  const getBorderColor = () => {
    switch (nudge.type) {
      case "milestone":
        return "border-orange-500/25 bg-orange-500/[0.04]"
      case "warning":
        return "border-amber-500/25 bg-amber-500/[0.04]"
      case "nudge":
        return "border-emerald-500/25 bg-emerald-500/[0.04]"
      case "encouragement":
      case "celebration":
      default:
        return "border-primary/25 bg-primary/[0.04]"
    }
  }

  return (
    <aside
      aria-label="Habit smart nudge"
      className={cn(
        "relative flex items-start gap-3.5 p-4 rounded-[12px] border transition-all duration-300",
        getBorderColor(),
        className
      )}
    >
      <div className="mt-0.5 p-1.5 rounded-full bg-background/80 border border-border shrink-0 shadow-xs">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0 pr-6">
        <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">
          {nudge.title}
        </h3>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
          {nudge.message}
        </p>

        {nudge.habitId && (
          <div className="mt-2">
            <Link
              href={`/habits/${nudge.habitId}`}
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-foreground hover:underline"
            >
              View habit
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(nudge.id)}
        className="absolute top-3 right-3 size-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        aria-label="Dismiss smart nudge"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </aside>
  )
}
