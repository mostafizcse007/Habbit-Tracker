"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "@/components/avatar"
import { updateAvatar } from "@/app/(app)/profile/actions"

interface AvatarUploadProps {
  userId: string
  initialAvatarPath: string | null
  name: string
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_FILE_SIZE = 2 * 1024 * 1024

export function AvatarUpload({
  userId,
  initialAvatarPath,
  name,
}: AvatarUploadProps) {
  const [avatarPath, setAvatarPath] = useState<string | null>(initialAvatarPath)
  const [prevInitial, setPrevInitial] = useState<string | null>(initialAvatarPath)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (prevInitial !== initialAvatarPath) {
    setPrevInitial(initialAvatarPath)
    setAvatarPath(initialAvatarPath)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Choose a PNG, JPEG or WebP image.")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("That image is larger than 2 MB.")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setIsUploading(true)

    let extension = "png"
    if (file.type === "image/jpeg") {
      extension = "jpg"
    } else if (file.type === "image/webp") {
      extension = "webp"
    }

    const fileName = `${crypto.randomUUID()}.${extension}`
    const filePath = `${userId}/${fileName}`

    try {
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: false })

      if (uploadError) {
        toast.error(uploadError.message)
        return
      }

      const res = await updateAvatar(filePath)
      if (res && "error" in res) {
        await supabase.storage.from("avatars").remove([filePath])
        toast.error(res.error)
      } else {
        setAvatarPath(filePath)
        toast.success("Photo updated.")
      }
    } catch {
      toast.error("Failed to upload photo.")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    startTransition(async () => {
      try {
        const res = await updateAvatar(null)
        if (res && "error" in res) {
          toast.error(res.error)
        } else {
          setAvatarPath(null)
          toast.success("Photo removed.")
        }
      } catch {
        toast.error("Failed to remove photo.")
      }
    })
  }

  const isWorking = isUploading || isPending

  return (
    <div className="p-6 md:p-8 grid md:grid-cols-[260px_1fr] gap-6 md:gap-8">
      <div>
        <h2 className="text-[17px] font-semibold text-foreground">
          Photo
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          A square image works best. PNG, JPEG or WebP, up to 2 MB.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name} avatarPath={avatarPath} size={72} />

        <div className="flex items-center gap-3">
          <label htmlFor="avatar-file-input" className="sr-only">
            Upload profile photo
          </label>
          <input
            ref={fileInputRef}
            id="avatar-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={isWorking}
            className="sr-only"
            aria-label="Upload profile photo"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className="h-11 px-5 rounded-[10px] border border-input bg-transparent text-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-60 transition-opacity hover:bg-muted"
          >
            {isUploading ? "Uploading..." : "Upload photo"}
          </button>

          {avatarPath && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isWorking}
              className="text-[14px] font-medium text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-60 transition-colors"
            >
              {isPending ? "Removing..." : "Remove"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
