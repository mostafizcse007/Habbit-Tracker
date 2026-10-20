"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "@/app/(auth)/actions"

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    null
  )

  if (state?.message) {
    return (
      <div>
        <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-foreground">
          Check your email
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">
          {state.message}
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="text-[14px] text-foreground underline underline-offset-4 font-medium"
          >
            Back to log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-foreground">
        Reset password
      </h1>
      <p className="text-[15px] text-muted-foreground mt-2">
        Enter your email address and we will send you a recovery link.
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-[14px] font-medium text-foreground block"
          >
            Email{" "}
            <span aria-hidden="true" className="text-muted-foreground ml-0.5">
              *
            </span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={Boolean(state?.error)}
            aria-describedby={state?.error ? "reset-error" : undefined}
            placeholder="you@example.com"
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
          {isPending ? "Sending link..." : "Send reset link"}
        </button>

        <p className="text-[14px] text-muted-foreground text-center">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4 font-medium"
          >
            Back to log in
          </Link>
        </p>
      </form>
    </div>
  )
}
