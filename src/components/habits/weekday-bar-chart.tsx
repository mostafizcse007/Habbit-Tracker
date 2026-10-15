"use client"

import { getBestAndWorstWeekday, type WeekdayRate } from "@/lib/stats"
import { cn } from "@/lib/utils"

interface WeekdayBarChartProps {
  rates: WeekdayRate[]
  color: string
  caption: string
  daysLabel?: string
  isScheduled?: (weekday: number) => boolean
  className?: string
  style?: React.CSSProperties
}

const WEEKDAY_DATA: Record<
  number,
  { short: string; full: string; plural: string }
> = {
  1: { short: "Mon", full: "Monday", plural: "Mondays" },
  2: { short: "Tue", full: "Tuesday", plural: "Tuesdays" },
  3: { short: "Wed", full: "Wednesday", plural: "Wednesdays" },
  4: { short: "Thu", full: "Thursday", plural: "Thursdays" },
  5: { short: "Fri", full: "Friday", plural: "Fridays" },
  6: { short: "Sat", full: "Saturday", plural: "Saturdays" },
  0: { short: "Sun", full: "Sunday", plural: "Sundays" },
}

export function WeekdayBarChart({
  rates,
  color,
  caption,
  daysLabel = "Last 90 days",
  isScheduled,
  className,
  style,
}: WeekdayBarChartProps) {
  const { best } = getBestAndWorstWeekday(rates, 3)

  return (
    <div
      style={style}
      className={cn(
        "mt-6 bg-card border border-border rounded-[14px] overflow-hidden p-4 sm:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-foreground">By weekday</h2>
        <span className="text-[14px] text-muted-foreground">{daysLabel}</span>
      </div>

      <p className="mt-3 text-[15px] leading-[1.4] text-text-soft">
        {caption}
      </p>

      <div className="flex gap-2 sm:gap-3 mt-6 items-end justify-between sm:justify-start">
        {rates.map((item) => {
          const scheduled = isScheduled
            ? isScheduled(item.weekday)
            : item.scheduled > 0
          const meta = WEEKDAY_DATA[item.weekday]
          const isBestRate =
            scheduled &&
            best !== null &&
            item.rate !== null &&
            item.rate === best.rate

          return (
            <div
              key={item.weekday}
              role="img"
              aria-label={
                scheduled && item.rate !== null
                  ? `${meta.full}: ${item.rate}% of ${item.scheduled} scheduled days`
                  : `${meta.full}: not scheduled`
              }
              className="flex-1 flex flex-col items-center max-w-[44px]"
            >
              <div className="text-[13px] tabular-nums text-muted-foreground h-5 flex items-center justify-center select-none">
                {scheduled && item.rate !== null ? `${item.rate}%` : "—"}
              </div>

              <div
                className={cn(
                  "h-24 w-full max-w-[44px] rounded-md overflow-hidden flex items-end mt-1",
                  scheduled ? "bg-muted/60" : "bg-muted/30"
                )}
              >
                {scheduled && item.rate !== null && (
                  <div
                    className={cn(
                      "anim-grow-y w-full motion-safe:transition-[height] duration-300 rounded-[4px]",
                      color.startsWith("bg-") && color
                    )}
                    style={{
                      height: `${item.rate}%`,
                      backgroundColor: color.startsWith("bg-")
                        ? undefined
                        : color,
                    }}
                  />
                )}
              </div>

              <span
                className={cn(
                  "text-[13px] mt-2 select-none",
                  isBestRate
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {meta.short}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
