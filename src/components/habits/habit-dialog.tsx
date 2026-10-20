"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Habit } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HabitForm } from "@/components/habits/habit-form"

interface HabitDialogProps {
  habit?: Habit
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement
  onSuccess?: (updatedData?: Partial<Habit> & { id?: string }) => void
}

export function HabitDialog({
  habit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSuccess,
}: HabitDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const [formKey, setFormKey] = useState(0)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFormKey((k) => k + 1)
    }
    setOpen(nextOpen)
  }

  const handleSuccess = (updatedData?: Partial<Habit> & { id?: string }) => {
    toast.success(habit ? "Habit updated" : "Habit created")
    handleOpenChange(false)
    router.refresh()
    if (onSuccess) {
      onSuccess(updatedData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="rounded-t-[14px] md:rounded-[14px] border-t md:border border-border bg-card shadow-none p-6">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-bold tracking-[-0.02em]">
            {habit ? "Edit habit" : "New habit"}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground mt-1">
            {habit
              ? "Update your habit details below."
              : "Create a new habit to track your consistency."}
          </DialogDescription>
        </DialogHeader>
        <HabitForm key={formKey} habit={habit} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
