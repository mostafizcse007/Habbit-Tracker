"use server"

import { redirect } from "next/navigation"
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
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function signup(
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
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.session) {
    redirect("/dashboard")
  }

  return { message: "Check your email to confirm your account, then log in." }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
