import { notFound } from "next/navigation"
import { connection } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { HabitDetail } from "@/components/habits/habit-detail"

interface HabitPageProps {
  params: Promise<{ id: string }>
}

const idSchema = z.string().uuid()

export default async function HabitPage({ params }: HabitPageProps) {
  await connection()
  const { id } = await params

  const parseResult = idSchema.safeParse(id)
  if (!parseResult.success) {
    notFound()
  }

  const supabase = await createClient()
  const { data: habit, error } = await supabase
    .from("habits")
    .select("*")
    .eq("id", id)
    .eq("archived", false)
    .maybeSingle()

  if (error || !habit) {
    notFound()
  }

  return <HabitDetail habit={habit} />
}
