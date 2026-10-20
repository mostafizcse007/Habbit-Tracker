import Image from "next/image"
import { getAvatarUrl } from "@/lib/avatar"
import { cn } from "@/lib/utils"

interface AvatarProps {
  name: string
  avatarPath: string | null
  size?: 36 | 72 | 88 | 96
  className?: string
}

export function Avatar({ name, avatarPath, size = 36, className }: AvatarProps) {
  const url = getAvatarUrl(avatarPath)
  const initial = name.trim() ? name.trim()[0].toUpperCase() : "U"

  const sizeClasses = {
    36: "size-[36px] text-[14px]",
    72: "size-[72px] text-[28px]",
    88: "size-[88px] text-[34px]",
    96: "size-[96px] text-[38px]",
  }[size]

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className={cn(
          "rounded-full object-cover shrink-0 select-none",
          sizeClasses,
          className
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        "rounded-full bg-foreground text-background font-bold flex items-center justify-center shrink-0 select-none",
        sizeClasses,
        className
      )}
    >
      {initial}
    </span>
  )
}
