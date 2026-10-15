import Link from "next/link"
import { APP_NAME } from "@/lib/brand"

export function LandingFooter() {
  return (
    <footer className="mt-[72px] pt-8 pb-14 border-t border-border flex flex-wrap items-center justify-between gap-6">
      <div>
        <div className="text-[16px] font-bold tracking-[-0.02em] text-foreground">
          {APP_NAME}
        </div>
        <p className="text-[14px] text-muted-foreground mt-1">
          A practice project built with Next.js and Supabase.
        </p>
      </div>

      <div className="flex items-center gap-6 text-[14px] font-medium">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Create account
        </Link>
      </div>
    </footer>
  )
}
