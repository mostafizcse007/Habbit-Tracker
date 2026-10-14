"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { isValidTimeZone } from "@/lib/timezone"

export type ProfileActionState = { error: string } | { success: true } | null

const profileSchema = z.object({
  full_name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length <= 60, {
      message: "Display name must be at most 60 characters",
    })
    .transform((val) => (val === "" ? null : val)),
  username: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2 && val.length <= 30, {
      message: "Username must be between 2 and 30 characters",
    })
    .refine((val) => /^[a-zA-Z0-9._-]+$/.test(val), {
      message:
        "Username may only contain letters, numbers, dots, underscores, and hyphens",
    }),
  timezone: z.string().refine(isValidTimeZone, {
    message: "Invalid time zone",
  }),
})

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })

export async function updateProfile(
  prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const rawFullName = formData.get("full_name")
  const rawUsername = formData.get("username")
  const rawTimezone = formData.get("timezone")

  const parsed = profileSchema.safeParse({
    full_name: typeof rawFullName === "string" ? rawFullName : "",
    username: typeof rawUsername === "string" ? rawUsername : "",
    timezone: typeof rawTimezone === "string" ? rawTimezone : "",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile data" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      username: parsed.data.username,
      timezone: parsed.data.timezone,
    })
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function updatePassword(
  prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const rawPassword = formData.get("password")
  const rawConfirm = formData.get("confirm")

  const parsed = passwordSchema.safeParse({
    password: typeof rawPassword === "string" ? rawPassword : "",
    confirm: typeof rawConfirm === "string" ? rawConfirm : "",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function saveDetectedTimezone(
  tz: string
): Promise<{ error: string } | { success: true }> {
  if (!isValidTimeZone(tz)) {
    return { error: "Invalid time zone" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ timezone: tz })
    .eq("id", user.id)
    .is("timezone", null)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateAvatar(
  path: string | null
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  if (path !== null) {
    const escapedId = user.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`^${escapedId}/[A-Za-z0-9-]+\\.(png|jpg|webp)$`)
    if (!regex.test(path)) {
      return { error: "Invalid file path" }
    }
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle()

  const oldPath = currentProfile?.avatar_path

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  if (oldPath && oldPath !== path) {
    try {
      await supabase.storage.from("avatars").remove([oldPath])
    } catch {}
  }

  revalidatePath("/", "layout")
  return { success: true }
}

