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
    { href: "/achievements", label: "Badges", ariaLabel: "Achievements" },
  ]

  return (
    <nav
      className={cn(
        "flex items-center",
        mobile
          ? "gap-4 sm:gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "gap-[24px]"
      )}
    >
      {links.map(({ href, label, ariaLabel }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            aria-label={ariaLabel}
            className={cn(
              "text-[15px] transition-colors whitespace-nowrap shrink-0",
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
