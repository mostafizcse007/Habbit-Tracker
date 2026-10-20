"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface AppNavProps {
  mobile?: boolean
}

export function AppNav({ mobile }: AppNavProps) {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Today" },
    { href: "/habits", label: "Habits" },
    { href: "/analytics", label: "Analytics" },
    { href: "/achievements", label: "Achievements" },
  ]

  return (
    <nav
      aria-label="Main"
      className={cn(
        "flex items-center select-none",
        mobile
          ? "gap-4 sm:gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "gap-[24px]"
      )}
    >
      {links.map(({ href, label }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "text-[15px] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm",
              mobile ? "py-2.5" : "py-1",
              isActive
                ? cn(
                    "font-bold text-foreground border-b-2 border-foreground",
                    mobile && "mb-[-1px]"
                  )
                : "font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
