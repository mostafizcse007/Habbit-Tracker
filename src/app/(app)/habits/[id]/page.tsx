import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { HabitDetail } from "@/components/habits/habit-detail"

interface HabitPageProps {
  params: Promise<{ id: string }>
}

const idSchema = z.string().uuid()

export async function generateMetadata({
  params,
}: HabitPageProps): Promise<Metadata> {
  const { id } = await params
  const parseResult = idSchema.safeParse(id)
  if (!parseResult.success) {
    return {
      title: "Habit",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const supabase = await createClient()
  const { data: habit } = await supabase
    .from("habits")
    .select("name")
    .eq("id", id)
    .eq("archived", false)
    .maybeSingle()

  return {
    title: habit?.name || "Habit",
    robots: {
      index: false,
      follow: false,
    },
  }
}

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
