"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { GripVertical } from "lucide-react"
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
import { reorderHabits } from "@/app/(app)/habits/actions"
import { HabitActions } from "@/components/habits/habit-actions"
import { StarterHabits } from "@/components/habits/starter-habits"

interface HabitListProps {
  habits: Habit[]
}

interface SortableHabitRowProps {
  habit: Habit
  index: number
  isFirst: boolean
}

function SortableHabitRow({ habit, index, isFirst }: SortableHabitRowProps) {
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
            "size-[44px] md:size-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 rounded-lg select-none",
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

export function HabitList({ habits }: HabitListProps) {
  const [items, setItems] = useState<Habit[]>(habits)
  const [, startTransition] = useTransition()

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
      const habit = items.find((h) => h.id === active.id)
      const position = items.findIndex((h) => h.id === active.id) + 1
      return `Picked up habit ${habit?.name ?? active.id}. Current position is ${position} of ${items.length}.`
    },
    onDragOver({ active, over }) {
      if (over) {
        const habit = items.find((h) => h.id === active.id)
        const overHabit = items.find((h) => h.id === over.id)
        const position = items.findIndex((h) => h.id === over.id) + 1
        return `Habit ${habit?.name ?? active.id} moved to position ${position} of ${items.length}, over ${overHabit?.name ?? over.id}.`
      }
      return `Habit ${active.id} is no longer over a droppable area.`
    },
    onDragEnd({ active, over }) {
      const habit = items.find((h) => h.id === active.id)
      if (over) {
        const position = items.findIndex((h) => h.id === over.id) + 1
        return `Habit ${habit?.name ?? active.id} dropped at position ${position} of ${items.length}.`
      }
      return `Habit ${habit?.name ?? active.id} dropped.`
    },
    onDragCancel({ active }) {
      const habit = items.find((h) => h.id === active.id)
      return `Reordering cancelled. Habit ${habit?.name ?? active.id} returned to its original position.`
    },
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const previousItems = items
    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    startTransition(async () => {
      try {
        const newIds = newItems.map((h) => h.id)
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

  return (
    <div>
      {items.length === 0 ? (
        <div className="mt-10">
          <StarterHabits />
        </div>
      ) : (
        <div className="mt-10 bg-card border border-border rounded-[14px] overflow-hidden">
          <DndContext
            id="habit-order"
            sensors={sensors}
            accessibility={{ announcements }}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((h) => h.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((habit, index) => (
                <SortableHabitRow
                  key={habit.id}
                  habit={habit}
                  index={index}
                  isFirst={index === 0}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {items.length > 0 && (
        <p className="mt-4 md:mt-5 text-[13px] md:text-[14px] text-muted-foreground">
          Drag the handle on the left to change the order. It is also the order on Today.
        </p>
      )}
    </div>
  )
}
