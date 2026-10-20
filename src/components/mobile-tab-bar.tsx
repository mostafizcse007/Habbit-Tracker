"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarCheck,
  ListChecks,
  ChartNoAxesColumn,
  Medal,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TabItem {
  href: string
  label: string
  icon: LucideIcon
}

const TABS: TabItem[] = [
  {
    href: "/dashboard",
    label: "Today",
    icon: CalendarCheck,
  },
  {
    href: "/habits",
    label: "Habits",
    icon: ListChecks,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: ChartNoAxesColumn,
  },
  {
    href: "/achievements",
    label: "Achievements",
    icon: Medal,
  },
]

export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-card border-t border-border pb-[env(safe-area-inset-bottom)] select-none"
    >
      <div className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center min-h-[56px] min-w-[44px] gap-[2px] motion-safe:active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[28px] h-[3px] rounded-b bg-highlight-solid"
                  aria-hidden="true"
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.25 : 2}
                className="size-[22px] shrink-0"
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-[12px] leading-tight whitespace-nowrap",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
