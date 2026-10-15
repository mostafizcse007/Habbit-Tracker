"use client"

import { useActionState, useEffect, useState } from "react"
import type { Habit } from "@/types"
import { createHabit, updateHabit } from "@/app/(app)/habits/actions"
import { HABIT_TEMPLATES } from "@/lib/habit-templates"
import { cn } from "@/lib/utils"

const IDEA_CHIPS = [
  { key: "water", label: "Water" },
  { key: "workout", label: "Workout" },
  { key: "read", label: "Read" },
  { key: "journal", label: "Journal" },
  { key: "study", label: "Study" },
  { key: "coding", label: "Coding" },
]

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

const WEEKDAYS = [
  { day: 1, label: "M" },
  { day: 2, label: "T" },
  { day: 3, label: "W" },
  { day: 4, label: "T" },
  { day: 5, label: "F" },
  { day: 6, label: "S" },
  { day: 0, label: "S" },
]

interface HabitFormProps {
  habit?: Habit
  onSuccess?: () => void
}

export function HabitForm({ habit, onSuccess }: HabitFormProps) {
  const action = habit ? updateHabit : createHabit
  const [state, formAction, isPending] = useActionState(action, null)

  const [name, setName] = useState<string>(habit?.name ?? "")
  const [selectedColor, setSelectedColor] = useState<string>(
    habit?.color ?? PRESET_COLORS[0]
  )
  const [selectedDays, setSelectedDays] = useState<number[]>(
    habit?.frequency ?? [0, 1, 2, 3, 4, 5, 6]
  )

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess()
    }
  }, [state?.success, onSuccess])

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const selectIdea = (key: string) => {
    const t = HABIT_TEMPLATES.find((tpl) => tpl.key === key)
    if (!t) return
    setName(t.name)
    setSelectedColor(t.color.toLowerCase())
    setSelectedDays(t.frequency)
  }

  return (
    <form action={formAction} className="space-y-5 mt-4">
      {habit && <input type="hidden" name="id" value={habit.id} />}

      {state?.error && (
        <p role="alert" className="text-[14px] text-destructive">
          {state.error}
        </p>
      )}

      {!habit && (
        <div className="space-y-2">
          <span className="text-[13px] text-muted-foreground block">
            Or start from an idea
          </span>
          <div className="flex flex-wrap gap-2">
            {IDEA_CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => selectIdea(chip.key)}
                className="h-8 px-3 rounded-full border border-input text-[13px] font-medium text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="habit-name"
          className="text-[14px] font-medium text-foreground block"
        >
          Name
        </label>
        <input
          id="habit-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Read 20 pages"
          maxLength={80}
          required
          className="h-11 w-full rounded-lg px-3.5 text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      <div className="space-y-2">
        <span className="text-[14px] font-medium text-foreground block">
          Color
        </span>
        <input type="hidden" name="color" value={selectedColor} />
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((color) => {
            const isSelected = selectedColor === color
            return (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "size-[28px] rounded-full flex items-center justify-center cursor-pointer transition-transform motion-safe:active:scale-95",
                  isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              >
                {isSelected && (
                  <svg
                    viewBox="0 0 20 20"
                    className="size-[14px]"
                    fill="none"
                    stroke="#15181D"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[14px] font-medium text-foreground block">
          Frequency
        </span>
        <div className="flex items-center gap-2">
          {WEEKDAYS.map(({ day, label }) => {
            const isSelected = selectedDays.includes(day)
            return (
              <div key={day} className="relative">
                <input
                  type="checkbox"
                  name="frequency"
                  value={day}
                  checked={isSelected}
                  onChange={() => toggleDay(day)}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "size-[40px] rounded-lg text-[14px] flex items-center justify-center cursor-pointer transition-colors",
                    isSelected
                      ? "bg-foreground text-background font-semibold"
                      : "border border-line-strong bg-transparent text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-50 transition-opacity"
      >
        {isPending
          ? habit
            ? "Saving..."
            : "Creating..."
          : habit
            ? "Save changes"
            : "Create habit"}
      </button>
    </form>
  )
}
