"use client"

import { useActionState, useEffect, useRef, useState } from "react"
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
  { day: 1, label: "M", full: "Monday" },
  { day: 2, label: "T", full: "Tuesday" },
  { day: 3, label: "W", full: "Wednesday" },
  { day: 4, label: "T", full: "Thursday" },
  { day: 5, label: "F", full: "Friday" },
  { day: 6, label: "S", full: "Saturday" },
  { day: 0, label: "S", full: "Sunday" },
]

const PRESET_TAGS = [
  "Health",
  "Fitness",
  "Mind",
  "Study",
  "Work",
  "Daily",
  "Personal",
]

interface HabitFormProps {
  habit?: Habit
  onSuccess?: (updatedData?: Partial<Habit> & { id?: string }) => void
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
  const [tags, setTags] = useState<string[]>(habit?.tags ?? [])
  const [customTag, setCustomTag] = useState("")

  const valuesRef = useRef({ name, selectedColor, selectedDays, tags })
  useEffect(() => {
    valuesRef.current = { name, selectedColor, selectedDays, tags }
  }, [name, selectedColor, selectedDays, tags])

  useEffect(() => {
    if (state?.success && onSuccess) {
      if (habit) {
        onSuccess({
          id: habit.id,
          name: valuesRef.current.name.trim(),
          color: valuesRef.current.selectedColor,
          frequency: valuesRef.current.selectedDays,
          tags: valuesRef.current.tags,
        })
      } else {
        onSuccess()
      }
    }
  }, [state?.success, habit, onSuccess])

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleAddCustomTag = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    const trimmed = customTag.trim()
    if (!trimmed) return
    if (!tags.includes(trimmed) && tags.length < 8) {
      setTags((prev) => [...prev, trimmed])
    }
    setCustomTag("")
  }

  const selectIdea = (key: string) => {
    const t = HABIT_TEMPLATES.find((tpl) => tpl.key === key)
    if (!t) return
    setName(t.name)
    setSelectedColor(t.color.toLowerCase())
    setSelectedDays(t.frequency)
    if (t.group && !tags.includes(t.group)) {
      setTags((prev) => Array.from(new Set([...prev, t.group])))
    }
  }

  return (
    <form action={formAction} className="space-y-5 mt-4">
      {habit && <input type="hidden" name="id" value={habit.id} />}

      {state?.error && (
        <p id="habit-form-error" role="alert" className="text-[14px] text-destructive">
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
                className="h-8 px-3 rounded-full border border-input text-[13px] font-medium text-foreground hover:bg-muted transition-colors cursor-pointer select-none relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          Name <span aria-hidden="true" className="text-muted-foreground ml-0.5">*</span><span className="sr-only">(required)</span>
        </label>
        <input
          id="habit-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Read 20 pages"
          maxLength={80}
          required
          aria-required="true"
          aria-invalid={Boolean(state?.error)}
          aria-describedby={state?.error ? "habit-form-error" : undefined}
          className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      <div className="space-y-2">
        <span className="text-[14px] font-medium text-foreground block">
          Color
        </span>
        <input type="hidden" name="color" value={selectedColor} />
        <div role="radiogroup" aria-label="Habit color" className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((color) => {
            const isSelected = selectedColor === color
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "size-[28px] rounded-full flex items-center justify-center cursor-pointer transition-transform motion-safe:active:scale-95 relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
        <div role="group" aria-label="Frequency days" className="flex items-center gap-2">
          {WEEKDAYS.map(({ day, label, full }) => {
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
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={full}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "size-[40px] rounded-lg text-[14px] flex items-center justify-center cursor-pointer transition-colors relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-foreground block">
            Category / Tags
          </span>
          <span className="text-[12px] text-muted-foreground">Optional</span>
        </div>

        {/* Hidden inputs to send with form submission */}
        {tags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}

        {/* Selected tags badges */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="size-3.5 rounded-full inline-flex items-center justify-center hover:bg-primary/20 cursor-pointer relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Remove tag ${tag}`}
                >
                  <svg
                    viewBox="0 0 12 12"
                    className="size-2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M2 2l8 8M10 2l-8 8" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Preset suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TAGS.map((tag) => {
            const isSelected = tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={isSelected}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[12px] font-medium border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "bg-foreground text-background border-foreground font-semibold"
                    : "border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {tag}
              </button>
            )
          })}
        </div>

        {/* Custom tag input */}
        <div className="flex items-center gap-2 pt-1">
          <label htmlFor="custom-tag-input" className="sr-only">
            Add custom tag
          </label>
          <input
            id="custom-tag-input"
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddCustomTag(e)
              }
            }}
            placeholder="Add custom tag..."
            maxLength={24}
            className="h-9 flex-1 rounded-lg px-3 text-[13px] border border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            disabled={!customTag.trim() || tags.length >= 8}
            className="h-9 px-3 rounded-lg border border-input text-[13px] font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Add
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
