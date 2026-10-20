"use client"

import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      className={`size-[36px] shrink-0 inline-flex items-center justify-center rounded-full border border-border bg-transparent text-foreground hover:bg-muted transition-colors cursor-pointer relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className ?? ""}`}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <SunIcon className="size-[18px] stroke-2 dark:hidden" aria-hidden="true" />
      <MoonIcon className="hidden size-[18px] stroke-2 dark:block" aria-hidden="true" />
    </button>
  )
}
