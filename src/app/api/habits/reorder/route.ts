import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const reorderPayloadSchema = z.union([
  z.object({
    habitIds: z
      .array(z.string().uuid("Invalid habit ID"))
      .min(1, "At least one habit ID is required")
      .max(200, "Too many habit IDs")
      .refine((items) => new Set(items).size === items.length, {
        message: "Duplicate habit IDs are not allowed",
      }),
  }),
  z.object({
    ids: z
      .array(z.string().uuid("Invalid habit ID"))
      .min(1, "At least one habit ID is required")
      .max(200, "Too many habit IDs")
      .refine((items) => new Set(items).size === items.length, {
        message: "Duplicate habit IDs are not allowed",
      }),
  }),
  z.object({
    order: z
      .array(
        z.object({
          id: z.string().uuid("Invalid habit ID"),
          position: z.number().int().optional(),
          sort_order: z.number().int().optional(),
        })
      )
      .min(1, "At least one habit is required")
      .max(200, "Too many habits"),
  }),
  z.array(z.string().uuid("Invalid habit ID")),
])

async function handleReorder(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const parseResult = reorderPayloadSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 }
      )
    }

    let habitIds: string[] = []
    const data = parseResult.data

    if (Array.isArray(data)) {
      habitIds = data
    } else if ("habitIds" in data && Array.isArray(data.habitIds)) {
      habitIds = data.habitIds
    } else if ("ids" in data && Array.isArray(data.ids)) {
      habitIds = data.ids
    } else if ("order" in data && Array.isArray(data.order)) {
      // Sort by position / sort_order if provided, else keep array order
      const sorted = [...data.order].sort((a, b) => {
        const posA = a.position ?? a.sort_order ?? 0
        const posB = b.position ?? b.sort_order ?? 0
        return posA - posB
      })
      habitIds = sorted.map((item) => item.id)
    }

    if (habitIds.length === 0) {
      return NextResponse.json(
        { error: "No habit IDs provided" },
        { status: 400 }
      )
    }

    // Try RPC first for atomic update
    const { error: rpcError } = await supabase.rpc("reorder_habits", {
      habit_ids: habitIds,
    })

    // If RPC is unavailable or failed, fall back to direct updates
    if (rpcError) {
      const updates = habitIds.map((id, index) =>
        supabase
          .from("habits")
          .update({ sort_order: index + 1 })
          .eq("id", id)
          .eq("user_id", user.id)
      )

      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)
      if (failed?.error) {
        return NextResponse.json(
          { error: failed.error.message },
          { status: 500 }
        )
      }
    }

    revalidatePath("/habits")
    revalidatePath("/dashboard")
    revalidatePath("/analytics")
    revalidatePath("/profile")

    return NextResponse.json({
      success: true,
      reorderedCount: habitIds.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  return handleReorder(request)
}

export async function POST(request: Request) {
  return handleReorder(request)
}
