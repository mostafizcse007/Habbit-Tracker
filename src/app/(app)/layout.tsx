import Link from "next/link"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AppNav } from "@/components/app-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { TimezoneSync } from "@/components/timezone-sync"

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

  const email = user.email ?? ""
  const emailPrefix = email ? email.split("@")[0] : ""
  const displayName =
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    emailPrefix ||
    "User"

  const hasTimezone = Boolean(profile?.timezone)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TimezoneSync hasTimezone={hasTimezone} />
      <header className="w-full">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-8">
          <div className="flex h-[60px] sm:h-[72px] items-center justify-between">
            <div className="flex items-center sm:gap-[36px]">
              <Link
                href="/dashboard"
                className="text-[19px] sm:text-[20px] font-bold tracking-[-0.02em] text-foreground"
              >
                Habit Tracker
              </Link>
              <div className="hidden sm:flex">
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
              />
            </div>
          </div>
        </div>

        <div className="sm:hidden border-b border-border">
          <div className="max-w-[1040px] mx-auto px-4">
            <AppNav mobile />
          </div>
        </div>
      </header>

      <main className="max-w-[1040px] mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 flex-1">
        {children}
      </main>
    </div>
  )
}
