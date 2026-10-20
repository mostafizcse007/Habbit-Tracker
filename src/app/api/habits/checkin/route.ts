import { NextResponse } from "next/server"
import { toggleHabitLog } from "@/app/(app)/dashboard/actions"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const habitId = body.habitId || body.habit_id
    const date = body.date || body.completed_on
    const completed =
      typeof body.completed === "boolean"
        ? body.completed
        : typeof body.isCompleted === "boolean"
        ? body.isCompleted
        : true

    if (!habitId || typeof habitId !== "string") {
      return NextResponse.json(
        { error: "habitId is required" },
        { status: 400 }
      )
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      )
    }

    const result = await toggleHabitLog(habitId, date, completed)

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
