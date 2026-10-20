"use client"

import { useActionState } from "react"
import Link from "next/link"
import { resetPassword } from "@/app/(auth)/actions"

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPassword, null)

  return (
    <div>
      <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-foreground">
        Set new password
      </h1>
      <p className="text-[15px] text-muted-foreground mt-2">
        Choose a secure password with at least 6 characters.
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-[14px] font-medium text-foreground block"
          >
            New password{" "}
            <span aria-hidden="true" className="text-muted-foreground ml-0.5">
              *
            </span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            aria-required="true"
            aria-invalid={Boolean(state?.error)}
            aria-describedby={state?.error ? "reset-error" : undefined}
            className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirm"
            className="text-[14px] font-medium text-foreground block"
          >
            Confirm new password{" "}
            <span aria-hidden="true" className="text-muted-foreground ml-0.5">
              *
            </span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            aria-required="true"
            aria-invalid={Boolean(state?.error)}
            aria-describedby={state?.error ? "reset-error" : undefined}
            className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        {state?.error && (
          <p
            id="reset-error"
            role="alert"
            className="text-[14px] text-destructive"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isPending ? "Updating password..." : "Update password"}
        </button>

        <p className="text-[14px] text-muted-foreground text-center">
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4 font-medium"
          >
            Cancel and return to log in
          </Link>
        </p>
      </form>
    </div>
  )
}
