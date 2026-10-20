"use client"

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useSyncExternalStore,
  useMemo,
} from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import {
  User,
  AtSign,
  Mail,
  Globe,
  Lock,
  KeyRound,
  ShieldCheck,
  Calendar,
  Zap,
  CheckCircle2,
  Camera,
  Download,
  AlertTriangle,
  Copy,
  Check,
  Clock,
  Sparkles,
  Palette,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
} from "lucide-react"
import type { Profile } from "@/types"
import { Avatar } from "@/components/avatar"
import { getTimeZoneList } from "@/lib/timezone"
import {
  updateProfile,
  updatePassword,
  updateAvatar,
  deleteAccount,
  exportUserData,
} from "@/app/(app)/profile/actions"
import { leaveDemo } from "@/app/(auth)/actions"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CoverPreset {
  id: string
  name: string
  description: string
  gradient: string
}

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: "aurora",
    name: "Aurora Bloom",
    description: "Vibrant violet, soft pink, and emerald ambient glow",
    gradient:
      "linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(236, 72, 153, 0.28) 50%, rgba(16, 185, 129, 0.28) 100%)",
  },
  {
    id: "sunset",
    name: "Sunset Mirage",
    description: "Warm amber, crimson, and neon magenta dusk",
    gradient:
      "linear-gradient(135deg, rgba(249, 115, 22, 0.45) 0%, rgba(236, 72, 153, 0.35) 50%, rgba(139, 92, 246, 0.35) 100%)",
  },
  {
    id: "midnight",
    name: "Midnight Neon",
    description: "Deep sky blue, electric indigo, and purple haze",
    gradient:
      "linear-gradient(135deg, rgba(14, 165, 233, 0.4) 0%, rgba(99, 102, 241, 0.4) 50%, rgba(168, 85, 247, 0.35) 100%)",
  },
  {
    id: "emerald",
    name: "Emerald Zen",
    description: "Calming botanical mint, jade, and deep teal",
    gradient:
      "linear-gradient(135deg, rgba(16, 185, 129, 0.45) 0%, rgba(5, 150, 105, 0.35) 50%, rgba(20, 184, 166, 0.35) 100%)",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Dusk",
    description: "Electrifying hot magenta, violet, and neon cyan",
    gradient:
      "linear-gradient(135deg, rgba(236, 72, 153, 0.5) 0%, rgba(124, 58, 237, 0.45) 50%, rgba(6, 182, 212, 0.4) 100%)",
  },
  {
    id: "ocean",
    name: "Oceanic Abyss",
    description: "Deep aquamarine, cerulean, and marine cobalt",
    gradient:
      "linear-gradient(135deg, rgba(6, 182, 212, 0.45) 0%, rgba(59, 130, 246, 0.4) 50%, rgba(30, 58, 138, 0.5) 100%)",
  },
  {
    id: "golden",
    name: "Golden Hour",
    description: "Rich amber sunshine, warm honey, and velvet coral",
    gradient:
      "linear-gradient(135deg, rgba(245, 158, 11, 0.45) 0%, rgba(244, 63, 94, 0.35) 50%, rgba(217, 70, 239, 0.3) 100%)",
  },
  {
    id: "obsidian",
    name: "Obsidian Minimal",
    description: "Sleek carbon weave, dark titanium, and slate",
    gradient:
      "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
  },
]

const DEFAULT_COVER = { type: "preset" as const, presetId: "aurora" }

function subscribeCover(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener("storage", callback)
  window.addEventListener("habit_cover_updated", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("habit_cover_updated", callback)
  }
}

interface ProfileViewProps {
  user: {
    id: string
    email: string
    created_at: string
  }
  profile: Profile | null
  habitsCount: number
  totalLogsCount: number
  isDemo: boolean
}

type TabKey = "general" | "preferences" | "security" | "data"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_FILE_SIZE = 2 * 1024 * 1024

export function ProfileView({
  user,
  profile,
  habitsCount,
  totalLogsCount,
  isDemo,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("general")
  const [copiedHandle, setCopiedHandle] = useState(false)

  // Avatar upload state
  const [avatarPath, setAvatarPath] = useState<string | null>(
    profile?.avatar_path ?? null
  )
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isRemovingAvatar, startRemoveAvatarTransition] = useTransition()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Profile details form state
  const [profileState, profileFormAction, isProfilePending] = useActionState(
    updateProfile,
    null
  )

  // Password update form state
  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
    updatePassword,
    null
  )
  const passwordFormRef = useRef<HTMLFormElement>(null)

  // Delete account modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteAccount,
    null
  )

  // Timezone preview state
  const timeZones = getTimeZoneList()
  const [deviceTz] = useState<string>(() => {
    if (typeof Intl !== "undefined") {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      } catch {}
    }
    return "UTC"
  })
  const [selectedTz, setSelectedTz] = useState<string>(() => {
    if (profile?.timezone) return profile.timezone
    if (typeof Intl !== "undefined") {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      } catch {}
    }
    return "UTC"
  })
  const [currentTimeInSelectedTz, setCurrentTimeInSelectedTz] =
    useState<string>("")
  const [isExporting, setIsExporting] = useState(false)

  // Cover banner state with useSyncExternalStore for hydration-safe reactive sync
  const savedCoverJson = useSyncExternalStore(
    subscribeCover,
    () => {
      try {
        return localStorage.getItem(`habit_cover_${user.id}`)
      } catch {
        return null
      }
    },
    () => null
  )

  const coverConfig = useMemo(() => {
    if (!savedCoverJson) return DEFAULT_COVER
    try {
      return JSON.parse(savedCoverJson)
    } catch {
      return DEFAULT_COVER
    }
  }, [savedCoverJson])

  const [coverModalOpen, setCoverModalOpen] = useState(false)
  const [coverModalTab, setCoverModalTab] = useState<"presets" | "custom">(
    "presets"
  )
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Update live clock for selected timezone
  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date()
        const formatted = new Intl.DateTimeFormat("en-US", {
          timeZone: selectedTz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(now)
        setCurrentTimeInSelectedTz(formatted)
      } catch {
        setCurrentTimeInSelectedTz("")
      }
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [selectedTz])

  useEffect(() => {
    if (profileState && "success" in profileState) {
      toast.success("Profile saved successfully.")
    }
  }, [profileState])

  useEffect(() => {
    if (passwordState && "success" in passwordState) {
      toast.success("Password updated successfully.")
      passwordFormRef.current?.reset()
    }
  }, [passwordState])

  const displayName =
    (isDemo ? "Demo User" : null) ||
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    user.email.split("@")[0] ||
    "User"

  const usernameHandle = profile?.username?.trim() || user.email.split("@")[0]

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })

  // Handle avatar file upload
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please choose a PNG, JPEG, or WebP image.")
      if (avatarInputRef.current) avatarInputRef.current.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Avatar image must be under 2 MB.")
      if (avatarInputRef.current) avatarInputRef.current.value = ""
      return
    }

    setIsUploadingAvatar(true)
    let extension = "png"
    if (file.type === "image/jpeg") extension = "jpg"
    else if (file.type === "image/webp") extension = "webp"

    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`

    try {
      const { createClient } = await import("@/lib/supabase/client")
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
        toast.success("Profile photo updated.")
      }
    } catch {
      toast.error("Failed to upload photo.")
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = ""
      setIsUploadingAvatar(false)
    }
  }

  const handleAvatarRemove = () => {
    startRemoveAvatarTransition(async () => {
      try {
        const res = await updateAvatar(null)
        if (res && "error" in res) {
          toast.error(res.error)
        } else {
          setAvatarPath(null)
          toast.success("Profile photo removed.")
        }
      } catch {
        toast.error("Failed to remove photo.")
      }
    })
  }

  const handleSelectPreset = (presetId: string) => {
    const newConfig = { type: "preset" as const, presetId }
    try {
      localStorage.setItem(`habit_cover_${user.id}`, JSON.stringify(newConfig))
      window.dispatchEvent(new Event("habit_cover_updated"))
    } catch {}
    const found = COVER_PRESETS.find((p) => p.id === presetId)
    toast.success(`Cover theme set to ${found?.name ?? "preset"}.`)
  }

  const handleCustomCoverUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image must be 5 MB or less.")
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please choose a PNG, JPEG, or WebP image.")
      return
    }

    setIsUploadingCover(true)
    try {
      let extension = "png"
      if (file.type === "image/jpeg") extension = "jpg"
      else if (file.type === "image/webp") extension = "webp"

      const filePath = `${user.id}/cover-${Date.now()}.${extension}`

      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        // Fallback to FileReader base64 URL so custom covers always succeed
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          if (dataUrl) {
            const newConfig = { type: "custom" as const, customUrl: dataUrl }
            try {
              localStorage.setItem(
                `habit_cover_${user.id}`,
                JSON.stringify(newConfig)
              )
              window.dispatchEvent(new Event("habit_cover_updated"))
            } catch {}
            toast.success("Cover image updated.")
            setCoverModalOpen(false)
          }
        }
        reader.readAsDataURL(file)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      const newConfig = { type: "custom" as const, customUrl: publicUrl }
      try {
        localStorage.setItem(
          `habit_cover_${user.id}`,
          JSON.stringify(newConfig)
        )
        window.dispatchEvent(new Event("habit_cover_updated"))
      } catch {}
      toast.success("Custom cover image uploaded.")
      setCoverModalOpen(false)
    } catch {
      toast.error("Failed to upload cover image.")
    } finally {
      if (coverInputRef.current) coverInputRef.current.value = ""
      setIsUploadingCover(false)
    }
  }

  const handleResetCover = () => {
    const newConfig = { type: "preset" as const, presetId: "aurora" }
    try {
      localStorage.setItem(`habit_cover_${user.id}`, JSON.stringify(newConfig))
      window.dispatchEvent(new Event("habit_cover_updated"))
    } catch {}
    toast.success("Cover reset to Aurora Bloom.")
  }

  const handleCopyHandle = () => {
    if (!usernameHandle) return
    navigator.clipboard.writeText(`@${usernameHandle}`)
    setCopiedHandle(true)
    toast.success(`Copied @${usernameHandle} to clipboard`)
    setTimeout(() => setCopiedHandle(false), 2000)
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await exportUserData()
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.data) {
        const jsonStr = JSON.stringify(res.data, null, 2)
        const blob = new Blob([jsonStr], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `habit-tracker-export-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success("Data export downloaded successfully.")
      }
    } catch {
      toast.error("Could not export data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const isConfirmedDelete =
    deleteInput.trim().toLowerCase() === "delete my account"

  return (
    <div className="pt-6 md:pt-10 pb-16 max-w-[880px] mx-auto space-y-8">
      {/* Demo Account Alert */}
      {isDemo && (
        <div className="relative overflow-hidden rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-5 md:p-6 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-[16px] font-bold">Demo Account Mode</h2>
            </div>
            <p className="text-[14px] text-muted-foreground max-w-[540px]">
              You are browsing with temporary demo data. Create your personal
              account to keep your habits and track consistency permanently.
            </p>
          </div>
          <form action={leaveDemo}>
            <button
              type="submit"
              className="h-10 px-5 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer shadow-sm"
            >
              Create real account
            </button>
          </form>
        </div>
      )}

      {/* Hero Profile Header */}
      <div className="relative rounded-[20px] border border-border bg-card shadow-sm overflow-hidden">
        {/* Ambient mesh cover banner with customizable style */}
        <div suppressHydrationWarning className="h-36 sm:h-44 md:h-48 w-full relative overflow-hidden group">
          {coverConfig.type === "custom" && coverConfig.customUrl ? (
            <div
              suppressHydrationWarning
              className="size-full bg-cover bg-center transition-all duration-300"
              style={{ backgroundImage: `url(${coverConfig.customUrl})` }}
            >
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />
            </div>
          ) : (
            <div
              suppressHydrationWarning
              className="size-full relative transition-all duration-300"
              style={{
                background:
                  COVER_PRESETS.find((p) => p.id === coverConfig.presetId)?.gradient ??
                  COVER_PRESETS[0].gradient,
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            </div>
          )}

          {/* Change cover button in top right of banner */}
          <button
            type="button"
            onClick={() => setCoverModalOpen(true)}
            className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md text-white text-[12px] font-medium shadow-sm transition-all border border-white/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Customize cover banner"
          >
            <Palette className="size-3.5" />
            <span>Change cover</span>
          </button>
        </div>

        {/* User Identity Details & Avatar Bar */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar Row (Only the avatar overhangs the cover banner) */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-3">
            <div className="relative group shrink-0">
              <div className="size-[88px] sm:size-[96px] rounded-full ring-4 ring-card bg-card overflow-hidden shadow-md flex items-center justify-center">
                <Avatar
                  name={displayName}
                  avatarPath={avatarPath}
                  size={88}
                  className="size-full object-cover"
                />
              </div>

              {!isDemo && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarSelect}
                    disabled={isUploadingAvatar || isRemovingAvatar}
                    className="sr-only"
                    id="hero-avatar-input"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar || isRemovingAvatar}
                    title="Change profile photo"
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  >
                    <Camera className="size-5" />
                    <span className="text-[10px] font-semibold mt-0.5">
                      {isUploadingAvatar ? "Uploading..." : "Change"}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title, Badges & Metadata (Cleanly positioned in card body below banner) */}
          <div className="space-y-1.5 mb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-foreground leading-tight">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              <button
                type="button"
                onClick={handleCopyHandle}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted/80 hover:bg-muted text-foreground transition-colors cursor-pointer group"
                title="Click to copy handle"
              >
                <AtSign className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>{usernameHandle}</span>
                {copiedHandle ? (
                  <Check className="size-3 text-emerald-500 ml-0.5" />
                ) : (
                  <Copy className="size-3 text-muted-foreground group-hover:text-foreground opacity-60 ml-0.5" />
                )}
              </button>

              <span>•</span>
              <span>{user.email}</span>

              {!isDemo && avatarPath && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={isRemovingAvatar}
                    className="text-[12px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer underline decoration-dotted"
                    title="Remove profile photo"
                  >
                    {isRemovingAvatar ? "Removing..." : "Remove photo"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/70 mt-5">
            <div className="p-3 rounded-[12px] bg-muted/40 border border-border/50">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground mb-1">
                <Zap className="size-3.5 text-amber-500" />
                Active Habits
              </div>
              <p className="text-[18px] font-bold text-foreground">
                {habitsCount}
              </p>
            </div>

            <div className="p-3 rounded-[12px] bg-muted/40 border border-border/50">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground mb-1">
                <Sparkles className="size-3.5 text-primary" />
                Check-ins
              </div>
              <p className="text-[18px] font-bold text-foreground">
                {totalLogsCount}
              </p>
            </div>

            <div className="p-3 rounded-[12px] bg-muted/40 border border-border/50">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground mb-1">
                <Globe className="size-3.5 text-blue-500" />
                Timezone
              </div>
              <p className="text-[14px] font-semibold text-foreground truncate" title={selectedTz}>
                {selectedTz.split("/")[1]?.replace(/_/g, " ") || selectedTz}
              </p>
            </div>

            <div className="p-3 rounded-[12px] bg-muted/40 border border-border/50">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground mb-1">
                <Calendar className="size-3.5 text-emerald-500" />
                Joined
              </div>
              <p className="text-[14px] font-semibold text-foreground">
                {joinedDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-[14px] bg-muted/70 border border-border/70 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
            activeTab === "general"
              ? "bg-card text-foreground shadow-xs border border-border/70"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          )}
        >
          <User className="size-4" />
          General
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={cn(
            "flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
            activeTab === "preferences"
              ? "bg-card text-foreground shadow-xs border border-border/70"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          )}
        >
          <Globe className="size-4" />
          Time & Preferences
        </button>

        {!isDemo && (
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "security"
                ? "bg-card text-foreground shadow-xs border border-border/70"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <ShieldCheck className="size-4" />
            Security
          </button>
        )}

        {!isDemo && (
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={cn(
              "flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "data"
                ? "bg-card text-foreground shadow-xs border border-border/70"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <Download className="size-4" />
            Data & Privacy
          </button>
        )}
      </div>

      {/* Tab 1: General (Personal Details) */}
      {activeTab === "general" && (
        <div className="rounded-[18px] border border-border bg-card shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-border/70 pb-4">
            <h2 className="text-[18px] font-bold text-foreground">
              Profile Details
            </h2>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Manage your display name, username handle, and public identity.
            </p>
          </div>

          <form action={profileFormAction} className="space-y-6">
            <input type="hidden" name="timezone" value={selectedTz} />

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Display Name */}
              <div className="space-y-2">
                <label
                  htmlFor="full_name"
                  className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"
                >
                  <User className="size-3.5 text-muted-foreground" />
                  Full Name / Display Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={profile?.full_name ?? ""}
                  placeholder="e.g. Mostafizur Rahman"
                  maxLength={60}
                  className="h-11 w-full rounded-[10px] px-3.5 text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
                <p className="text-[12px] text-muted-foreground">
                  The name displayed at the top of your dashboard.
                </p>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"
                >
                  <AtSign className="size-3.5 text-muted-foreground" />
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[14px]">
                    @
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    defaultValue={profile?.username ?? user.email.split("@")[0]}
                    minLength={2}
                    maxLength={30}
                    required
                    pattern="[a-zA-Z0-9._-]+"
                    className="h-11 w-full rounded-[10px] pl-8 pr-3.5 text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Unique handle. Letters, numbers, hyphens, and dots.
                </p>
              </div>
            </div>

            {/* Email (Read only) */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <label
                htmlFor="account_email"
                className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                Account Email
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  id="account_email"
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="h-11 w-full sm:max-w-[420px] rounded-[10px] px-3.5 text-[15px] border border-input/60 bg-muted/40 text-muted-foreground cursor-not-allowed select-none"
                />
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Verified & Active
                </span>
              </div>
            </div>

            {profileState && "error" in profileState && (
              <p role="alert" className="text-[14px] font-medium text-destructive">
                {profileState.error}
              </p>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isProfilePending}
                className="h-11 px-6 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isProfilePending ? "Saving changes..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Preferences (Timezone & Localization) */}
      {activeTab === "preferences" && (
        <div className="rounded-[18px] border border-border bg-card shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-border/70 pb-4">
            <h2 className="text-[18px] font-bold text-foreground">
              Time & Localization
            </h2>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Your daily check-in resets, streak calculations, and AI reviews are anchored to this timezone.
            </p>
          </div>

          <form action={profileFormAction} className="space-y-6">
            <input
              type="hidden"
              name="full_name"
              value={profile?.full_name ?? ""}
            />
            <input
              type="hidden"
              name="username"
              value={profile?.username ?? user.email.split("@")[0]}
            />

            {/* Smart Live Clock Preview */}
            <div className="p-4 rounded-[14px] bg-muted/50 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <Clock className="size-3.5 text-primary" />
                  Live Local Time ({selectedTz})
                </div>
                <p className="text-[16px] font-bold text-foreground font-mono">
                  {currentTimeInSelectedTz || "Loading clock..."}
                </p>
              </div>

              {deviceTz && deviceTz !== selectedTz && (
                <button
                  type="button"
                  onClick={() => setSelectedTz(deviceTz)}
                  className="h-9 px-3.5 rounded-[8px] bg-card border border-border hover:bg-muted text-[13px] font-medium text-foreground transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                >
                  Sync to device ({deviceTz})
                </button>
              )}
            </div>

            {/* Timezone Selector */}
            <div className="space-y-2">
              <label
                htmlFor="timezone-select"
                className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"
              >
                <Globe className="size-3.5 text-muted-foreground" />
                Select Primary Timezone
              </label>
              <select
                id="timezone-select"
                name="timezone"
                value={selectedTz}
                onChange={(e) => setSelectedTz(e.target.value)}
                className="h-11 w-full rounded-[10px] px-3.5 text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
              >
                {timeZones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-[12px] text-muted-foreground">
                Currently detected from browser:{" "}
                <strong className="text-foreground">{deviceTz}</strong>
              </p>
            </div>

            {profileState && "error" in profileState && (
              <p role="alert" className="text-[14px] font-medium text-destructive">
                {profileState.error}
              </p>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isProfilePending}
                className="h-11 px-6 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isProfilePending ? "Updating timezone..." : "Save timezone"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Security (Password Management) */}
      {!isDemo && activeTab === "security" && (
        <div className="rounded-[18px] border border-border bg-card shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-border/70 pb-4">
            <h2 className="text-[18px] font-bold text-foreground">
              Security & Credentials
            </h2>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Update your account password to ensure your tracking data stays protected.
            </p>
          </div>

          <form
            ref={passwordFormRef}
            action={passwordFormAction}
            className="space-y-6"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="new_password"
                  className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Lock className="size-3.5 text-muted-foreground" />
                  New Password
                </label>
                <input
                  id="new_password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="h-11 w-full rounded-[10px] px-3.5 text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm_password"
                  className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"
                >
                  <KeyRound className="size-3.5 text-muted-foreground" />
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  name="confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="h-11 w-full rounded-[10px] px-3.5 text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {passwordState && "error" in passwordState && (
              <p role="alert" className="text-[14px] font-medium text-destructive">
                {passwordState.error}
              </p>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isPasswordPending}
                className="h-11 px-6 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isPasswordPending ? "Updating password..." : "Update password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Data & Privacy (Export & Danger Zone) */}
      {!isDemo && activeTab === "data" && (
        <div className="space-y-6">
          {/* Data Export Card */}
          <div className="rounded-[18px] border border-border bg-card shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
                  <Download className="size-4 text-primary" />
                  Export Your Data
                </h2>
                <p className="text-[14px] text-muted-foreground max-w-[520px]">
                  Download a complete backup archive of your active habits, check-in history, journal notes, and AI reviews in standard JSON format.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="h-11 px-5 rounded-[10px] border border-border bg-muted/60 hover:bg-muted text-[14px] font-semibold text-foreground transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
              >
                <Download className="size-4" />
                {isExporting ? "Preparing export..." : "Export JSON"}
              </button>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="rounded-[18px] border border-destructive/30 bg-destructive/5 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="space-y-1">
              <h2 className="text-[18px] font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="size-4.5" />
                Danger Zone
              </h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[560px]">
                Permanently delete your account and all associated habits, daily logs, reflections, and achievements. This action is irreversible and immediate.
              </p>
            </div>

            <div className="pt-2">
              <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogTrigger
                  render={
                    <button
                      type="button"
                      className="h-10 px-4 rounded-[10px] bg-destructive text-destructive-foreground text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      Delete account...
                    </button>
                  }
                />

                <DialogContent className="max-w-[460px]">
                  <DialogHeader>
                    <div className="size-11 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mb-2">
                      <AlertTriangle className="size-5" />
                    </div>
                    <DialogTitle className="text-[20px] font-bold text-foreground">
                      Delete your account?
                    </DialogTitle>
                    <DialogDescription className="text-[14px] text-muted-foreground mt-1">
                      This action will permanently purge all your habit records and history. You cannot undo this.
                    </DialogDescription>
                  </DialogHeader>

                  <form action={deleteFormAction} className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="confirm-delete-input"
                        className="text-[13px] text-muted-foreground block"
                      >
                        To confirm, type{" "}
                        <strong className="text-foreground font-semibold">
                          delete my account
                        </strong>{" "}
                        below:
                      </label>
                      <input
                        id="confirm-delete-input"
                        name="confirmation"
                        type="text"
                        autoComplete="off"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder="delete my account"
                        required
                        className="h-11 w-full rounded-lg px-3.5 text-base md:text-[14px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                      />
                    </div>

                    {deleteState && "error" in deleteState && (
                      <p role="alert" className="text-[14px] font-medium text-destructive">
                        {deleteState.error}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
                      <DialogClose
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-4 rounded-[10px] text-[14px] font-medium cursor-pointer"
                          >
                            Cancel
                          </Button>
                        }
                      />
                      <Button
                        type="submit"
                        disabled={!isConfirmedDelete || isDeletePending}
                        variant="destructive"
                        className="h-10 px-5 rounded-[10px] text-[14px] font-semibold cursor-pointer disabled:opacity-40"
                      >
                        {isDeletePending ? "Deleting..." : "Permanently delete"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}
      {/* Cover Customization Dialog */}
      <Dialog open={coverModalOpen} onOpenChange={setCoverModalOpen}>
        <DialogContent className="max-w-[560px] p-6 space-y-5">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-[18px] font-bold flex items-center gap-2">
              <Palette className="size-5 text-primary" />
              Customize Cover Banner
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Choose a curated aesthetic gradient theme or upload your own custom banner.
            </DialogDescription>
          </DialogHeader>

          {/* Segmented Switcher for Presets vs Custom */}
          <div className="grid grid-cols-2 p-1 rounded-[10px] bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setCoverModalTab("presets")}
              className={cn(
                "h-8 rounded-[8px] text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                coverModalTab === "presets"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="size-3.5" />
              Curated Themes
            </button>
            <button
              type="button"
              onClick={() => setCoverModalTab("custom")}
              className={cn(
                "h-8 rounded-[8px] text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                coverModalTab === "custom"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ImageIcon className="size-3.5" />
              Custom Image
            </button>
          </div>

          {coverModalTab === "presets" ? (
            <div className="grid grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
              {COVER_PRESETS.map((preset) => {
                const isSelected =
                  coverConfig.type === "preset" &&
                  coverConfig.presetId === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={cn(
                      "p-3 rounded-[12px] border text-left transition-all cursor-pointer relative group flex flex-col justify-between h-[96px] overflow-hidden",
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "border-border/70 hover:border-border bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div
                      className="w-full h-5 rounded-md mb-2 shadow-xs"
                      style={{ background: preset.gradient }}
                    />
                    <div className="flex items-center justify-between w-full">
                      <div className="min-w-0 pr-1">
                        <span className="text-[13px] font-semibold text-foreground block truncate">
                          {preset.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {preset.description}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="size-4 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {coverConfig.type === "custom" && coverConfig.customUrl ? (
                <div className="space-y-3">
                  <div
                    className="relative h-28 w-full rounded-[12px] overflow-hidden border border-border bg-cover bg-center"
                    style={{ backgroundImage: `url(${coverConfig.customUrl})` }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 text-white backdrop-blur-xs">
                      Active custom banner
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="cursor-pointer text-[13px]"
                    >
                      <UploadCloud className="size-3.5 mr-1.5" />
                      {isUploadingCover ? "Uploading..." : "Replace image"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetCover}
                      className="cursor-pointer text-[13px] text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5 mr-1.5" />
                      Reset to default
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-[14px] p-8 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center space-y-2"
                >
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UploadCloud className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[14px] font-semibold text-foreground">
                      {isUploadingCover
                        ? "Uploading banner..."
                        : "Click to upload banner image"}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      PNG, JPEG, or WebP up to 5 MB. Wide images work best.
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCustomCoverUpload}
                disabled={isUploadingCover}
                className="sr-only"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/70">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetCover}
              className="text-[12px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Reset to Aurora
            </Button>
            <DialogClose
              render={
                <Button
                  type="button"
                  className="h-9 px-4 rounded-[8px] text-[13px] font-semibold cursor-pointer"
                >
                  Done
                </Button>
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
