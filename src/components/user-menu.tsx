"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { logout, leaveDemo } from "@/app/(auth)/actions"
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
  isDemo?: boolean
}

export function UserMenu({
  email,
  displayName,
  avatarPath,
  isDemo,
}: UserMenuProps) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="cursor-pointer select-none rounded-full relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`User menu for ${displayName}`}
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
              {isDemo ? "Demo account" : email}
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
          {isDemo && (
            <>
              <form action={leaveDemo}>
                <DropdownMenuItem
                  nativeButton={true}
                  render={
                    <button
                      type="submit"
                      className="w-full text-left font-semibold text-foreground cursor-pointer"
                    />
                  }
                >
                  Create your account
                </DropdownMenuItem>
              </form>
              <DropdownMenuSeparator />
            </>
          )}
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
