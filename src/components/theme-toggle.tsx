"use client"

import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      className={`size-[36px] shrink-0 inline-flex items-center justify-center rounded-full border border-border bg-transparent text-foreground hover:bg-muted transition-colors cursor-pointer ${className ?? ""}`}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <SunIcon className="size-[18px] stroke-2 dark:hidden" />
      <MoonIcon className="hidden size-[18px] stroke-2 dark:block" />
    </button>
  )
}
