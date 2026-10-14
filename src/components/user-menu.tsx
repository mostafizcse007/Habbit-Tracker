"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { logout } from "@/app/(auth)/actions"
import { Avatar } from "@/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  email: string
  displayName: string
  avatarPath: string | null
}

export function UserMenu({ email, displayName, avatarPath }: UserMenuProps) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="cursor-pointer select-none rounded-full"
            aria-label="User menu"
          >
            <Avatar name={displayName} avatarPath={avatarPath} size={36} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="font-semibold text-foreground truncate">
              {displayName}
            </div>
            <div className="text-[13px] text-muted-foreground truncate">
              {email}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="sm:hidden cursor-pointer"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            Switch theme
          </DropdownMenuItem>
          <div className="sm:hidden">
            <DropdownMenuSeparator />
          </div>
          <DropdownMenuItem
            nativeButton={false}
            render={<Link href="/profile" className="w-full cursor-pointer" />}
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={logout}>
            <DropdownMenuItem
              variant="destructive"
              nativeButton={true}
              render={
                <button
                  type="submit"
                  className="w-full text-left cursor-pointer"
                />
              }
            >
              Log out
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
