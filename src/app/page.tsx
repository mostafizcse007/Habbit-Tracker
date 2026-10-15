import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/brand"
import { LandingPage } from "@/components/landing/landing-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: {
    absolute: `${APP_NAME}: ${APP_TAGLINE}`,
  },
  description: APP_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return <LandingPage />
}
