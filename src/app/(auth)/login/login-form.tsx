"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { login } from "@/app/(auth)/actions"

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null)
  const searchParams = useSearchParams()
  const isVerified = searchParams.get("verified") === "true"
  const urlError = searchParams.get("error")

  return (
    <div>
      <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-foreground">
        Log in
      </h1>
      <p className="text-[15px] text-muted-foreground mt-2">
        Enter your email and password to continue.
      </p>

      {isVerified && (
        <div className="mt-6 p-4 rounded-[12px] bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[14px] font-semibold">Email verified!</p>
            <p className="text-[13px] opacity-90">
              Your account has been verified. You can now log in with your credentials.
            </p>
          </div>
        </div>
      )}

      {urlError && !isVerified && (
        <div className="mt-6 p-4 rounded-[12px] bg-destructive/10 border border-destructive/25 flex items-start gap-3 text-destructive">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <p className="text-[14px] font-medium leading-snug">
            {urlError}
          </p>
        </div>
      )}

      <form action={formAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-[14px] font-medium text-foreground block"
          >
            Email <span aria-hidden="true" className="text-muted-foreground ml-0.5">*</span><span className="sr-only">(required)</span>
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
            aria-describedby={state?.error ? "login-error" : undefined}
            className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[14px] font-medium text-foreground block"
            >
              Password <span aria-hidden="true" className="text-muted-foreground ml-0.5">*</span><span className="sr-only">(required)</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={Boolean(state?.error)}
            aria-describedby={state?.error ? "login-error" : undefined}
            className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        {state?.error && (
          <p id="login-error" role="alert" className="text-[14px] text-destructive">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isPending ? "Logging in..." : "Log in"}
        </button>

        <p className="text-[14px] text-muted-foreground text-center">
          New here?{" "}
          <Link
            href="/signup"
            className="text-foreground underline underline-offset-4 font-medium"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}
