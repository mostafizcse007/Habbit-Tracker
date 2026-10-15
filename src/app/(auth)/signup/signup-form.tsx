"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signup } from "@/app/(auth)/actions"

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, null)

  if (state?.message) {
    return (
      <div>
        <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-foreground">
          Check your email
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2">
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
        Create your account
      </h1>
      <p className="text-[15px] text-muted-foreground mt-2">
        Use at least 6 characters for your password.
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-[14px] font-medium text-foreground block"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11 w-full rounded-lg px-3.5 text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-[14px] font-medium text-foreground block"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="h-11 w-full rounded-lg px-3.5 text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-[14px] text-destructive">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Creating account..." : "Create account"}
        </button>

        <p className="text-[14px] text-muted-foreground text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4 font-medium"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
