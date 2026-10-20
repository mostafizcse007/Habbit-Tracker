import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (error) {
    const errorMsg = errorDescription || error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    )
  }

  const supabase = await createClient()

  // Handle PKCE code exchange
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const destination = next.startsWith("/") ? next : `/${next}`
      if (destination.includes("/login")) {
        await supabase.auth.signOut()
      }
      return NextResponse.redirect(`${origin}${destination}`)
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // Handle email OTP / magic link token_hash verification
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!verifyError) {
      const destination = next.startsWith("/") ? next : `/${next}`
      if (destination.includes("/login")) {
        await supabase.auth.signOut()
      }
      return NextResponse.redirect(`${origin}${destination}`)
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(verifyError.message)}`
    )
  }

  return NextResponse.redirect(`${origin}/login`)
}
