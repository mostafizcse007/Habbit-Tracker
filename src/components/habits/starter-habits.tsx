"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { toast } from "sonner"
import {
  HABIT_TEMPLATE_GROUPS,
  HABIT_TEMPLATES,
  type HabitTemplate,
} from "@/lib/habit-templates"
import { formatSchedule } from "@/lib/habit-schedule"
import { createHabitsFromTemplates } from "@/app/(app)/habits/actions"
import { HabitDialog } from "@/components/habits/habit-dialog"
import { cn } from "@/lib/utils"

export function StarterHabits() {
  const router = useRouter()
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectedCount = selectedKeys.size

  const handleAdd = () => {
    if (selectedCount === 0 || isPending) {
      return
    }

    setErrorMessage(null)
    startTransition(async () => {
      const keysArray = Array.from(selectedKeys)
      const res = await createHabitsFromTemplates(keysArray)
      if ("error" in res) {
        setErrorMessage(res.error)
      } else {
        toast(`Added ${res.added} habits.`)
        router.refresh()
      }
    })
  }

  const templatesByGroup = HABIT_TEMPLATE_GROUPS.map((group) => ({
    group,
    templates: HABIT_TEMPLATES.filter((t) => t.group === group),
  }))

  const buttonLabel = isPending
    ? "Adding..."
    : selectedCount === 1
      ? "Add 1 habit"
      : `Add ${selectedCount} habits`

  return (
    <div className="bg-card border border-border rounded-[14px] p-6 md:p-8">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-foreground">
        Start with a few habits
      </h2>
      <p className="mt-1 text-[15px] text-text-soft">
        Pick the ones you want. You can rename, recolor and reschedule anything
        later.
      </p>

      <div className="mt-6">
        {templatesByGroup.map(({ group, templates }, groupIndex) => (
          <div key={group} className={groupIndex > 0 ? "mt-6" : ""}>
            <h3 className="text-[13px] font-semibold text-muted-foreground">
              {group}
            </h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template: HabitTemplate) => {
                const isSelected = selectedKeys.has(template.key)
                return (
                  <button
                    key={template.key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleKey(template.key)}
                    className={cn(
                      "rounded-[10px] border px-4 py-3 min-h-[56px] flex items-center gap-3 text-left w-full cursor-pointer motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isSelected
                        ? "border-foreground"
                        : "border-border hover:border-line-strong"
                    )}
                  >
                    <span
                      className="size-[10px] rounded-[3px] shrink-0"
                      style={{ backgroundColor: template.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-semibold text-foreground truncate">
                        {template.name}
                      </div>
                      <div className="text-[13px] text-muted-foreground truncate">
                        {formatSchedule(template.frequency)}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "size-5 rounded-md shrink-0 flex items-center justify-center",
                        isSelected
                          ? "bg-foreground"
                          : "border border-line-strong"
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <Check
                          className="size-3.5 text-background"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {errorMessage && (
        <p role="alert" className="mt-6 text-[14px] text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={selectedCount === 0 || isPending}
          className="h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {buttonLabel}
        </button>

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="relative inline-flex items-center min-h-[44px] md:min-h-0 text-[15px] font-semibold text-foreground hover:text-muted-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Create my own
        </button>

        <span className="ml-auto text-[14px] text-muted-foreground tabular-nums">
          {selectedCount} selected
        </span>
      </div>

      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
