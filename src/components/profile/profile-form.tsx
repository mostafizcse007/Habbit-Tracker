"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import type { Profile } from "@/types"
import { getTimeZoneList } from "@/lib/timezone"
import { updateProfile } from "@/app/(app)/profile/actions"

interface ProfileFormProps {
  profile: Profile | null
  email: string
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null)
  const timeZones = getTimeZoneList()

  const [detectedTz, setDetectedTz] = useState<string>("UTC")
  const [selectedTz, setSelectedTz] = useState<string>(
    profile?.timezone ?? "UTC"
  )

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (resolved) {
        setDetectedTz(resolved)
        if (!profile?.timezone) {
          setSelectedTz(resolved)
        }
      }
    })
    return () => cancelAnimationFrame(handle)
  }, [profile?.timezone])

  useEffect(() => {
    if (state && "success" in state) {
      toast.success("Saved.")
    }
  }, [state])

  return (
    <form action={formAction}>
      <div className="p-6 md:p-8 border-t border-border grid md:grid-cols-[260px_1fr] gap-6 md:gap-8">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">
            Details
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Your display name, username, and account email.
          </p>
        </div>

        <div className="w-full max-w-[440px] space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="full_name"
              className="text-[14px] font-medium text-foreground block"
            >
              Display name
            </label>
            <input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              maxLength={60}
              placeholder="Your name"
              className="h-11 w-full rounded-lg px-3.5 text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-[14px] font-medium text-foreground block"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              defaultValue={profile?.username ?? ""}
              required
              minLength={2}
              maxLength={30}
              placeholder="username"
              className="h-11 w-full rounded-lg px-3.5 text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-[14px] font-medium text-foreground block"
            >
              Email
            </label>
            <input
              id="email"
              value={email}
              disabled
              className="h-11 w-full rounded-lg px-3.5 text-[15px] border border-input bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <p className="text-[13px] text-muted-foreground">
              Changing your email is not available yet.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 border-t border-border grid md:grid-cols-[260px_1fr] gap-6 md:gap-8">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">
            Time zone
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Used to calculate your streaks, check-in cutoffs, and today&apos;s habits.
          </p>
        </div>

        <div className="w-full max-w-[440px] space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="timezone"
              className="text-[14px] font-medium text-foreground block"
            >
              Time zone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={selectedTz}
              onChange={(e) => setSelectedTz(e.target.value)}
              className="h-11 w-full rounded-lg px-3.5 text-[15px] border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              {timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-[13px] text-muted-foreground">
              This device: {detectedTz}
            </p>
            <button
              type="button"
              onClick={() => setSelectedTz(detectedTz)}
              className="text-[13px] font-medium text-foreground underline underline-offset-4 cursor-pointer hover:text-muted-foreground transition-colors"
            >
              Use this device&apos;s time zone
            </button>
          </div>

          {state && "error" in state && (
            <p role="alert" className="text-[14px] text-destructive">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-60 transition-opacity"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  )
}
