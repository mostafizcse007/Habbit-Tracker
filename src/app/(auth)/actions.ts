"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type AuthActionState = {
  error?: string
  message?: string
} | null

export async function login(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email")
  const password = formData.get("password")

  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required" }
  }

  if (typeof password !== "string" || !password) {
    return { error: "Password is required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "Your email address is not verified yet. Please check your inbox for the verification link.",
      }
    }
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function signup(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawFullName = formData.get("full_name")
  const rawUsername = formData.get("username")
  const email = formData.get("email")
  const password = formData.get("password")

  if (typeof rawFullName !== "string" || !rawFullName.trim()) {
    return { error: "Full name is required" }
  }
  const fullName = rawFullName.trim()
  if (fullName.length > 60) {
    return { error: "Full name must be at most 60 characters" }
  }

  if (typeof rawUsername !== "string" || !rawUsername.trim()) {
    return { error: "Username is required" }
  }
  const username = rawUsername.trim().toLowerCase()
  if (username.length < 2 || username.length > 30) {
    return { error: "Username must be between 2 and 30 characters" }
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return {
      error:
        "Username may only contain letters, numbers, dots, underscores, and hyphens",
    }
  }

  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required" }
  }

  const trimmedEmail = email.trim()
  if (!trimmedEmail.includes("@")) {
    return { error: "Please enter a valid email address" }
  }

  if (typeof password !== "string" || !password) {
    return { error: "Password is required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  const supabase = await createClient()

  // Check username availability
  const { data: isAvailable, error: checkError } = await supabase.rpc(
    "check_username_available",
    { check_username: username }
  )

  if (!checkError && isAvailable === false) {
    return { error: "This username is already taken. Please choose another." }
  }

  const headersList = await headers()
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "localhost:3000"
  const protocol =
    headersList.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https")
  const origin = `${protocol}://${host}`

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/login?verified=true`,
      data: {
        full_name: fullName,
        username,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    try {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
        })
        .eq("id", data.user.id)
    } catch {}
  }

  if (data.session) {
    redirect("/dashboard")
  }

  return {
    message: `We've sent a verification link to ${trimmedEmail}. Please check your inbox and click the link to verify your account, then log in.`,
  }
}

export async function resendVerificationEmail(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email")
  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required" }
  }

  const headersList = await headers()
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "localhost:3000"
  const protocol =
    headersList.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https")
  const origin = `${protocol}://${host}`

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/login?verified=true`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { message: "A new verification link has been sent to your email." }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function requestPasswordReset(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email")

  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required" }
  }

  const trimmedEmail = email.trim()
  if (!trimmedEmail.includes("@")) {
    return { error: "Please enter a valid email address" }
  }

  const supabase = await createClient()

  let origin = process.env.NEXT_PUBLIC_SITE_URL
  if (!origin) {
    try {
      const headerList = await headers()
      const host = headerList.get("host")
      const proto = headerList.get("x-forwarded-proto") ?? "http"
      if (host) {
        origin = `${proto}://${host}`
      }
    } catch {}
  }
  if (!origin) {
    origin = "http://localhost:3000"
  }

  const redirectTo = `${origin}/auth/callback?next=/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    message:
      "If an account exists with this email, you will receive password reset instructions shortly.",
  }
}

export async function resetPassword(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = formData.get("password")
  const confirm = formData.get("confirm")

  if (typeof password !== "string" || !password) {
    return { error: "New password is required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  if (typeof confirm !== "string" || password !== confirm) {
    return { error: "Passwords do not match" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error:
        "Your password reset link is invalid or has expired. Please request a new one.",
    }
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function startDemo(
  prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  void prevState
  void formData
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  const { error: signInError } = await supabase.auth.signInAnonymously()

  if (signInError) {
    const msg = signInError.message.toLowerCase()
    const code = (signInError.code || "").toLowerCase()
    const status = signInError.status

    if (
      msg.includes("anonymous") &&
      (msg.includes("disabled") || msg.includes("not enabled"))
    ) {
      return { error: "The demo is not available right now." }
    }

    if (
      status === 429 ||
      code.includes("rate_limit") ||
      msg.includes("rate limit") ||
      msg.includes("too many requests")
    ) {
      return {
        error: "The demo is busy right now. Please try again in a minute.",
      }
    }

    return { error: "Could not open the demo. Please try again." }
  }

  const { error: seedError } = await supabase.rpc("seed_demo_data")

  if (seedError) {
    await supabase.auth.signOut()
    return { error: "Could not set up the demo. Please try again." }
  }

  redirect("/dashboard")
}

export async function leaveDemo(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/signup")
}
