"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { HABIT_TEMPLATES } from "@/lib/habit-templates"

const habitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name must be between 1 and 80 characters")
    .max(80, "Name must be between 1 and 80 characters"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid 6-digit hex code"),
  frequency: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Select at least one day"),
  tags: z
    .array(z.string().trim().min(1).max(24))
    .max(10)
    .default([]),
})

const reorderSchema = z
  .array(z.string().uuid("Invalid habit ID"))
  .min(1, "At least one habit ID is required")
  .max(200, "Too many habit IDs")
  .refine((items) => new Set(items).size === items.length, {
    message: "Duplicate habit IDs are not allowed",
  })

export type HabitActionState = {
  error?: string
  success?: boolean
} | null

export async function createHabit(
  prevState: HabitActionState,
  formData: FormData
): Promise<HabitActionState> {
  const rawFrequency = formData.getAll("frequency").map((val) => Number(val))
  const rawTags = formData.getAll("tags").flatMap((t) =>
    typeof t === "string"
      ? t
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  )
  const parsed = habitSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    frequency: rawFrequency,
    tags: rawTags,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const { data: highestHabit } = await supabase
    .from("habits")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = highestHabit ? highestHabit.sort_order + 1 : 1

  const { error } = await supabase.from("habits").insert({
    name: parsed.data.name,
    color: parsed.data.color,
    frequency: parsed.data.frequency,
    tags: parsed.data.tags,
    sort_order: nextSortOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/habits")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateHabit(
  prevState: HabitActionState,
  formData: FormData
): Promise<HabitActionState> {
  const id = formData.get("id")
  if (typeof id !== "string" || !id.trim()) {
    return { error: "Habit ID is required" }
  }

  const rawFrequency = formData.getAll("frequency").map((val) => Number(val))
  const rawTags = formData.getAll("tags").flatMap((t) =>
    typeof t === "string"
      ? t
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  )
  const parsed = habitSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    frequency: rawFrequency,
    tags: rawTags,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const { error } = await supabase
    .from("habits")
    .update({
      name: parsed.data.name,
      color: parsed.data.color,
      frequency: parsed.data.frequency,
      tags: parsed.data.tags,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/habits")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function archiveHabit(id: string): Promise<HabitActionState> {
  if (!id || typeof id !== "string" || !id.trim()) {
    return { error: "Habit ID is required" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const { error } = await supabase
    .from("habits")
    .update({ archived: true })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/habits")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteHabit(id: string): Promise<HabitActionState> {
  if (!id || typeof id !== "string" || !id.trim()) {
    return { error: "Habit ID is required" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/habits")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function reorderHabits(
  ids: string[]
): Promise<{ error: string } | { success: true }> {
  const parsed = reorderSchema.safeParse(ids)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid habit IDs" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const { error } = await supabase.rpc("reorder_habits", {
    habit_ids: parsed.data,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/habits")
  revalidatePath("/dashboard")
  return { success: true }
}

const templateKeysSchema = z
  .array(z.string())
  .min(1, "Select at least one habit")
  .max(12, "Too many habit templates")
  .refine((keys) => new Set(keys).size === keys.length, {
    message: "Duplicate template keys are not allowed",
  })
  .refine(
    (keys) => keys.every((key) => HABIT_TEMPLATES.some((t) => t.key === key)),
    {
      message: "Unknown template key",
    }
  )

export async function createHabitsFromTemplates(
  keys: string[]
): Promise<{ error: string } | { success: true; added: number }> {
  const parsed = templateKeysSchema.safeParse(keys)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid template keys" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in" }
  }

  const selectedKeySet = new Set(parsed.data)
  const orderedTemplates = HABIT_TEMPLATES.filter((t) =>
    selectedKeySet.has(t.key)
  )

  const { data: highestHabit } = await supabase
    .from("habits")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const startSortOrder = highestHabit ? highestHabit.sort_order + 1 : 1

  const rows = orderedTemplates.map((template, index) => ({
    name: template.name,
    color: template.color,
    frequency: template.frequency,
    tags: [template.group],
    sort_order: startSortOrder + index,
  }))

  const { error } = await supabase.from("habits").insert(rows)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/habits")
  revalidatePath("/dashboard")
  return { success: true, added: rows.length }
}

