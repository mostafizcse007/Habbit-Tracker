"use client"

import { useState, useTransition } from "react"
import {
  MoreHorizontalIcon,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import type { Habit } from "@/types"
import {
  archiveHabit,
  unarchiveHabit,
  deleteHabit,
} from "@/app/(app)/habits/actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HabitDialog } from "@/components/habits/habit-dialog"

interface HabitActionsProps {
  habit: Habit
  onArchived?: () => void
  onUnarchived?: () => void
  onDeleted?: () => void
  onUpdated?: (updatedData?: Partial<Habit> & { id?: string }) => void
  customArchive?: () => void
  customUnarchive?: () => void
  customDelete?: () => void
}

export function HabitActions({
  habit,
  onArchived,
  onUnarchived,
  onDeleted,
  onUpdated,
  customArchive,
  customUnarchive,
  customDelete,
}: HabitActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const isArchived = Boolean(habit.archived)

  const handleArchive = () => {
    if (customArchive) {
      customArchive()
      return
    }
    startTransition(async () => {
      const result = await archiveHabit(habit.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Habit archived")
        onArchived?.()
      }
    })
  }

  const handleUnarchive = () => {
    if (customUnarchive) {
      customUnarchive()
      return
    }
    startTransition(async () => {
      const result = await unarchiveHabit(habit.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Habit restored")
        onUnarchived?.()
      }
    })
  }

  const handleDelete = () => {
    if (customDelete) {
      setDeleteDialogOpen(false)
      customDelete()
      return
    }
    startTransition(async () => {
      const result = await deleteHabit(habit.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Habit deleted")
        setDeleteDialogOpen(false)
        onDeleted?.()
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="size-[36px] rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              disabled={isPending}
              aria-label={`Options for ${habit.name}`}
            >
              <MoreHorizontalIcon className="size-4" aria-hidden="true" />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
              <Pencil className="size-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            {isArchived ? (
              <DropdownMenuItem onClick={handleUnarchive} disabled={isPending}>
                <RotateCcw className="size-4" />
                <span>Restore</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleArchive} disabled={isPending}>
                <Archive className="size-4" />
                <span>Archive</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <HabitDialog
        habit={habit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onUpdated}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-t-[14px] md:rounded-[14px] border-t md:border border-border bg-card shadow-none p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-bold tracking-[-0.02em]">
              Delete habit
            </DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground mt-2">
              Are you sure you want to delete &quot;{habit.name}&quot;? This
              action cannot be undone and all tracked logs will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
              className="h-11 rounded-[10px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="h-11 rounded-[10px]"
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
