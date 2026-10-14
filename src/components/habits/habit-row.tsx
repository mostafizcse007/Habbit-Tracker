import Link from "next/link"
import type { Habit } from "@/types"
import { formatSchedule } from "@/lib/habit-schedule"
import { HabitActions } from "@/components/habits/habit-actions"

interface HabitRowProps {
  habit: Habit
  isFirst?: boolean
}

export function HabitRow({ habit, isFirst = false }: HabitRowProps) {
  const scheduleText = formatSchedule(habit.frequency)

  return (
    <div
      className={`min-h-[72px] px-6 flex items-center justify-between gap-[14px] ${
        isFirst ? "" : "border-t border-border"
      }`}
    >
      <div className="flex items-center gap-[14px] min-w-0">
        <span
          className="size-[10px] rounded-[3px] shrink-0"
          style={{ backgroundColor: habit.color }}
        />
        <div className="min-w-0">
          <div className="text-[17px] font-semibold text-foreground truncate">
            <Link href={`/habits/${habit.id}`} className="hover:underline">
              {habit.name}
            </Link>
          </div>
          <div className="text-[13px] text-muted-foreground mt-0.5 truncate">
            {scheduleText}
          </div>
        </div>
      </div>

      <HabitActions habit={habit} />
    </div>
  )
}
