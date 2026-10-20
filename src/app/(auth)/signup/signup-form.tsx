"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Mail } from "lucide-react"
import { signup } from "@/app/(auth)/actions"

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, null)

  if (state?.message) {
    return (
      <div className="space-y-6">
        <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Mail className="size-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-foreground">
            Check your email
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {state.message}
          </p>
        </div>

        <div className="p-4 rounded-[12px] bg-muted/40 border border-border/60 text-[13px] text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Next steps:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open the verification email in your inbox.</li>
            <li>Click the verification link to confirm your account.</li>
            <li>You will be redirected to log in with your credentials.</li>
          </ol>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full h-11 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            Go to log in
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
            htmlFor="full_name"
            className="text-[14px] font-medium text-foreground block"
          >
            Full name <span aria-hidden="true" className="text-muted-foreground ml-0.5">*</span><span className="sr-only">(required)</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            placeholder="e.g. Alex Morgan"
            aria-required="true"
            aria-invalid={Boolean(state?.error)}
            className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="username"
            className="text-[14px] font-medium text-foreground block"
          >
            Username <span aria-hidden="true" className="text-muted-foreground ml-0.5">*</span><span className="sr-only">(required)</span>
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={2}
            maxLength={30}
            pattern="[a-zA-Z0-9._-]+"
            placeholder="e.g. alex_m"
            aria-required="true"
            aria-invalid={Boolean(state?.error)}
            className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <p className="text-[12px] text-muted-foreground">
            Must be unique. Letters, numbers, dots, and underscores only.
          </p>
        </div>

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
            aria-describedby={state?.error ? "signup-error" : undefined}
            className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-[14px] font-medium text-foreground block"
          >
            Password <span aria-hidden="true" className="text-muted-foreground ml-0.5">*</span><span className="sr-only">(required)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-invalid={Boolean(state?.error)}
            aria-describedby={state?.error ? "signup-error" : undefined}
            minLength={6}
            className="h-11 w-full rounded-lg px-3.5 text-base md:text-[15px] border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        {state?.error && (
          <p id="signup-error" role="alert" className="text-[14px] text-destructive">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
