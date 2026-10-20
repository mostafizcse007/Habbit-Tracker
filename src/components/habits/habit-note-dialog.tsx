"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { Habit } from "@/types"
import { parseLocalDateString } from "@/lib/dates"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface HabitNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit
  date: string
  initialNote?: string | null
  onSave: (habitId: string, date: string, note: string | null) => Promise<void>
}

interface HabitNoteFormProps {
  habit: Habit
  date: string
  initialNote?: string | null
  onSave: (habitId: string, date: string, note: string | null) => Promise<void>
  onClose: () => void
}

function HabitNoteForm({
  habit,
  date,
  initialNote,
  onSave,
  onClose,
}: HabitNoteFormProps) {
  const [note, setNote] = useState<string>(initialNote ?? "")
  const [isSaving, setIsSaving] = useState(false)

  const formattedDate = date
    ? parseLocalDateString(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(habit.id, date, note.trim() || null)
      toast.success(note.trim() ? "Note saved" : "Note removed")
      onClose()
    } catch {
      toast.error("Failed to save note")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsSaving(true)
    try {
      await onSave(habit.id, date, null)
      setNote("")
      toast.success("Note removed")
      onClose()
    } catch {
      toast.error("Failed to remove note")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: habit.color }}
          />
          <DialogTitle className="text-[20px] font-bold tracking-[-0.02em]">
            Daily Note
          </DialogTitle>
        </div>
        <DialogDescription className="text-[13.5px] text-muted-foreground mt-1">
          {habit.name} • {formattedDate}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-3">
        <div className="relative">
          <label htmlFor="daily-habit-note-input" className="sr-only">
            Daily note for {habit.name} on {formattedDate}
          </label>
          <textarea
            id="daily-habit-note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How did this habit go today? Any obstacles or wins..."
            maxLength={500}
            rows={4}
            className="w-full rounded-lg p-3 text-[14px] leading-relaxed border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <div className="text-right text-[11px] text-muted-foreground mt-1 tabular-nums">
            {note.length} / 500
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {initialNote ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="text-[13px] font-medium text-destructive hover:underline cursor-pointer disabled:opacity-50 min-h-[36px] inline-flex items-center rounded-sm px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Delete note
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="h-9 px-4 rounded-lg text-[13px] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export function HabitNoteDialog({
  open,
  onOpenChange,
  habit,
  date,
  initialNote,
  onSave,
}: HabitNoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-t-[14px] md:rounded-[14px] border-t md:border border-border bg-card shadow-none p-6 max-w-[480px]">
        {open && (
          <HabitNoteForm
            habit={habit}
            date={date}
            initialNote={initialNote}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
