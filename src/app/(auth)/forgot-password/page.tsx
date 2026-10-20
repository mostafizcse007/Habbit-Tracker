import type { Metadata } from "next"
import { ForgotPasswordForm } from "./forgot-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a reset link for your password",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
