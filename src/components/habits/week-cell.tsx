import { cn } from "@/lib/utils"

export type CellState = "done" | "missed" | "open" | "off"

interface WeekCellProps {
  state: CellState
  color: string
  size?: "desktop" | "mobile"
  label: string
  pending?: boolean
  onToggle?: () => void
  justChecked?: boolean
}

export function WeekCell({
  state,
  color,
  size = "desktop",
  label,
  pending = false,
  onToggle,
  justChecked = false,
}: WeekCellProps) {
  if (state === "off") {
    return (
      <span
        className="w-[10px] h-[2px] rounded-[1px] bg-line-strong inline-block"
        role="img"
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
      aria-label={label}
      aria-pressed={isDone}
      className={cn(
        "rounded-lg flex items-center justify-center cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "motion-safe:transition-colors motion-safe:active:scale-95",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
        size === "mobile"
          ? "w-full max-w-[44px] aspect-square"
          : "size-[40px] shrink-0",
        isMissed && "border-[1.5px] border-line-strong bg-transparent hover:border-foreground",
        isOpen && "border-2 border-foreground bg-card",
        shouldAnimate && "anim-cell-pop"
      )}
      style={isDone ? { backgroundColor: color } : undefined}
    >
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
