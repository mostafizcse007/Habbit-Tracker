import { cn } from "@/lib/utils"

export type CellState = "done" | "missed" | "open" | "off"

interface WeekCellProps {
  state: CellState
  color: string
  size?: "desktop" | "mobile"
  label: string
  title?: string
  pending?: boolean
  onToggle?: () => void
  justChecked?: boolean
  hasNote?: boolean
}

export function WeekCell({
  state,
  color,
  size = "desktop",
  label,
  title,
  pending = false,
  onToggle,
  justChecked = false,
  hasNote = false,
}: WeekCellProps) {
  if (state === "off") {
    return (
      <span
        className="w-[10px] h-[2px] rounded-[1px] bg-line-strong inline-block"
        role="img"
        title={title ?? label}
        aria-label={label}
      />
    )
  }

  const isDone = state === "done"
  const isMissed = state === "missed"
  const isOpen = state === "open"
  const shouldAnimate = justChecked && isDone

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      title={title ?? (hasNote ? `${label}, has note` : label)}
      aria-label={hasNote ? `${label}, has note` : label}
      aria-pressed={isDone}
      className={cn(
        "relative rounded-lg flex items-center justify-center cursor-pointer select-none touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "motion-safe:transition-colors motion-safe:active:scale-95",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
        size === "mobile"
          ? "w-full max-w-[44px] aspect-square after:min-w-[44px] after:min-h-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden"
          : "size-[40px] shrink-0",
        isMissed && "border-[1.5px] border-line-strong bg-transparent hover:border-foreground",
        isOpen && "border-2 border-foreground bg-card",
        shouldAnimate && "anim-cell-pop"
      )}
      style={isDone ? { backgroundColor: color } : undefined}
    >
      {hasNote && (
        <span
          className={cn(
            "absolute top-1 right-1 size-1.5 rounded-full pointer-events-none",
            isDone ? "bg-background" : "bg-primary"
          )}
          aria-hidden="true"
        />
      )}
      {isDone && (
        <svg
          viewBox="0 0 20 20"
          className="size-5"
          fill="none"
          stroke="#15181D"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path
            d="M4.5 10.5l3.5 3.5 7.5-8"
            pathLength={shouldAnimate ? 1 : undefined}
            className={shouldAnimate ? "anim-check-draw" : undefined}
          />
        </svg>
      )}
    </button>
  )
}
