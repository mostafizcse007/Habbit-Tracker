"use client"

import { useState, useTransition } from "react"
import { MoreHorizontalIcon } from "lucide-react"
import { toast } from "sonner"
import type { Habit } from "@/types"
import { archiveHabit, deleteHabit } from "@/app/(app)/habits/actions"
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
  onDeleted?: () => void
}

export function HabitActions({
  habit,
  onArchived,
  onDeleted,
}: HabitActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleArchive = () => {
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

  const handleDelete = () => {
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
              className="size-[36px] rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              disabled={isPending}
              aria-label="Habit options"
            >
              <MoreHorizontalIcon className="size-4" />
            </button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive} disabled={isPending}>
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <HabitDialog
        habit={habit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-[14px] border border-border bg-card shadow-none p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-bold tracking-[-0.02em]">
              Delete habit
            </DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground mt-2">
              Are you sure you want to delete &quot;{habit.name}&quot;? This
              action cannot be undone.
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
