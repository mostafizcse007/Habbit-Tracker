import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Log in",
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-muted/20 rounded-[12px]" />}>
      <LoginForm />
    </Suspense>
  )
}
