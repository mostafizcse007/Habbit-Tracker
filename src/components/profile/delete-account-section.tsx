"use client"

import { useActionState, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { deleteAccount } from "@/app/(app)/profile/actions"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [inputVal, setInputVal] = useState("")
  const [state, formAction, isPending] = useActionState(deleteAccount, null)

  const isConfirmed = inputVal.trim().toLowerCase() === "delete my account"

  return (
    <div className="p-4 sm:p-6 md:p-8 border-t border-border grid md:grid-cols-[260px_1fr] gap-6 md:gap-8">
      <div>
        <h2 className="text-[17px] font-semibold text-destructive">
          Danger zone
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Permanently delete your account and all associated data.
        </p>
      </div>

      <div className="w-full max-w-[440px]">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-[14px] text-foreground font-medium">
            Delete your account and all data
          </p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Once deleted, all habits, streaks, reflections, notes, and
            achievements are immediately and permanently erased. This cannot be
            undone.
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="mt-2 h-10 px-4 rounded-[10px] bg-destructive text-destructive-foreground text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                >
                  Delete account...
                </button>
              }
            />

            <DialogContent className="max-w-[460px]">
              <DialogHeader>
                <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                  <AlertTriangle className="size-5" />
                </div>
                <DialogTitle className="text-[20px] font-bold text-foreground">
                  Delete your account?
                </DialogTitle>
                <DialogDescription className="text-[14px] text-muted-foreground mt-1">
                  This action is permanent and cannot be reversed. All your data
                  will be wiped immediately.
                </DialogDescription>
              </DialogHeader>

              <form action={formAction} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="confirmation-input"
                    className="text-[13px] text-muted-foreground block"
                  >
                    To confirm, please type{" "}
                    <strong className="text-foreground font-semibold">
                      delete my account
                    </strong>{" "}
                    below:
                  </label>
                  <input
                    id="confirmation-input"
                    name="confirmation"
                    type="text"
                    autoComplete="off"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="delete my account"
                    required
                    className="h-11 w-full rounded-lg px-3.5 text-base md:text-[14px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                  />
                </div>

                {state?.error && (
                  <p role="alert" className="text-[14px] text-destructive">
                    {state.error}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <DialogClose
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 px-4 rounded-[10px] text-[14px] font-medium cursor-pointer"
                      >
                        Cancel
                      </Button>
                    }
                  />
                  <Button
                    type="submit"
                    disabled={!isConfirmed || isPending}
                    variant="destructive"
                    className="h-10 px-4 rounded-[10px] text-[14px] font-semibold cursor-pointer disabled:opacity-40"
                  >
                    {isPending ? "Deleting..." : "Permanently delete"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
