import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { HabitDialog } from "@/components/habits/habit-dialog"
import { HabitList } from "@/components/habits/habit-list"

export default async function HabitsPage() {
  await connection()

  const supabase = await createClient()
  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    return (
      <div className="pt-7 md:pt-14 space-y-6">
        <p className="text-destructive">
          Failed to load habits. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <h1 className="text-[44px] md:text-[56px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
          Habits
        </h1>
        <HabitDialog
          trigger={
            <Button className="w-full mt-5 md:w-auto md:mt-0 h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer">
              New habit
            </Button>
          }
        />
      </div>

      <HabitList
        key={habits.map((h) => h.id).join(",")}
        habits={habits}
      />
    </div>
  )
}
