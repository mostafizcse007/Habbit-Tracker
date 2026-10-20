import Link from "next/link"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isDemoUser } from "@/lib/demo"
import { leaveDemo } from "@/app/(auth)/actions"
import { AppNav } from "@/components/app-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { TimezoneSync } from "@/components/timezone-sync"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { APP_NAME } from "@/lib/brand"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_path, timezone")
    .eq("id", user.id)
    .maybeSingle()

  const isDemo = isDemoUser(user)
  const email = user.email ?? ""
  const emailPrefix = email ? email.split("@")[0] : ""
  const displayName =
    (isDemo ? "Demo" : null) ||
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    emailPrefix ||
    "User"

  const hasTimezone = Boolean(profile?.timezone)

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[10px] focus:text-[14px] focus:font-semibold focus:outline-none"
      >
        Skip to content
      </a>
      <TimezoneSync hasTimezone={hasTimezone} />
      <header className="w-full pt-[env(safe-area-inset-top)] md:pt-0">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-8">
          <div className="flex h-[56px] md:h-[72px] items-center justify-between">
            <div className="flex items-center md:gap-[36px]">
              <Link
                href="/dashboard"
                className="text-[19px] sm:text-[20px] font-bold tracking-[-0.02em] text-foreground"
              >
                {APP_NAME}
              </Link>
              <div className="hidden md:flex">
                <AppNav />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <UserMenu
                email={email}
                displayName={displayName}
                avatarPath={profile?.avatar_path ?? null}
                isDemo={isDemo}
              />
            </div>
          </div>
        </div>
      </header>

      {isDemo && (
        <div className="max-w-[1040px] mx-auto w-full px-4 sm:px-8 mt-2">
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-highlight px-4 py-2.5 text-[14px] text-foreground"
          >
            <span>
              You are exploring a demo with sample data. It is deleted after 7 days.
            </span>
            <form action={leaveDemo}>
              <button
                type="submit"
                className="font-semibold underline cursor-pointer hover:opacity-80 transition-opacity"
              >
                Create your account
              </button>
            </form>
          </div>
        </div>
      )}

      <main id="main" className="max-w-[1040px] mx-auto w-full px-4 sm:px-8 pt-8 sm:pt-10 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0 flex-1 min-w-0">
        {children}
      </main>

      <MobileTabBar />
    </div>
  )
}
