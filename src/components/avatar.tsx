import Image from "next/image"
import { getAvatarUrl } from "@/lib/avatar"
import { cn } from "@/lib/utils"

interface AvatarProps {
  name: string
  avatarPath: string | null
  size: 36 | 72
}

export function Avatar({ name, avatarPath, size }: AvatarProps) {
  const url = getAvatarUrl(avatarPath)
  const initial = name.trim() ? name.trim()[0].toUpperCase() : "U"

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className={cn(
          "rounded-full object-cover shrink-0 select-none",
          size === 72 ? "size-[72px]" : "size-[36px]"
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        "rounded-full bg-foreground text-background font-bold flex items-center justify-center shrink-0 select-none",
        size === 72 ? "size-[72px] text-[28px]" : "size-[36px] text-[14px]"
      )}
    >
      {initial}
    </span>
  )
}
