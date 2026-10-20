"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { updatePassword } from "@/app/(app)/profile/actions"

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state && "success" in state) {
      toast.success("Password updated.")
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction}>
      <div className="p-4 sm:p-6 md:p-8 border-t border-border grid md:grid-cols-[260px_1fr] gap-6 md:gap-8">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">
            Password
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Ensure your account is using a long, random password.
          </p>
        </div>

        <div className="w-full max-w-[440px] space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-[14px] font-medium text-foreground block"
            >
              New password <span aria-hidden="true" className="text-muted-foreground ml-0.5">*</span><span className="sr-only">(required)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              aria-required="true"
              aria-invalid={Boolean(state && "error" in state)}
              aria-describedby={state && "error" in state ? "password-error" : undefined}
              minLength={6}
              autoComplete="new-password"
              className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm"
              className="text-[14px] font-medium text-foreground block"
            >
              Confirm password <span aria-hidden="true" className="text-muted-foreground ml-0.5">*</span><span className="sr-only">(required)</span>
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              aria-required="true"
              aria-invalid={Boolean(state && "error" in state)}
              aria-describedby={state && "error" in state ? "password-error" : undefined}
              minLength={6}
              autoComplete="new-password"
              className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          {state && "error" in state && (
            <p id="password-error" role="alert" className="text-[14px] text-destructive">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-60 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {isPending ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>
    </form>
  )
}
