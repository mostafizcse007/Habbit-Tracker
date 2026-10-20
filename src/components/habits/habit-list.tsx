"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GripVertical, Archive, RotateCcw, Sparkles } from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import type { Habit } from "@/types"
import { cn } from "@/lib/utils"
import { formatSchedule } from "@/lib/habit-schedule"
import {
  archiveHabit,
  unarchiveHabit,
  deleteHabit,
  reorderHabits,
} from "@/app/(app)/habits/actions"
import { Button } from "@/components/ui/button"
import { HabitDialog } from "@/components/habits/habit-dialog"
import { HabitActions } from "@/components/habits/habit-actions"
import { StarterHabits } from "@/components/habits/starter-habits"

interface HabitListProps {
  habits: Habit[]
}

interface SortableHabitRowProps {
  habit: Habit
  index: number
  isFirst: boolean
  onUpdated: (updatedData?: Partial<Habit> & { id?: string }) => void
  onArchive: () => void
  onDelete: () => void
}

function SortableHabitRow({
  habit,
  index,
  isFirst,
  onUpdated,
  onArchive,
  onDelete,
}: SortableHabitRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(0px, ${Math.round(transform.y)}px, 0px)`
      : undefined,
    transition,
    "--i": Math.min(index, 8),
  } as React.CSSProperties

  const scheduleText = formatSchedule(habit.frequency)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "anim-reveal min-h-[72px] px-3.5 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-[14px]",
        isFirst ? "" : "border-t border-border",
        isDragging && "relative z-10 bg-card border-y border-foreground shadow-none"
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-[14px] min-w-0">
        <button
          type="button"
          aria-label={`Reorder ${habit.name}`}
          className={cn(
            "size-[44px] md:size-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 rounded-lg select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{ touchAction: "none" }}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <span
          className="size-[10px] rounded-[3px] shrink-0"
          style={{ backgroundColor: habit.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/habits/${habit.id}`}
              className="text-[17px] font-semibold text-foreground truncate hover:underline"
            >
              {habit.name}
            </Link>
            {habit.tags && habit.tags.length > 0 && (
              <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                {habit.tags[0]}
                {habit.tags.length > 1 && ` +${habit.tags.length - 1}`}
              </span>
            )}
          </div>
          <div className="text-[13px] text-muted-foreground mt-0.5 truncate">
            {scheduleText}
          </div>
        </div>
      </div>

      <HabitActions
        habit={habit}
        onUpdated={onUpdated}
        customArchive={onArchive}
        customDelete={onDelete}
      />
    </div>
  )
}

interface ArchivedHabitRowProps {
  habit: Habit
  index: number
  isFirst: boolean
  onUpdated: (updatedData?: Partial<Habit> & { id?: string }) => void
  onUnarchive: () => void
  onDelete: () => void
}

function ArchivedHabitRow({
  habit,
  index,
  isFirst,
  onUpdated,
  onUnarchive,
  onDelete,
}: ArchivedHabitRowProps) {
  const scheduleText = formatSchedule(habit.frequency)

  return (
    <div
      style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
      className={cn(
        "anim-reveal min-h-[72px] px-3.5 sm:px-6 flex items-center justify-between gap-3 sm:gap-[14px] hover:bg-muted/30 transition-colors",
        isFirst ? "" : "border-t border-border"
      )}
    >
      <div className="flex items-center gap-3 sm:gap-[14px] min-w-0">
        <span
          className="size-[10px] rounded-[3px] shrink-0 opacity-70"
          style={{ backgroundColor: habit.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <Link
              href={`/habits/${habit.id}`}
              className="text-[17px] font-semibold text-foreground truncate hover:underline"
            >
              {habit.name}
            </Link>
            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              Archived
            </span>
            {habit.tags && habit.tags.length > 0 && (
              <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                {habit.tags[0]}
                {habit.tags.length > 1 && ` +${habit.tags.length - 1}`}
              </span>
            )}
          </div>
          <div className="text-[13px] text-muted-foreground mt-0.5 truncate">
            {scheduleText}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onUnarchive}
          className="h-8 px-2.5 sm:px-3 rounded-[8px] text-[13px] font-medium border-border hover:bg-muted cursor-pointer"
        >
          <RotateCcw className="size-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Restore</span>
        </Button>

        <HabitActions
          habit={habit}
          onUpdated={onUpdated}
          customUnarchive={onUnarchive}
          customDelete={onDelete}
        />
      </div>
    </div>
  )
}

export function HabitList({ habits }: HabitListProps) {
  const router = useRouter()
  const [items, setItems] = useState<Habit[]>(habits)
  const [prevHabits, setPrevHabits] = useState<Habit[]>(habits)
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
  const [, startTransition] = useTransition()

  if (prevHabits !== habits) {
    setPrevHabits(habits)
    setItems(habits)
  }

  const activeHabits = useMemo(
    () =>
      items
        .filter((h) => !h.archived)
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order ||
            a.created_at.localeCompare(b.created_at)
        ),
    [items]
  )

  const archivedHabits = useMemo(
    () =>
      items
        .filter((h) => h.archived)
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order ||
            a.created_at.localeCompare(b.created_at)
        ),
    [items]
  )

  const handleHabitUpdated = (
    updatedData?: Partial<Habit> & { id?: string }
  ) => {
    if (!updatedData?.id) return
    setItems((prev) =>
      prev.map((h) => (h.id === updatedData.id ? { ...h, ...updatedData } : h))
    )
  }

  const handleArchiveHabit = (habitId: string) => {
    // Optimistically update
    setItems((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, archived: true } : h))
    )
    toast.success("Habit archived")

    startTransition(async () => {
      try {
        const result = await archiveHabit(habitId)
        if (result?.error) {
          // Rollback on error
          setItems((prev) =>
            prev.map((h) => (h.id === habitId ? { ...h, archived: false } : h))
          )
          toast.error(result.error)
        } else {
          router.refresh()
        }
      } catch {
        setItems((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, archived: false } : h))
        )
        toast.error("Failed to archive habit. Please try again.")
      }
    })
  }

  const handleUnarchiveHabit = (habitId: string) => {
    // Optimistically update
    setItems((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, archived: false } : h))
    )
    toast.success("Habit restored")

    startTransition(async () => {
      try {
        const result = await unarchiveHabit(habitId)
        if (result?.error) {
          // Rollback on error
          setItems((prev) =>
            prev.map((h) => (h.id === habitId ? { ...h, archived: true } : h))
          )
          toast.error(result.error)
        } else {
          router.refresh()
        }
      } catch {
        setItems((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, archived: true } : h))
        )
        toast.error("Failed to restore habit. Please try again.")
      }
    })
  }

  const handleDeleteHabit = (habitId: string) => {
    const previousItems = items
    setItems((prev) => prev.filter((h) => h.id !== habitId))
    toast.success("Habit deleted")

    startTransition(async () => {
      try {
        const result = await deleteHabit(habitId)
        if (result?.error) {
          setItems(previousItems)
          toast.error(result.error)
        } else {
          router.refresh()
        }
      } catch {
        setItems(previousItems)
        toast.error("Failed to delete habit. Please try again.")
      }
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const announcements: Announcements = {
    onDragStart({ active }) {
      const habit = activeHabits.find((h) => h.id === active.id)
      const position = activeHabits.findIndex((h) => h.id === active.id) + 1
      return `Picked up habit ${habit?.name ?? active.id}. Current position is ${position} of ${activeHabits.length}.`
    },
    onDragOver({ active, over }) {
      if (over) {
        const habit = activeHabits.find((h) => h.id === active.id)
        const overHabit = activeHabits.find((h) => h.id === over.id)
        const position = activeHabits.findIndex((h) => h.id === over.id) + 1
        return `Habit ${habit?.name ?? active.id} moved to position ${position} of ${activeHabits.length}, over ${overHabit?.name ?? over.id}.`
      }
      return `Habit ${active.id} is no longer over a droppable area.`
    },
    onDragEnd({ active, over }) {
      const habit = activeHabits.find((h) => h.id === active.id)
      if (over) {
        const position = activeHabits.findIndex((h) => h.id === over.id) + 1
        return `Habit ${habit?.name ?? active.id} dropped at position ${position} of ${activeHabits.length}.`
      }
      return `Habit ${habit?.name ?? active.id} dropped.`
    },
    onDragCancel({ active }) {
      const habit = activeHabits.find((h) => h.id === active.id)
      return `Reordering cancelled. Habit ${habit?.name ?? active.id} returned to its original position.`
    },
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = activeHabits.findIndex((item) => item.id === active.id)
    const newIndex = activeHabits.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const previousItems = items
    const newActive = arrayMove(activeHabits, oldIndex, newIndex)
    // Update local state preserving new active ordering and keeping archived items
    setItems([...newActive, ...archivedHabits])

    startTransition(async () => {
      try {
        const newIds = newActive.map((h) => h.id)
        const res = await reorderHabits(newIds)
        if (res && "error" in res) {
          setItems(previousItems)
          toast.error("Could not save the new order. Try again.")
        }
      } catch {
        setItems(previousItems)
        toast.error("Could not save the new order. Try again.")
      }
    })
  }

  // If user has zero habits at all (neither active nor archived), show starter habits onboarding
  if (items.length === 0) {
    return (
      <div className="mt-8 md:mt-10">
        <StarterHabits />
      </div>
    )
  }

  return (
    <div>
      {/* Segmented Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mt-8 md:mt-10 mb-6">
        <div
          role="tablist"
          aria-label="Habit filter"
          className="inline-flex items-center p-1 rounded-[12px] bg-muted/70 border border-border/70"
        >
          <button
            type="button"
            role="tab"
            id="tab-active"
            aria-selected={activeTab === "active"}
            aria-controls="panel-active"
            tabIndex={activeTab === "active" ? 0 : -1}
            onClick={() => setActiveTab("active")}
            className={cn(
              "flex items-center gap-2 h-9 px-3.5 rounded-[9px] text-[14px] font-semibold transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === "active"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <span>Active</span>
            <span
              className={cn(
                "text-[12px] font-medium px-2 py-0.5 rounded-full tabular-nums transition-colors",
                activeTab === "active"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {activeHabits.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-archived"
            aria-selected={activeTab === "archived"}
            aria-controls="panel-archived"
            tabIndex={activeTab === "archived" ? 0 : -1}
            onClick={() => setActiveTab("archived")}
            className={cn(
              "flex items-center gap-2 h-9 px-3.5 rounded-[9px] text-[14px] font-semibold transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === "archived"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <span>Archived</span>
            <span
              className={cn(
                "text-[12px] font-medium px-2 py-0.5 rounded-full tabular-nums transition-colors",
                activeTab === "archived"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {archivedHabits.length}
            </span>
          </button>
        </div>
      </div>

      {/* Active Habits Panel */}
      {activeTab === "active" && (
        <div role="tabpanel" id="panel-active" aria-labelledby="tab-active">
          {activeHabits.length === 0 ? (
            <div className="bg-card border border-border rounded-[14px] p-8 md:p-12 text-center flex flex-col items-center justify-center">
              <div className="size-12 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground mb-4">
                <Sparkles className="size-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-[18px] md:text-[20px] font-semibold text-foreground">
                No active habits
              </h3>
              <p className="mt-1.5 text-[14px] text-muted-foreground max-w-sm">
                All your habits are currently archived, or you haven&apos;t created any active habits yet.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <HabitDialog
                  trigger={
                    <Button className="h-10 px-4 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold cursor-pointer">
                      Create new habit
                    </Button>
                  }
                />
                {archivedHabits.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("archived")}
                    className="h-10 px-4 rounded-[10px] text-[14px] font-medium cursor-pointer"
                  >
                    View archived ({archivedHabits.length})
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-card border border-border rounded-[14px] overflow-hidden">
                <DndContext
                  id="habit-order"
                  sensors={sensors}
                  accessibility={{ announcements }}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={activeHabits.map((h) => h.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {activeHabits.map((habit, index) => (
                      <SortableHabitRow
                        key={habit.id}
                        habit={habit}
                        index={index}
                        isFirst={index === 0}
                        onUpdated={handleHabitUpdated}
                        onArchive={() => handleArchiveHabit(habit.id)}
                        onDelete={() => handleDeleteHabit(habit.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              <p className="mt-4 md:mt-5 text-[13px] md:text-[14px] text-muted-foreground">
                Drag the handle on the left to change the order. It is also the order on Today.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Archived Habits Panel */}
      {activeTab === "archived" && (
        <div role="tabpanel" id="panel-archived" aria-labelledby="tab-archived">
          {archivedHabits.length === 0 ? (
            <div className="bg-card border border-border rounded-[14px] p-8 md:p-12 text-center flex flex-col items-center justify-center">
              <div className="size-12 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground mb-4">
                <Archive className="size-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-[18px] md:text-[20px] font-semibold text-foreground">
                No archived habits
              </h3>
              <p className="mt-1.5 text-[14px] text-muted-foreground max-w-sm">
                Habits you archive will appear here. You can restore them anytime without losing your historical check-in data.
              </p>
              {activeHabits.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("active")}
                  className="mt-6 h-10 px-4 rounded-[10px] text-[14px] font-medium cursor-pointer"
                >
                  View active habits ({activeHabits.length})
                </Button>
              )}
            </div>
          ) : (
            <div>
              <div className="bg-card border border-border rounded-[14px] overflow-hidden">
                {archivedHabits.map((habit, index) => (
                  <ArchivedHabitRow
                    key={habit.id}
                    habit={habit}
                    index={index}
                    isFirst={index === 0}
                    onUpdated={handleHabitUpdated}
                    onUnarchive={() => handleUnarchiveHabit(habit.id)}
                    onDelete={() => handleDeleteHabit(habit.id)}
                  />
                ))}
              </div>

              <p className="mt-4 md:mt-5 text-[13px] md:text-[14px] text-muted-foreground">
                Archived habits are hidden from Today and active streaks. Restore them anytime to resume tracking.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
